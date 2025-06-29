import type { AudioRecording } from '@domain/audio/AudioRecording.ts'
import { TranscriptionResult } from '@domain/transcription/TranscriptionResult.ts'
import { TranscriptionService } from '@domain/transcription/TranscriptionService.ts'
import type { FilePath } from '@shared/types.ts'
import { Milliseconds } from '@shared/types.ts'
import { Console, Effect, Layer } from 'effect'

export class MockTranscriptionService implements TranscriptionService {
  readonly initializeModel = Effect.gen(function* () {
    yield* Console.log('🤖 Mock transcription service initialized')
  })

  readonly isModelReady = Effect.succeed(true)

  readonly transcribe = (recording: AudioRecording) =>
    Effect.gen(function* () {
      yield* Console.log('🔄 Mock transcribing audio...')

      // Simulate processing time
      yield* Effect.sleep(500)

      const processingTime = Milliseconds(500)
      const mockText = `Mock transcription of ${Math.round(recording.duration / 1000)}s audio (${recording.data.length} bytes)`

      return TranscriptionResult.create(mockText, 0.95, processingTime, 'en')
    })

  readonly transcribeFile = (audioPath: FilePath) =>
    Effect.gen(function* () {
      yield* Console.log(`🔄 Mock transcribing file: ${audioPath}`)
      yield* Effect.sleep(300)

      const processingTime = Milliseconds(300)
      const mockText = `Mock transcription of file: ${audioPath}`

      return TranscriptionResult.create(mockText, 0.95, processingTime, 'en')
    })
}

export const MockTranscriptionServiceLayer = Layer.succeed(
  TranscriptionService,
  new MockTranscriptionService(),
)
