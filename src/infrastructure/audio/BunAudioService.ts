import { AudioRecording } from '@domain/audio/AudioRecording.ts'
import { AudioService } from '@domain/audio/AudioService.ts'
import type { FilePath } from '@shared/types.ts'
import { Milliseconds } from '@shared/types.ts'
import { Effect, Layer, Ref, Stream } from 'effect'

export class BunAudioService implements AudioService {
  private recordingProcessRef = Ref.unsafeMake<AbortController | null>(null)
  private audioDataRef = Ref.unsafeMake<Uint8Array[]>([])
  private startTimeRef = Ref.unsafeMake<number | null>(null)

  readonly startRecording = Effect.gen(
    function* (this: BunAudioService) {
      const currentProcess = yield* Ref.get(this.recordingProcessRef)
      if (currentProcess !== null) {
        return // Already recording
      }

      // Clear previous audio data
      yield* Ref.set(this.audioDataRef, [])
      yield* Ref.set(this.startTimeRef, Date.now())

      // Create abort controller to manage the recording process
      const controller = new AbortController()
      yield* Ref.set(this.recordingProcessRef, controller)

      // Start arecord process in background to collect audio data
      Effect.runFork(
        Effect.gen(
          function* (this: BunAudioService) {
            try {
              // Use arecord to capture raw PCM audio data
              // -r 16000: 16kHz sample rate (required by Whisper)
              // -f S16_LE: 16-bit signed little endian
              // -c 1: mono (Whisper works better with mono)
              // -t raw: output raw PCM data
              const proc = Bun.spawn(
                ['arecord', '-r', '16000', '-f', 'S16_LE', '-c', '1', '-t', 'raw'],
                {
                  stdout: 'pipe',
                  signal: controller.signal,
                },
              )

              if (proc.stdout) {
                const reader = proc.stdout.getReader()

                while (!controller.signal.aborted) {
                  const result = yield* Effect.promise(() => reader.read())
                  if (result.done) break

                  if (result.value) {
                    yield* Ref.update(this.audioDataRef, (chunks) => [
                      ...chunks,
                      new Uint8Array(result.value),
                    ])
                  }
                }
              }
            } catch (_error) {
              // Recording stopped or failed
            }
          }.bind(this),
        ),
      )
    }.bind(this),
  )

  readonly stopRecording = Effect.gen(
    function* (this: BunAudioService) {
      const currentProcess = yield* Ref.get(this.recordingProcessRef)
      if (currentProcess === null) {
        return yield* Effect.die('No recording in progress')
      }

      const startTime = yield* Ref.get(this.startTimeRef)
      if (startTime === null) {
        return yield* Effect.die('No start time recorded')
      }

      // Stop the recording process
      currentProcess.abort()
      yield* Ref.set(this.recordingProcessRef, null)

      // Calculate duration
      const duration = Milliseconds(Date.now() - startTime)

      // Combine all audio chunks
      const audioChunks = yield* Ref.get(this.audioDataRef)
      const totalLength = audioChunks.reduce(
        (sum: number, chunk: Uint8Array) => sum + chunk.length,
        0,
      )
      const combinedData = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of audioChunks) {
        combinedData.set(chunk, offset)
        offset += chunk.length
      }

      return new AudioRecording({
        data: combinedData,
        format: 'wav',
        duration,
        sampleRate: 16000, // 16kHz required by Whisper
        channels: 1, // mono
      })
    }.bind(this),
  )

  readonly getAudioStream = Stream.async<Uint8Array, never>((emit) => {
    const currentProcess = Effect.runSync(Ref.get(this.recordingProcessRef))
    if (currentProcess === null) {
      emit.die('No recording in progress')
      return
    }

    // Stream audio data as it's being collected
    const checkForNewData = () => {
      const audioChunks = Effect.runSync(Ref.get(this.audioDataRef))
      if (audioChunks.length > 0) {
        // Emit the latest chunk
        const latestChunk = audioChunks[audioChunks.length - 1]
        if (latestChunk) {
          emit.single(latestChunk)
        }
      }

      if (!currentProcess.signal.aborted) {
        setTimeout(checkForNewData, 100) // Check every 100ms
      } else {
        emit.end()
      }
    }

    checkForNewData()
  })

  readonly saveRecording = (recording: AudioRecording, path: FilePath) =>
    Effect.gen(function* () {
      const file = Bun.file(path)
      yield* Effect.promise(() => Bun.write(file, recording.data))
    })
}

export const BunAudioServiceLayer = Layer.succeed(AudioService, new BunAudioService())
