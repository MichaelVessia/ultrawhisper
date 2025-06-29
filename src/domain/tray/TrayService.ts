import { Context, type Effect } from 'effect'
import type { TrayStatus } from './TrayStatus.ts'

export interface TrayService {
  readonly showTray: () => Effect.Effect<void, unknown, never>
  readonly hideTray: () => Effect.Effect<void, unknown, never>
  readonly updateStatus: (status: TrayStatus) => Effect.Effect<void, unknown, never>
  readonly isSupported: () => Effect.Effect<boolean, unknown, never>
}

export const TrayService = Context.GenericTag<TrayService>('TrayService')
