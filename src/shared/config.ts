export interface FeedbackConfig {
  soundEnabled: boolean
  notificationsEnabled: boolean
  customSoundPaths?: {
    recordingStarted?: string
    recordingStopped?: string
    transcriptionComplete?: string
    error?: string
  }
}

export const getFeedbackConfig = (): FeedbackConfig => ({
  soundEnabled: process.env.ULTRAWHISPER_SOUND_ENABLED !== 'false',
  notificationsEnabled: process.env.ULTRAWHISPER_NOTIFICATIONS_ENABLED !== 'false',
  customSoundPaths: {
    recordingStarted: process.env.ULTRAWHISPER_SOUND_RECORDING_STARTED,
    recordingStopped: process.env.ULTRAWHISPER_SOUND_RECORDING_STOPPED,
    transcriptionComplete: process.env.ULTRAWHISPER_SOUND_TRANSCRIPTION_COMPLETE,
    error: process.env.ULTRAWHISPER_SOUND_ERROR,
  },
})
