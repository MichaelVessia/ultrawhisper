import { Data } from 'effect'

export class DesktopNotSupported extends Data.TaggedError('DesktopNotSupported')<{
  readonly desktop: string
  readonly availableDesktops: ReadonlyArray<string>
}> {}

export class HotkeyRegistrationFailed extends Data.TaggedError('HotkeyRegistrationFailed')<{
  readonly hotkey: string
  readonly reason: string
}> {}

export class ServiceUnavailable extends Data.TaggedError('ServiceUnavailable')<{
  readonly service: string
  readonly details?: string
}> {}

export class HotkeyAlreadyRegistered extends Data.TaggedError('HotkeyAlreadyRegistered')<{
  readonly hotkey: string
}> {}

export class InvalidHotkey extends Data.TaggedError('InvalidHotkey')<{
  readonly hotkey: string
  readonly reason: string
}> {}