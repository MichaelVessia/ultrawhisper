import type { AudioFormat, Milliseconds } from '@shared/types.ts'
import { Data } from 'effect'

export class AudioRecording extends Data.Class<{
  readonly data: Uint8Array
  readonly format: AudioFormat
  readonly duration: Milliseconds
  readonly sampleRate: number
  readonly channels: number
}> {}
