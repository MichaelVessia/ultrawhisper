import { Context, type Effect } from 'effect'

export enum FeedbackType {
  RECORDING_STARTED = 'recording_started',
  RECORDING_STOPPED = 'recording_stopped',
  TRANSCRIPTION_COMPLETE = 'transcription_complete',
  ERROR = 'error',
}

export interface FeedbackService {
  readonly playSound: (type: FeedbackType) => Effect.Effect<void, Error>
  readonly showNotification: (type: FeedbackType, message?: string) => Effect.Effect<void, Error>
  readonly clearNotification: () => Effect.Effect<void, Error>
}

export const FeedbackService = Context.GenericTag<FeedbackService>('FeedbackService')
