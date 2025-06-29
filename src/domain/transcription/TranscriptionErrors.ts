export class TranscriptionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'TranscriptionError'
  }
}

export class ModelNotFoundError extends TranscriptionError {
  constructor(modelPath: string) {
    super(`Whisper model not found at: ${modelPath}`)
    this.name = 'ModelNotFoundError'
  }
}

export class AudioFormatError extends TranscriptionError {
  constructor(message: string, cause?: unknown) {
    super(`Audio format error: ${message}`, cause)
    this.name = 'AudioFormatError'
  }
}

export class TranscriptionTimeoutError extends TranscriptionError {
  constructor(timeoutMs: number) {
    super(`Transcription timed out after ${timeoutMs}ms`)
    this.name = 'TranscriptionTimeoutError'
  }
}
