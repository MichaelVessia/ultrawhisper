import type { Hotkey } from '@domain/keyboard/Hotkey.ts'
import { HotkeyRegistrationFailed, ServiceUnavailable } from '@domain/keyboard/KeyboardErrors.ts'
import { KeyboardService, type KeyEvent } from '@domain/keyboard/KeyboardService.ts'
import { DBUS_PATHS, DBUS_SERVICES, RECORDING_HOTKEY_ACCELERATOR } from '@shared/constants.ts'
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
  GrabAccelerator(accelerator: string, modeFlags: number, grabFlags: number): Promise<number>
  UngrabAccelerator(action: number): Promise<boolean>
  on(event: string, callback: (actionId: number, deviceId: number) => void): void
}

export class GnomeKeyboardService implements KeyboardService {
  private bus: DBusConnection | null = null
  private gnomeShell: DBusInterface | null = null
  private registeredHotkeys = new Map<string, number>()
  private keyEventSubject: ((event: KeyEvent) => void) | null = null

  private readonly RECORDING_HOTKEY = RECORDING_HOTKEY_ACCELERATOR

  private connectToDBus = () => {
    const self = this
    return Effect.gen(function* () {
      if (self.bus) return

      self.bus = yield* Effect.sync(() => dbus.sessionBus())

      self.gnomeShell = yield* Effect.tryPromise({
        try: async () => {
          const gnomeShell = await self.bus!.getProxyObject(
            DBUS_SERVICES.GNOME_SHELL,
            DBUS_PATHS.GNOME_SHELL,
          )
          return gnomeShell.getInterface(DBUS_SERVICES.GNOME_SHELL)
        },
        catch: (error) =>
          new ServiceUnavailable({
            service: 'GNOME Shell',
            details: error instanceof Error ? error.message : String(error),
          }),
      })

      self.gnomeShell.on('AcceleratorActivated', (actionId: number, deviceId: number) => {
        console.log(
          `🔔 AcceleratorActivated signal received! ActionId: ${actionId}, DeviceId: ${deviceId}`,
        )
        console.log(`📋 Registered hotkeys:`, Array.from(self.registeredHotkeys.entries()))

        const hotkeyEntry = Array.from(self.registeredHotkeys.entries()).find(
          ([, id]) => id === actionId,
        )
        if (hotkeyEntry && self.keyEventSubject) {
          const [hotkeyStr] = hotkeyEntry
          console.log(`✅ Found matching hotkey: ${hotkeyStr}`)
          const event: KeyEvent = {
            key: hotkeyStr.includes('grave') ? '`' : hotkeyStr,
            modifiers: hotkeyStr.includes('Control') ? ['ctrl'] : [],
            type: 'down',
          }
          self.keyEventSubject(event)
        } else {
          console.log(`❌ No matching hotkey found for actionId: ${actionId}`)
        }
      })
    })
  }

  readonly registerHotkey = (hotkey: Hotkey) => {
    const self = this
    return Effect.gen(function* () {
      yield* self.connectToDBus()

      const accelerator = self.RECORDING_HOTKEY
      const hotkeyKey = hotkey.toString()

      if (self.registeredHotkeys.has(hotkeyKey)) {
        return
      }

      const actionId = yield* Effect.tryPromise({
        try: async () => {
          console.log(`🔧 Attempting to grab accelerator: ${accelerator}`)
          if (!self.gnomeShell) throw new Error('GNOME Shell not connected')
          // GrabAccelerator expects: accelerator, modeFlags, grabFlags
          // modeFlags: 0 = normal mode, grabFlags: 0 = default grab
          const result = await self.gnomeShell.GrabAccelerator(accelerator, 0, 0)
          console.log(`📦 GrabAccelerator returned:`, result)
          return result
        },
        catch: (error) => {
          console.error(`❌ GrabAccelerator failed:`, error)
          return new HotkeyRegistrationFailed({
            hotkey: hotkeyKey,
            reason: error instanceof Error ? error.message : String(error),
          })
        },
      })

      if (actionId === 0) {
        yield* Effect.fail(
          new HotkeyRegistrationFailed({
            hotkey: hotkeyKey,
            reason: 'GNOME Shell returned invalid action ID',
          }),
        )
      }

      self.registeredHotkeys.set(hotkeyKey, actionId)
      yield* Effect.log(`Registered hotkey: ${hotkeyKey} with action ID: ${actionId}`)
      console.log(
        `🔑 Hotkey registered - Key: ${hotkeyKey}, ActionID: ${actionId}, Accelerator: ${accelerator}`,
      )
    })
  }

  readonly unregisterHotkey = (hotkey: Hotkey) => {
    const self = this
    return Effect.gen(function* () {
      const hotkeyKey = hotkey.toString()
      const actionId = self.registeredHotkeys.get(hotkeyKey)

      if (!actionId) {
        return
      }

      yield* Effect.tryPromise({
        try: async () => {
          if (!self.gnomeShell) throw new Error('GNOME Shell not connected')
          await self.gnomeShell.UngrabAccelerator(actionId)
        },
        catch: (error) =>
          new HotkeyRegistrationFailed({
            hotkey: hotkeyKey,
            reason: error instanceof Error ? error.message : String(error),
          }),
      })

      self.registeredHotkeys.delete(hotkeyKey)
      yield* Effect.log(`Unregistered hotkey: ${hotkeyKey}`)
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

  cleanup = () => {
    const self = this
    return Effect.gen(function* () {
      for (const [_hotkeyKey, actionId] of self.registeredHotkeys) {
        yield* Effect.ignore(
          Effect.tryPromise({
            try: async () => {
              await self.gnomeShell?.UngrabAccelerator(actionId)
            },
            catch: () => undefined,
          }),
        )
      }

      self.registeredHotkeys.clear()
      self.bus?.disconnect()
      self.bus = null
      self.gnomeShell = null
    })
  }
}

export const GnomeKeyboardServiceLive = Layer.effect(
  KeyboardService,
  Effect.gen(function* () {
    const service = new GnomeKeyboardService()

    yield* Effect.addFinalizer(() => service.cleanup())

    return KeyboardService.of(service)
  }),
)
