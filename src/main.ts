import { AudioService } from '@domain/audio/AudioService.ts'
import { ClipboardService } from '@domain/clipboard/ClipboardService.ts'
import { Hotkey } from '@domain/keyboard/Hotkey.ts'
import { KeyboardService } from '@domain/keyboard/KeyboardService.ts'
import { TranscriptionService } from '@domain/transcription/TranscriptionService.ts'
import { TrayService } from '@domain/tray/TrayService.ts'
import { TrayStatus } from '@domain/tray/TrayStatus.ts'
import { BunRuntime } from '@effect/platform-bun'
import { BunAudioServiceLayer } from '@infrastructure/audio/BunAudioService.ts'
import { LinuxClipboardServiceLayer } from '@infrastructure/clipboard/LinuxClipboardService.ts'
import { KeyboardServiceFactory } from '@infrastructure/keyboard/KeyboardServiceFactory.ts'
import { LocalWhisperServiceLayer } from '@infrastructure/transcription/LocalWhisperService.ts'
import { ElectronTrayServiceLayer } from '@infrastructure/tray/ElectronTrayService.ts'
import { DEFAULT_RECORDING_HOTKEY } from '@shared/constants.ts'
import { Console, Effect, Layer, Ref, Stream } from 'effect'

const checkSystemDependencies = Effect.gen(function* () {
  yield* Console.log('🔧 Checking system dependencies...')

  // Check for arecord (audio recording)
  yield* Effect.catchAll(
    Effect.tryPromise({
      try: () => Bun.spawn(['which', 'arecord']).exited,
      catch: () => new Error('arecord not found'),
    }),
    (_error) =>
      Effect.gen(function* () {
        yield* Console.log('⚠️  arecord not found - audio recording may not work')
        yield* Console.log('💡 Install: sudo apt install alsa-utils')
      }),
  )

  // Check for xclip (clipboard)
  yield* Effect.catchAll(
    Effect.tryPromise({
      try: () => Bun.spawn(['which', 'xclip']).exited,
      catch: () => new Error('xclip not found'),
    }),
    (_error) =>
      Effect.gen(function* () {
        yield* Console.log('⚠️  xclip not found - clipboard integration may not work')
        yield* Console.log('💡 Install: sudo apt install xclip')
      }),
  )
})

const program = Effect.gen(function* () {
  yield* Console.log('🎙️  UltraWhisper starting...')

  const audio = yield* AudioService
  const keyboard = yield* KeyboardService
  const transcription = yield* TranscriptionService
  const clipboard = yield* ClipboardService
  const tray = yield* TrayService

  // Check system dependencies
  yield* checkSystemDependencies

  // Initialize tray if supported
  const traySupported = yield* tray.isSupported()
  if (traySupported) {
    yield* Console.log('🖥️  System tray supported, initializing...')
    yield* Effect.catchAll(tray.showTray(), (error) =>
      Effect.gen(function* () {
        yield* Console.log(`⚠️  Failed to initialize system tray: ${error}`)
        yield* Console.log('💡 Continuing without tray support')
      }),
    )
    yield* tray.updateStatus(TrayStatus.Idle)
  } else {
    yield* Console.log('💡 System tray not supported, using hotkey-only mode')
  }

  // Track recording state
  const isRecordingRef = yield* Ref.make(false)

  // Initialize Whisper model
  yield* Console.log('🤖 Initializing Whisper model...')
  yield* Effect.catchAll(transcription.initializeModel, (error) =>
    Effect.gen(function* () {
      yield* Console.log(`❌ Failed to initialize Whisper model: ${error}`)
      yield* Console.log('💡 Make sure you have internet connection for first-time model download')
      return yield* Effect.die(error)
    }),
  )

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
          yield* Effect.catchAll(tray.updateStatus(TrayStatus.Recording), () => Effect.void)
          yield* Effect.catchAll(audio.startRecording, (error) =>
            Effect.gen(function* () {
              yield* Console.log(`❌ Failed to start recording: ${error}`)
              yield* Effect.catchAll(tray.updateStatus(TrayStatus.Idle), () => Effect.void)
            }),
          )
          yield* Ref.set(isRecordingRef, true)
          yield* Console.log('🔴 Recording started! Press hotkey again to stop.')
        } else {
          // Stop recording
          yield* Console.log('⏹️  Stopping recording...')
          yield* Effect.catchAll(tray.updateStatus(TrayStatus.Processing), () => Effect.void)
          const recording = yield* Effect.catchAll(audio.stopRecording, (error) =>
            Effect.gen(function* () {
              yield* Console.log(`❌ Failed to stop recording: ${error}`)
              yield* Ref.set(isRecordingRef, false)
              yield* Effect.catchAll(tray.updateStatus(TrayStatus.Idle), () => Effect.void)
              return yield* Effect.die(error)
            }),
          )
          yield* Ref.set(isRecordingRef, false)
          yield* Console.log(
            `✅ Recording stopped! Duration: ${recording.duration}ms, Size: ${recording.data.length} bytes`,
          )

          // Transcribe the recording
          yield* Console.log('🔄 Transcribing audio...')
          const result = yield* Effect.catchAll(transcription.transcribe(recording), (error) =>
            Effect.gen(function* () {
              yield* Console.log(`❌ Transcription failed: ${error}`)
              yield* Effect.catchAll(tray.updateStatus(TrayStatus.Idle), () => Effect.void)
              return yield* Effect.die(error)
            }),
          )

          if (result.isEmpty) {
            yield* Console.log('🤐 No speech detected in recording')
          } else {
            yield* Console.log(`📝 Transcription (${result.processingTime}ms): "${result.text}"`)

            // Copy to clipboard
            yield* Console.log('📋 Copying to clipboard...')
            yield* Effect.catchAll(clipboard.writeText(result.text), (error) =>
              Effect.gen(function* () {
                yield* Console.log(`⚠️  Failed to copy to clipboard: ${error}`)
              }),
            )
            yield* Console.log('✅ Text copied to clipboard!')
          }
          yield* Effect.catchAll(tray.updateStatus(TrayStatus.Idle), () => Effect.void)
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
      ElectronTrayServiceLayer,
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
