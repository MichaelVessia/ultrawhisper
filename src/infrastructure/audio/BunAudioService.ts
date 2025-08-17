import { AudioRecording } from '@domain/audio/AudioRecording.ts'
import { AudioService } from '@domain/audio/AudioService.ts'
import type { FilePath } from '@shared/types.ts'
import { Milliseconds } from '@shared/types.ts'
import { Effect, Layer, Ref, Stream } from 'effect'

export class BunAudioService implements AudioService {
  private recordingProcessRef = Ref.unsafeMake<Bun.Subprocess | null>(null)
  private audioBufferRef = Ref.unsafeMake<Uint8Array | null>(null)
  private startTimeRef = Ref.unsafeMake<number | null>(null)

  readonly startRecording = Effect.gen(
    function* (this: BunAudioService) {
      const currentProcess = yield* Ref.get(this.recordingProcessRef)
      if (currentProcess !== null) {
        return // Already recording
      }

      // Clear previous audio data and set start time
      yield* Ref.set(this.audioBufferRef, null)
      yield* Ref.set(this.startTimeRef, Date.now())

      // Start ffmpeg process for WAV recording
      // -f alsa: Use ALSA input
      // -i hw:0,0: Use first capture device (most common setup)
      // -f wav: Output WAV format
      // -ar 16000: 16kHz sample rate (Whisper requirement)
      // -ac 1: Mono audio (Whisper compatible)
      // pipe:1: Output to stdout
      const proc = Bun.spawn(
        ['ffmpeg', '-f', 'alsa', '-i', 'hw:0,0', '-f', 'wav', '-ar', '16000', '-ac', '1', 'pipe:1'],
        {
          stdout: 'pipe',
          stderr: 'pipe', // Capture ffmpeg's verbose output
        },
      )

      yield* Ref.set(this.recordingProcessRef, proc)
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

      // Terminate the recording process
      currentProcess.kill()
      yield* Ref.set(this.recordingProcessRef, null)

      // Calculate duration
      const duration = Milliseconds(Date.now() - startTime)

      // Read all stdout data (WAV format)
      if (!currentProcess.stdout || typeof currentProcess.stdout === 'number') {
        return yield* Effect.die('No audio data captured')
      }

      const audioData = yield* Effect.promise(() =>
        new Response(currentProcess.stdout as ReadableStream).arrayBuffer(),
      )
      const wavData = new Uint8Array(audioData)

      return new AudioRecording({
        data: wavData,
        format: 'wav',
        duration,
        sampleRate: 16000,
        channels: 1,
      })
    }.bind(this),
  )

  readonly getAudioStream = Stream.async<Uint8Array, never>((emit) => {
    const currentProcess = Effect.runSync(Ref.get(this.recordingProcessRef))
    if (currentProcess === null) {
      emit.die('No recording in progress')
      return
    }

    // Stream audio data directly from parecord stdout
    if (!currentProcess.stdout || typeof currentProcess.stdout === 'number') {
      emit.die('No audio stream available')
      return
    }

    const reader = (currentProcess.stdout as ReadableStream).getReader()

    const readData = async () => {
      try {
        while (true) {
          const result = await reader.read()
          if (result.done) break

          if (result.value) {
            emit.single(new Uint8Array(result.value))
          }
        }
        emit.end()
      } catch (error) {
        emit.die(`Stream error: ${error}`)
      }
    }

    readData()
  })

  readonly saveRecording = (recording: AudioRecording, path: FilePath) =>
    Effect.gen(function* () {
      const file = Bun.file(path)
      yield* Effect.promise(() => Bun.write(file, recording.data))
    })
}

export const BunAudioServiceLayer = Layer.succeed(AudioService, new BunAudioService())
