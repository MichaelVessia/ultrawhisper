import type { FilePath } from '@shared/types.ts'
import { Context, type Effect, type Stream } from 'effect'
import type { AudioRecording } from './AudioRecording.ts'

export interface AudioService {
  readonly startRecording: Effect.Effect<void>
  readonly stopRecording: Effect.Effect<AudioRecording>
  readonly getAudioStream: Stream.Stream<Uint8Array>
  readonly saveRecording: (recording: AudioRecording, path: FilePath) => Effect.Effect<void>
}

export const AudioService = Context.GenericTag<AudioService>('AudioService')
