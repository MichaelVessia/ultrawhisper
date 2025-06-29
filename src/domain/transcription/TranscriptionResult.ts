import type { Milliseconds } from '@shared/types.ts'

export class TranscriptionResult {
  constructor(
    public readonly text: string,
    public readonly confidence: number,
    public readonly processingTime: Milliseconds,
    public readonly language?: string,
  ) {}

  static create(
    text: string,
    confidence: number = 1.0,
    processingTime: Milliseconds,
    language?: string,
  ): TranscriptionResult {
    return new TranscriptionResult(text, confidence, processingTime, language)
  }

  get isEmpty(): boolean {
    return this.text.trim().length === 0
  }

  toString(): string {
    return this.text
  }
}
