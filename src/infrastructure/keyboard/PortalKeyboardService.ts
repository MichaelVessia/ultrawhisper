import type { Hotkey } from '@domain/keyboard/Hotkey.ts'
import { HotkeyRegistrationFailed, ServiceUnavailable } from '@domain/keyboard/KeyboardErrors.ts'
import { KeyboardService, type KeyEvent } from '@domain/keyboard/KeyboardService.ts'
import { DBUS_SERVICES, DEFAULT_RECORDING_HOTKEY } from '@shared/constants.ts'
import dbus from 'dbus-next'
import { Effect, Layer, Stream } from 'effect'

interface DBusConnection {
  getProxyObject(serviceName: string, objectPath: string): Promise<DBusProxyObject>
  disconnect(): void
}

interface DBusProxyObject {
  getInterface(interfaceName: string): DBusInterface
}

interface DBusInterface {
  CreateSession(options: Record<string, unknown>): Promise<{ session_handle: string }>
  RegisterShortcut(
    session_handle: string,
    shortcut_id: string,
    shortcut: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<void>
  UnregisterShortcut(session_handle: string, shortcut_id: string): Promise<void>
  on(event: string, callback: (...args: unknown[]) => void): void
}

export class PortalKeyboardService implements KeyboardService {
  private bus: DBusConnection | null = null
  private portal: DBusInterface | null = null
  private registeredHotkeys = new Map<string, string>()
  private keyEventSubject: ((event: KeyEvent) => void) | null = null

  private connectToPortal = () => {
    const self = this
    return Effect.gen(function* () {
      if (self.bus) return

      self.bus = yield* Effect.sync(() => dbus.sessionBus())

      self.portal = yield* Effect.tryPromise({
        try: async () => {
          const portal = await self.bus!.getProxyObject(
            DBUS_SERVICES.DESKTOP_PORTAL,
            '/org/freedesktop/portal/desktop',
          )
          return portal.getInterface('org.freedesktop.portal.GlobalShortcuts')
        },
        catch: (error) =>
          new ServiceUnavailable({
            service: 'Desktop Portal GlobalShortcuts',
            details: error instanceof Error ? error.message : String(error),
          }),
      })
    })
  }

  readonly registerHotkey = (hotkey: Hotkey) => {
    const self = this
    return Effect.gen(function* () {
      yield* self.connectToPortal()

      const hotkeyKey = hotkey.toString()

      if (self.registeredHotkeys.has(hotkeyKey)) {
        return
      }

      yield* Effect.tryPromise({
        try: async () => {
          const shortcutId = `ultrawhisper-${hotkeyKey.replace(/[^a-zA-Z0-9]/g, '-')}`

          const result = await self.portal.CreateShortcut({
            session_handle: '',
            shortcut_id: shortcutId,
            shortcut: {
              trigger_description: `UltraWhisper: ${hotkeyKey}`,
              preferred_trigger: DEFAULT_RECORDING_HOTKEY,
            },
            options: {},
          })

          self.registeredHotkeys.set(hotkeyKey, shortcutId)
          return result
        },
        catch: (error) =>
          new HotkeyRegistrationFailed({
            hotkey: hotkeyKey,
            reason: `Portal registration failed: ${error instanceof Error ? error.message : String(error)}`,
          }),
      })

      yield* Effect.log(`Registered portal hotkey: ${hotkeyKey}`)
    })
  }

  readonly unregisterHotkey = (hotkey: Hotkey) => {
    const self = this
    return Effect.gen(function* () {
      const hotkeyKey = hotkey.toString()
      const shortcutId = self.registeredHotkeys.get(hotkeyKey)

      if (!shortcutId) {
        return
      }

      yield* Effect.tryPromise({
        try: async () => {
          await self.portal.DeleteShortcut({
            session_handle: '',
            shortcut_id: shortcutId,
          })
        },
        catch: (error) =>
          new HotkeyRegistrationFailed({
            hotkey: hotkeyKey,
            reason: error instanceof Error ? error.message : String(error),
          }),
      })

      self.registeredHotkeys.delete(hotkeyKey)
      yield* Effect.log(`Unregistered portal hotkey: ${hotkeyKey}`)
    })
  }

  readonly keyEvents = () => {
    const self = this
    return Stream.async<KeyEvent>((emit) => {
      self.keyEventSubject = (event: KeyEvent) => {
        emit.single(event)
      }

      return Effect.sync(() => {
        self.keyEventSubject = null
      })
    })
  }

  private cleanup = () => {
    const self = this
    return Effect.gen(function* () {
      for (const [_hotkeyKey, shortcutId] of self.registeredHotkeys) {
        yield* Effect.ignore(
          Effect.tryPromise({
            try: async () => {
              await self.portal?.DeleteShortcut({
                session_handle: '',
                shortcut_id: shortcutId,
              })
            },
            catch: () => undefined,
          }),
        )
      }

      self.registeredHotkeys.clear()
      self.bus?.disconnect()
      self.bus = null
      self.portal = null
    })
  }
}

export const PortalKeyboardServiceLive = Layer.effect(
  KeyboardService,
  Effect.gen(function* () {
    const service = new PortalKeyboardService()

    yield* Effect.addFinalizer(() => service.cleanup())

    return KeyboardService.of(service)
  }),
)
