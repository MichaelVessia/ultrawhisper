import { DesktopNotSupported, ServiceUnavailable } from '@domain/keyboard/KeyboardErrors.ts'
import { KeyboardService } from '@domain/keyboard/KeyboardService.ts'
import { Effect, Layer } from 'effect'
import { detectDesktopEnvironment, getDesktopCapabilities } from './DesktopIntegration.ts'
import { GnomeKeyboardServiceLive } from './GnomeKeyboardService.ts'
import { PortalKeyboardServiceLive } from './PortalKeyboardService.ts'

export const KeyboardServiceFactory = Effect.gen(function* () {
  const capabilities = yield* getDesktopCapabilities

  yield* Effect.log(`Desktop capabilities: ${JSON.stringify(capabilities)}`)

  // Prioritize Desktop Portal as it's the standard cross-desktop approach
  if (capabilities.hasPortal) {
    yield* Effect.log('Using Desktop Portal keyboard service (standard approach)')
    return PortalKeyboardServiceLive
  }

  if (capabilities.hasGnomeShell && capabilities.desktop === 'gnome') {
    yield* Effect.log('Desktop Portal unavailable, trying GNOME Shell (may require extension)')
    return GnomeKeyboardServiceLive
  }

  yield* Effect.log(`Desktop '${capabilities.desktop}' not supported, falling back to mock service`)
  return MockKeyboardServiceLive
})

export const MockKeyboardServiceLive = Layer.succeed(
  KeyboardService,
  KeyboardService.of({
    registerHotkey: () => Effect.log('Mock: registerHotkey called'),
    unregisterHotkey: () => Effect.log('Mock: unregisterHotkey called'),
    keyEvents: () => Effect.die('Mock: keyEvents not implemented'),
  }),
)
