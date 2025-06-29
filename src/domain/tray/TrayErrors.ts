export class TrayNotSupportedError extends Error {
  readonly _tag = 'TrayNotSupportedError'
  
  constructor(message = 'System tray is not supported on this platform') {
    super(message)
    this.name = 'TrayNotSupportedError'
  }
}

export class TrayInitializationError extends Error {
  readonly _tag = 'TrayInitializationError'
  
  constructor(message = 'Failed to initialize system tray') {
    super(message)
    this.name = 'TrayInitializationError'
  }
}