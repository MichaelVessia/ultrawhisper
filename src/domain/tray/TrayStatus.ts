export const TrayStatus = {
  Idle: 'idle',
  Recording: 'recording',
  Processing: 'processing',
} as const

export type TrayStatus = typeof TrayStatus[keyof typeof TrayStatus]