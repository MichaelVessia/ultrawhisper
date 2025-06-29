import { KeyboardService } from '@domain/keyboard/KeyboardService.ts'
import { Effect, Layer } from 'effect'
import { getDesktopCapabilities } from './DesktopIntegration.ts'
import { GnomeCustomKeybindingServiceLive } from './GnomeCustomKeybindingService.ts'
import { PortalKeyboardServiceLive } from './PortalKeyboardService.ts'

export const KeyboardServiceFactory = Effect.gen(function* () {
  const capabilities = yield* getDesktopCapabilities

  yield* Effect.log(`Desktop capabilities: ${JSON.stringify(capabilities)}`)

  // For GNOME, use custom keybinding approach since direct accelerator grabbing is restricted
  if (capabilities.desktop === 'gnome') {
    yield* Effect.log('Using GNOME custom keybinding service (system-level shortcuts)')
    return GnomeCustomKeybindingServiceLive
  }

  if (capabilities.hasPortal) {
    yield* Effect.log('Using Desktop Portal keyboard service (standard approach)')
    return PortalKeyboardServiceLive
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
