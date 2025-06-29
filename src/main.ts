import { AudioService } from '@domain/audio/AudioService.ts'
import { KeyboardService } from '@domain/keyboard/KeyboardService.ts'
import { Hotkey } from '@domain/keyboard/Hotkey.ts'
import { BunRuntime } from '@effect/platform-bun'
import { Console, Effect, Layer } from 'effect'
import { KeyboardServiceFactory } from '@infrastructure/keyboard/KeyboardServiceFactory.ts'
import { DEFAULT_RECORDING_HOTKEY } from '@shared/constants.ts'

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

  return 'UltraWhisper ready'
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

const runnable = Effect.gen(function* () {
  yield* Console.log('🔧 Initializing keyboard service...')
  
  const keyboardServiceLayer = yield* KeyboardServiceFactory.pipe(
    Effect.catchAll((error) => 
      Effect.gen(function* () {
        yield* Console.error(`❌ Keyboard service failed: ${error}`)
        yield* Console.log('💡 Using mock keyboard service')
        return Layer.succeed(KeyboardService, KeyboardService.of({
          registerHotkey: () => Effect.log('Mock: registerHotkey called'),
          unregisterHotkey: () => Effect.log('Mock: unregisterHotkey called'),
          keyEvents: () => Effect.die('Mock: keyEvents not implemented'),
        }))
      })
    )
  )
  
  const mainLayer = Layer.mergeAll(MockAudioService, keyboardServiceLayer)
  
  return yield* program.pipe(Effect.provide(mainLayer))
}).pipe(Effect.scoped)

BunRuntime.runMain(runnable.pipe(Effect.orElse(() => Effect.succeed('Failed but continuing'))))
