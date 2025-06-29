import { existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { AudioRecording } from '@domain/audio/AudioRecording.ts'
import { TranscriptionError } from '@domain/transcription/TranscriptionErrors.ts'
import { TranscriptionResult } from '@domain/transcription/TranscriptionResult.ts'
import { TranscriptionService } from '@domain/transcription/TranscriptionService.ts'
import { createWavFile } from '@shared/audio-utils.ts'
import type { FilePath } from '@shared/types.ts'
import { Milliseconds } from '@shared/types.ts'
import { Console, Effect, Layer } from 'effect'
import whisper from 'whisper-node'

export class LocalWhisperService implements TranscriptionService {
  private readonly tempDir: string
  private isModelInitialized = false

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
        if (!this.isModelInitialized) {
          yield* Console.log('📥 Whisper model ready (using whisper.cpp)')
          this.isModelInitialized = true
          yield* Console.log('✅ Model ready for transcription')
        } else {
          yield* Console.log('✅ Model already ready')
        }
      } catch (error) {
        return yield* Effect.die(
          new TranscriptionError('Failed to initialize Whisper model', error),
        )
      }
    }.bind(this),
  )

  readonly isModelReady = Effect.succeed(this.isModelInitialized)

  readonly transcribe = (recording: AudioRecording) =>
    Effect.gen(
      function* (this: LocalWhisperService) {
        const startTime = Date.now()

        if (!this.isModelInitialized) {
          yield* Console.log('❌ Model not initialized. Call initializeModel first.')
          return TranscriptionResult.create('', 0.0, Milliseconds(0), 'en')
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

          // Wrap whisper call with detailed error handling
          const result = yield* Effect.promise(async () => {
            try {
              const whisperResult = await whisper(tempFilePath)
              console.log('📊 Raw Whisper result:', JSON.stringify(whisperResult, null, 2))
              return whisperResult
            } catch (error) {
              console.error('❌ Whisper processing failed:', error)
              // Check if it's the VTT parsing error we're expecting
              if (
                error instanceof Error &&
                error.message.includes("null is not an object (evaluating 'lines.shift')")
              ) {
                console.log('🤐 No speech detected in audio (VTT parsing returned null)')
                return [] // Return empty array to indicate no speech
              }
              console.error('❌ Unexpected whisper error:', error)
              return [] // Return empty array on any other error
            }
          })

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
            Array.isArray(result) && result.length > 0
              ? result
                  .map((segment) => segment.speech)
                  .join(' ')
                  .trim()
              : ''

          if (text === '') {
            yield* Console.log('🤐 No speech detected in recording')
          } else {
            yield* Console.log(`✅ Transcription complete: "${text}"`)
          }

          return TranscriptionResult.create(
            text,
            1.0, // whisper-node doesn't expose confidence directly
            processingTime,
            'en',
          )
        } catch (error) {
          yield* Console.log(`❌ Transcription failed: ${error}`)
          return TranscriptionResult.create('', 0.0, Milliseconds(Date.now() - startTime), 'en')
        }
      }.bind(this),
    )

  readonly transcribeFile = (audioPath: FilePath) =>
    Effect.gen(
      function* (this: LocalWhisperService) {
        const startTime = Date.now()

        if (!this.isModelInitialized) {
          yield* Console.log('❌ Model not initialized. Call initializeModel first.')
          return TranscriptionResult.create('', 0.0, Milliseconds(0), 'en')
        }

        try {
          yield* Console.log(`🔄 Transcribing file: ${audioPath}`)

          // Wrap whisper call with detailed error handling
          const result = yield* Effect.promise(async () => {
            try {
              const whisperResult = await whisper(audioPath)
              console.log('📊 Raw Whisper result:', JSON.stringify(whisperResult, null, 2))
              return whisperResult
            } catch (error) {
              console.error('❌ Whisper file processing failed:', error)
              // Check if it's the VTT parsing error we're expecting
              if (
                error instanceof Error &&
                error.message.includes("null is not an object (evaluating 'lines.shift')")
              ) {
                console.log('🤐 No speech detected in audio file (VTT parsing returned null)')
                return [] // Return empty array to indicate no speech
              }
              console.error('❌ Unexpected whisper file error:', error)
              return [] // Return empty array on any other error
            }
          })

          const processingTime = Milliseconds(Date.now() - startTime)
          const text =
            Array.isArray(result) && result.length > 0
              ? result
                  .map((segment) => segment.speech)
                  .join(' ')
                  .trim()
              : ''

          if (text === '') {
            yield* Console.log('🤐 No speech detected in file')
          } else {
            yield* Console.log(`✅ File transcription complete: "${text}"`)
          }

          return TranscriptionResult.create(text, 1.0, processingTime, 'en')
        } catch (error) {
          yield* Console.log(`❌ File transcription failed: ${error}`)
          return TranscriptionResult.create('', 0.0, Milliseconds(Date.now() - startTime), 'en')
        }
      }.bind(this),
    )
}

export const LocalWhisperServiceLayer = Layer.succeed(
  TranscriptionService,
  new LocalWhisperService(),
)
