import { AudioService } from '@domain/audio/AudioService.ts'
import { Hotkey } from '@domain/keyboard/Hotkey.ts'
import { KeyboardService } from '@domain/keyboard/KeyboardService.ts'
import { BunRuntime } from '@effect/platform-bun'
import { KeyboardServiceFactory } from '@infrastructure/keyboard/KeyboardServiceFactory.ts'
import { DEFAULT_RECORDING_HOTKEY } from '@shared/constants.ts'
import { Console, Effect, Layer, Stream } from 'effect'

const program = Effect.gen(function* () {
  yield* Console.log('🎙️  UltraWhisper starting...')

  const _audio = yield* AudioService
  const keyboard = yield* KeyboardService

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
      Console.log(
        `🔥 HOTKEY PRESSED! Key: ${event.key}, Modifiers: ${event.modifiers.join('+')}, Type: ${event.type}`,
      ),
    ),
    Stream.runDrain,
  )

  return 'UltraWhisper stopped'
})

const MockAudioService = Layer.succeed(
  AudioService,
  AudioService.of({
    startRecording: Effect.void,
    stopRecording: Effect.die('Not implemented'),
    getAudioStream: Effect.die('Not implemented'),
    saveRecording: () => Effect.void,
  }),
)

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
    const mainLayer = Layer.mergeAll(MockAudioService, keyboardServiceLayer)
    return program.pipe(Effect.provide(mainLayer))
  }),
)

BunRuntime.runMain(
  runnable.pipe(
    Effect.scoped,
    Effect.orElse(() => Effect.succeed('Failed but continuing')),
  ),
)
