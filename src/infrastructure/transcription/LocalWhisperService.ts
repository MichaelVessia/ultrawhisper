import { existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { AudioRecording } from '@domain/audio/AudioRecording.ts'
import {
  type AudioFormatError,
  type ModelNotFoundError,
  TranscriptionError,
} from '@domain/transcription/TranscriptionErrors.ts'
import { TranscriptionResult } from '@domain/transcription/TranscriptionResult.ts'
import { TranscriptionService } from '@domain/transcription/TranscriptionService.ts'
import { createWavFile } from '@shared/audio-utils.ts'
import type { FilePath } from '@shared/types.ts'
import { Milliseconds } from '@shared/types.ts'
import { type Pipeline, pipeline } from '@xenova/transformers'
import { Console, Effect, Layer } from 'effect'

export class LocalWhisperService implements TranscriptionService {
  private readonly tempDir: string
  private transcriber: Pipeline | null = null

  constructor() {
    this.tempDir = join(homedir(), '.ultrawhisper', 'temp')

    // Ensure temp directory exists
    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true })
    }
  }

  readonly initializeModel = Effect.gen(
    function* (this: LocalWhisperService) {
      yield* Console.log('🤖 Initializing Whisper model...')

      try {
        if (!this.transcriber) {
          yield* Console.log('📥 Loading Whisper model (first time may take a moment)...')
          this.transcriber = yield* Effect.promise(() =>
            pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en'),
          )
          yield* Console.log('✅ Model loaded successfully')
        } else {
          yield* Console.log('✅ Model already loaded')
        }
      } catch (error) {
        return yield* Effect.die(
          new TranscriptionError('Failed to initialize Whisper model', error),
        )
      }
    }.bind(this),
  )

  readonly isModelReady = Effect.gen(
    function* (this: LocalWhisperService) {
      return this.transcriber !== null
    }.bind(this),
  )

  readonly transcribe = (recording: AudioRecording) =>
    Effect.gen(
      function* (this: LocalWhisperService) {
        const startTime = Date.now()

        if (!this.transcriber) {
          return yield* Effect.die(
            new TranscriptionError('Model not initialized. Call initializeModel first.'),
          )
        }

        try {
          // Convert raw PCM to WAV format
          const wavData = createWavFile(
            recording.data,
            recording.sampleRate,
            recording.channels,
            16, // 16-bit depth
          )

          // Save to temporary file
          const tempFilePath = join(this.tempDir, `recording_${Date.now()}.wav`)
          yield* Effect.promise(() => Bun.write(tempFilePath, wavData))

          yield* Console.log('🔄 Transcribing audio...')
          const result = yield* Effect.promise(() => this.transcriber!(tempFilePath))

          // Clean up temp file
          yield* Effect.promise(() =>
            Bun.file(tempFilePath)
              .exists()
              .then((exists) => {
                if (exists) Bun.file(tempFilePath).unlink()
              }),
          )

          const processingTime = Milliseconds(Date.now() - startTime)
          const text =
            typeof result === 'object' && result && 'text' in result
              ? String(result.text).trim()
              : String(result).trim()

          return TranscriptionResult.create(
            text,
            1.0, // Transformers.js doesn't expose confidence directly
            processingTime,
            'en',
          )
        } catch (error) {
          return yield* Effect.die(new TranscriptionError('Transcription failed', error))
        }
      }.bind(this),
    )

  readonly transcribeFile = (audioPath: FilePath) =>
    Effect.gen(
      function* (this: LocalWhisperService) {
        const startTime = Date.now()

        if (!this.transcriber) {
          return yield* Effect.die(
            new TranscriptionError('Model not initialized. Call initializeModel first.'),
          )
        }

        try {
          yield* Console.log(`🔄 Transcribing file: ${audioPath}`)
          const result = yield* Effect.promise(() => this.transcriber!(audioPath))

          const processingTime = Milliseconds(Date.now() - startTime)
          const text =
            typeof result === 'object' && result && 'text' in result
              ? String(result.text).trim()
              : String(result).trim()

          return TranscriptionResult.create(text, 1.0, processingTime, 'en')
        } catch (error) {
          return yield* Effect.die(new TranscriptionError('File transcription failed', error))
        }
      }.bind(this),
    )
}

export const LocalWhisperServiceLayer = Layer.succeed(
  TranscriptionService,
  new LocalWhisperService(),
)
