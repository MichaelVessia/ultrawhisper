import { Data } from 'effect'

export class ServiceNotAvailableError extends Data.TaggedError('ServiceNotAvailableError')<{
  service: string
  reason?: string
}> {}

export class ConfigurationError extends Data.TaggedError('ConfigurationError')<{
  message: string
  field?: string
}> {}

export class UnexpectedError extends Data.TaggedError('UnexpectedError')<{
  message: string
  cause?: unknown
}> {}
