import { Context, Effect } from 'effect'

export interface ClipboardService {
  readonly writeText: (text: string) => Effect.Effect<void, ClipboardError>
  readonly readText: Effect.Effect<string, ClipboardError>
}

export const ClipboardService: Context.Tag<ClipboardService, ClipboardService> = Context.GenericTag<ClipboardService>('ClipboardService')

export class ClipboardError extends Error {
  readonly _tag = 'ClipboardError'
  
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'ClipboardError'
  }
}