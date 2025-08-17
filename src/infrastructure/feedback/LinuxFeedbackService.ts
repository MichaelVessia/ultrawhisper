import { FeedbackService, FeedbackType } from '@domain/feedback/FeedbackService.ts'
import { getFeedbackConfig } from '@shared/config.ts'
import { Effect, Layer } from 'effect'

export class LinuxFeedbackService implements FeedbackService {
  private readonly config = getFeedbackConfig()

  private readonly soundPaths = {
    [FeedbackType.RECORDING_STARTED]:
      this.config.customSoundPaths?.recordingStarted || '/usr/share/sounds/Yaru/stereo/bell.oga',
    [FeedbackType.RECORDING_STOPPED]:
      this.config.customSoundPaths?.recordingStopped ||
      '/usr/share/sounds/Yaru/stereo/complete.oga',
    [FeedbackType.TRANSCRIPTION_COMPLETE]:
      this.config.customSoundPaths?.transcriptionComplete ||
      '/usr/share/sounds/Yaru/stereo/message.oga',
    [FeedbackType.ERROR]:
      this.config.customSoundPaths?.error || '/usr/share/sounds/Yaru/stereo/dialog-error.oga',
  }

  private readonly notificationMessages = {
    [FeedbackType.RECORDING_STARTED]: '🔴 Recording...',
    [FeedbackType.RECORDING_STOPPED]: '⏹️ Recording stopped',
    [FeedbackType.TRANSCRIPTION_COMPLETE]: '✅ Transcription complete',
    [FeedbackType.ERROR]: '❌ Error occurred',
  }

  readonly playSound = (type: FeedbackType) =>
    Effect.gen(
      function* (this: LinuxFeedbackService) {
        const soundPath = this.soundPaths[type]

        // Check if sound is enabled via configuration
        if (!this.config.soundEnabled) {
          return
        }

        // Check if sound file exists
        const file = Bun.file(soundPath)
        const exists = yield* Effect.promise(() => file.exists())
        if (!exists) {
          // Fallback to system bell if sound file doesn't exist
          yield* Effect.tryPromise({
            try: () => Bun.spawn(['printf', '\a']).exited,
            catch: (error) => new Error(`Failed to play fallback sound: ${error}`),
          })
          return
        }

        // Try to play with SoX play command (handles .oga files well)
        yield* Effect.catchAll(
          Effect.tryPromise({
            try: () => Bun.spawn(['play', '-q', soundPath], { stderr: 'ignore' }).exited,
            catch: (error) => new Error(`Failed to play sound with SoX: ${error}`),
          }),
          // Fallback to system bell
          () =>
            Effect.tryPromise({
              try: () => Bun.spawn(['printf', '\a']).exited,
              catch: (error) => new Error(`Failed to play fallback sound: ${error}`),
            }),
        )
      }.bind(this),
    )

  readonly showNotification = (type: FeedbackType, customMessage?: string) =>
    Effect.gen(
      function* (this: LinuxFeedbackService) {
        // Check if notifications are enabled via configuration
        if (!this.config.notificationsEnabled) {
          return
        }

        const message = customMessage || this.notificationMessages[type]
        const title = 'UltraWhisper'

        yield* Effect.tryPromise({
          try: () =>
            Bun.spawn(
              ['notify-send', '--app-name=UltraWhisper', '--expire-time=3000', title, message],
              {
                stderr: 'ignore',
              },
            ).exited,
          catch: (error) => new Error(`Failed to show notification: ${error}`),
        })
      }.bind(this),
    )

  readonly clearNotification = () =>
    Effect.gen(function* () {
      // Clear any existing UltraWhisper notifications
      yield* Effect.tryPromise({
        try: () =>
          Bun.spawn(
            ['notify-send', '--app-name=UltraWhisper', '--expire-time=1', 'UltraWhisper', ''],
            {
              stderr: 'ignore',
            },
          ).exited,
        catch: () => new Error('Failed to clear notifications'),
      })
    })
}

export const LinuxFeedbackServiceLayer = Layer.succeed(FeedbackService, new LinuxFeedbackService())
