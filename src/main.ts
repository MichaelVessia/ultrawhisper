import { AudioService } from '@domain/audio/AudioService.ts'
import { KeyboardService } from '@domain/keyboard/KeyboardService.ts'
import { BunRuntime } from '@effect/platform-bun'
import { Console, Effect, Layer } from 'effect'

const program = Effect.gen(function* () {
  yield* Console.log('🎙️  UltraWhisper starting...')

  const _audio = yield* AudioService
  const _keyboard = yield* KeyboardService

  yield* Console.log('✅ Services initialized')
  yield* Console.log('👋 Hello from Effect!')

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

const MockKeyboardService = Layer.succeed(
  KeyboardService,
  KeyboardService.of({
    registerHotkey: () => Effect.void,
    unregisterHotkey: () => Effect.void,
    keyEvents: Effect.die('Not implemented'),
  }),
)

const MainLayer = Layer.mergeAll(MockAudioService, MockKeyboardService)

const runnable = program.pipe(Effect.provide(MainLayer))

BunRuntime.runMain(runnable)
