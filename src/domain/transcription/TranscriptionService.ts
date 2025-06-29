import type { AudioRecording } from '@domain/audio/AudioRecording.ts'
import type { FilePath } from '@shared/types.ts'
import { Context, type Effect } from 'effect'
import type { TranscriptionResult } from './TranscriptionResult.ts'

export interface TranscriptionService {
  readonly transcribe: (recording: AudioRecording) => Effect.Effect<TranscriptionResult>
  readonly transcribeFile: (audioPath: FilePath) => Effect.Effect<TranscriptionResult>
  readonly isModelReady: Effect.Effect<boolean>
  readonly initializeModel: Effect.Effect<void>
}

export const TranscriptionService = Context.GenericTag<TranscriptionService>('TranscriptionService')
