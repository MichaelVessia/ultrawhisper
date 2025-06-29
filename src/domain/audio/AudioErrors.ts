import { Data } from 'effect'

export class MicrophoneNotFoundError extends Data.TaggedError('MicrophoneNotFoundError')<{
  message?: string
}> {}

export class AudioPermissionDeniedError extends Data.TaggedError('AudioPermissionDeniedError')<{
  message?: string
}> {}

export class RecordingError extends Data.TaggedError('RecordingError')<{
  message: string
  cause?: unknown
}> {}
