import { Effect, Layer } from 'effect'
import { KeyboardService } from '@domain/keyboard/KeyboardService.ts'
import { DesktopNotSupported, ServiceUnavailable } from '@domain/keyboard/KeyboardErrors.ts'
import { detectDesktopEnvironment, getDesktopCapabilities } from './DesktopIntegration.ts'
import { GnomeKeyboardServiceLive } from './GnomeKeyboardService.ts'

export const KeyboardServiceFactory = Effect.gen(function* () {
  const capabilities = yield* getDesktopCapabilities

  yield* Effect.log(`Desktop capabilities: ${JSON.stringify(capabilities)}`)

  if (capabilities.hasGnomeShell && capabilities.desktop === 'gnome') {
    yield* Effect.log('Using GNOME Shell keyboard service')
    return GnomeKeyboardServiceLive
  }

  if (capabilities.hasPortal) {
    yield* Effect.log('GNOME Shell not available, would use Portal service (not implemented yet)')
    // TODO: Return PortalKeyboardServiceLive when implemented
    return MockKeyboardServiceLive
  }

  yield* Effect.fail(new DesktopNotSupported({
    desktop: capabilities.desktop,
    availableDesktops: capabilities.supportedMethods,
  }))
})

export const MockKeyboardServiceLive = Layer.succeed(
  KeyboardService,
  KeyboardService.of({
    registerHotkey: () => Effect.log('Mock: registerHotkey called'),
    unregisterHotkey: () => Effect.log('Mock: unregisterHotkey called'),
    keyEvents: Effect.die('Mock: keyEvents not implemented'),
  }),
)