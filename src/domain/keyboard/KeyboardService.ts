import { Context, type Effect, type Stream } from 'effect'
import type { Hotkey } from './Hotkey.ts'

export type KeyEvent = {
  readonly key: string
  readonly modifiers: ReadonlyArray<'ctrl' | 'alt' | 'shift' | 'meta'>
  readonly type: 'down' | 'up'
}

export interface KeyboardService {
  readonly registerHotkey: (hotkey: Hotkey) => Effect.Effect<void, unknown, never>
  readonly unregisterHotkey: (hotkey: Hotkey) => Effect.Effect<void, unknown, never>
  readonly keyEvents: () => Stream.Stream<KeyEvent, unknown, never>
}

export const KeyboardService = Context.GenericTag<KeyboardService>('KeyboardService')
