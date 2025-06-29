import { AudioService } from '@domain/audio/AudioService.ts'
import { ClipboardService } from '@domain/clipboard/ClipboardService.ts'
import { Hotkey } from '@domain/keyboard/Hotkey.ts'
import { KeyboardService } from '@domain/keyboard/KeyboardService.ts'
import { TranscriptionService } from '@domain/transcription/TranscriptionService.ts'
import { BunRuntime } from '@effect/platform-bun'
import { BunAudioServiceLayer } from '@infrastructure/audio/BunAudioService.ts'
import { LinuxClipboardServiceLayer } from '@infrastructure/clipboard/LinuxClipboardService.ts'
import { KeyboardServiceFactory } from '@infrastructure/keyboard/KeyboardServiceFactory.ts'
import { LocalWhisperServiceLayer } from '@infrastructure/transcription/LocalWhisperService.ts'
import { DEFAULT_RECORDING_HOTKEY } from '@shared/constants.ts'
import { Console, Effect, Layer, Ref, Stream } from 'effect'

const program = Effect.gen(function* () {
  yield* Console.log('🎙️  UltraWhisper starting...')

  const audio = yield* AudioService
  const keyboard = yield* KeyboardService
  const transcription = yield* TranscriptionService
  const clipboard = yield* ClipboardService

  // Track recording state
  const isRecordingRef = yield* Ref.make(false)

  // Initialize Whisper model
  yield* transcription.initializeModel

  yield* Console.log('✅ Services initialized')

  const recordingHotkey = Hotkey.fromString(DEFAULT_RECORDING_HOTKEY)
  yield* Console.log(`📋 Registering hotkey: ${recordingHotkey.toString()}`)

  yield* keyboard.registerHotkey(recordingHotkey)
  yield* Console.log('⌨️  Global hotkey registered successfully!')
  yield* Console.log(`🎤 Press ${DEFAULT_RECORDING_HOTKEY} to start/stop recording`)
  yield* Console.log('👂 Listening for hotkey events... (Press Ctrl+C to exit)')

  // Start listening for hotkey events and keep the app running
  const keyStream = keyboard.keyEvents()
  yield* keyStream.pipe(
    Stream.tap((event) =>
      Effect.gen(function* () {
        yield* Console.log(
          `🔥 HOTKEY PRESSED! Key: ${event.key}, Modifiers: ${event.modifiers.join('+')}, Type: ${event.type}`,
        )

        const isRecording = yield* Ref.get(isRecordingRef)

        if (!isRecording) {
          // Start recording
          yield* Console.log('🎤 Starting recording...')
          yield* audio.startRecording
          yield* Ref.set(isRecordingRef, true)
          yield* Console.log('🔴 Recording started! Press hotkey again to stop.')
        } else {
          // Stop recording
          yield* Console.log('⏹️  Stopping recording...')
          const recording = yield* audio.stopRecording
          yield* Ref.set(isRecordingRef, false)
          yield* Console.log(
            `✅ Recording stopped! Duration: ${recording.duration}ms, Size: ${recording.data.length} bytes`,
          )

          // Transcribe the recording
          yield* Console.log('🔄 Transcribing audio...')
          const result = yield* transcription.transcribe(recording)

          if (result.isEmpty) {
            yield* Console.log('🤐 No speech detected in recording')
          } else {
            yield* Console.log(`📝 Transcription (${result.processingTime}ms): "${result.text}"`)
            
            // Copy to clipboard
            yield* Console.log('📋 Copying to clipboard...')
            yield* clipboard.writeText(result.text)
            yield* Console.log('✅ Text copied to clipboard!')
          }
        }
      }),
    ),
    Stream.runDrain,
  )

  return 'UltraWhisper stopped'
})

const runnable = KeyboardServiceFactory.pipe(
  Effect.catchAll((error) =>
    Effect.gen(function* () {
      yield* Console.error(`❌ Keyboard service failed: ${error}`)
      yield* Console.log('💡 Using mock keyboard service')
      return Layer.succeed(
        KeyboardService,
        KeyboardService.of({
          registerHotkey: () => Effect.log('Mock: registerHotkey called'),
          unregisterHotkey: () => Effect.log('Mock: unregisterHotkey called'),
          keyEvents: () => Effect.die('Mock: keyEvents not implemented'),
        }),
      )
    }),
  ),
  Effect.flatMap((keyboardServiceLayer) => {
    const mainLayer = Layer.mergeAll(
      BunAudioServiceLayer,
      keyboardServiceLayer,
      LocalWhisperServiceLayer,
      LinuxClipboardServiceLayer,
    )
    return program.pipe(Effect.provide(mainLayer))
  }),
)

BunRuntime.runMain(
  runnable.pipe(
    Effect.scoped,
    Effect.orElse(() => Effect.succeed('Failed but continuing')),
  ),
)
