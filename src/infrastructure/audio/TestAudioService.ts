import { AudioRecording } from '@domain/audio/AudioRecording.ts'
import { AudioService } from '@domain/audio/AudioService.ts'
import type { FilePath } from '@shared/types.ts'
import { Milliseconds } from '@shared/types.ts'
import { Effect, Layer, Ref, Stream } from 'effect'

export interface TestAudioServiceConfig {
  readonly testFilePath: FilePath
}

export class TestAudioService implements AudioService {
  private recordingStateRef = Ref.unsafeMake<'idle' | 'recording'>('idle')
  private testAudioDataRef = Ref.unsafeMake<Uint8Array | null>(null)
  private startTimeRef = Ref.unsafeMake<number | null>(null)

  constructor(private config: TestAudioServiceConfig) {}

  readonly startRecording = Effect.gen(
    function* (this: TestAudioService) {
      const currentState = yield* Ref.get(this.recordingStateRef)
      if (currentState === 'recording') {
        return // Already recording
      }

      // Load the test WAV file
      const file = Bun.file(this.config.testFilePath)
      const audioData = yield* Effect.tryPromise({
        try: () => file.arrayBuffer(),
        catch: (error) => new Error(`Failed to read test file: ${error}`),
      }).pipe(Effect.orDie)

      yield* Ref.set(this.testAudioDataRef, new Uint8Array(audioData))
      yield* Ref.set(this.startTimeRef, Date.now())
      yield* Ref.set(this.recordingStateRef, 'recording')
    }.bind(this),
  )

  readonly stopRecording = Effect.gen(
    function* (this: TestAudioService) {
      const currentState = yield* Ref.get(this.recordingStateRef)
      if (currentState !== 'recording') {
        return yield* Effect.die('No recording in progress')
      }

      const startTime = yield* Ref.get(this.startTimeRef)
      if (startTime === null) {
        return yield* Effect.die('No start time recorded')
      }

      const audioData = yield* Ref.get(this.testAudioDataRef)
      if (audioData === null) {
        return yield* Effect.die('No test audio data loaded')
      }

      // Reset state
      yield* Ref.set(this.recordingStateRef, 'idle')
      yield* Ref.set(this.testAudioDataRef, null)

      // Calculate simulated duration (use actual time elapsed for realism)
      const duration = Milliseconds(Date.now() - startTime)

      return new AudioRecording({
        data: audioData,
        format: 'wav',
        duration,
        sampleRate: 16000, // Assume standard Whisper format
        channels: 1,
      })
    }.bind(this),
  )

  readonly getAudioStream = Stream.async<Uint8Array, never>((emit) => {
    const currentState = Effect.runSync(Ref.get(this.recordingStateRef))
    if (currentState !== 'recording') {
      emit.die('No recording in progress')
      return
    }

    const audioData = Effect.runSync(Ref.get(this.testAudioDataRef))
    if (audioData === null) {
      emit.die('No test audio data available')
      return
    }

    // Simulate streaming by chunking the data
    const chunkSize = 4096
    let offset = 0

    const sendChunks = () => {
      const interval = setInterval(() => {
        if (offset >= audioData.length) {
          clearInterval(interval)
          emit.end()
          return
        }

        const chunk = audioData.slice(offset, offset + chunkSize)
        emit.single(chunk)
        offset += chunkSize
      }, 100) // Send chunk every 100ms to simulate real-time streaming
    }

    sendChunks()
  })

  readonly saveRecording = (recording: AudioRecording, path: FilePath) =>
    Effect.gen(function* () {
      const file = Bun.file(path)
      yield* Effect.promise(() => Bun.write(file, recording.data))
    })
}

export const createTestAudioServiceLayer = (config: TestAudioServiceConfig) =>
  Layer.succeed(AudioService, new TestAudioService(config))
