import { Context, Effect, Layer, Stream } from 'effect'
import dbus from 'dbus-next'
import { KeyboardService, type KeyEvent } from '@domain/keyboard/KeyboardService.ts'
import type { Hotkey } from '@domain/keyboard/Hotkey.ts'
import { HotkeyRegistrationFailed, ServiceUnavailable } from '@domain/keyboard/KeyboardErrors.ts'
import { RECORDING_HOTKEY_ACCELERATOR, DBUS_SERVICES, DBUS_PATHS } from '@shared/constants.ts'

export class GnomeKeyboardService implements KeyboardService {
  private bus: any = null
  private gnomeShell: any = null
  private registeredHotkeys = new Map<string, number>()
  private keyEventSubject: ((event: KeyEvent) => void) | null = null

  private readonly RECORDING_HOTKEY = RECORDING_HOTKEY_ACCELERATOR

  constructor() {}

  private connectToDBus = () => {
    const self = this
    return Effect.gen(function* () {
      if (self.bus) return

      self.bus = yield* Effect.sync(() => dbus.sessionBus())

      self.gnomeShell = yield* Effect.tryPromise({
        try: async () => {
          const gnomeShell = await self.bus!.getProxyObject(DBUS_SERVICES.GNOME_SHELL, DBUS_PATHS.GNOME_SHELL)
          return gnomeShell.getInterface(DBUS_SERVICES.GNOME_SHELL)
        },
        catch: (error) => new ServiceUnavailable({
          service: 'GNOME Shell',
          details: error instanceof Error ? error.message : String(error),
        }),
      })

      self.gnomeShell.on('AcceleratorActivated', (actionId: number, deviceId: number) => {
        const hotkeyEntry = Array.from(self.registeredHotkeys.entries()).find(([, id]) => id === actionId)
        if (hotkeyEntry && self.keyEventSubject) {
          const [hotkeyStr] = hotkeyEntry
          const event: KeyEvent = {
            key: hotkeyStr.includes('grave') ? '`' : hotkeyStr,
            modifiers: hotkeyStr.includes('Control') ? ['ctrl'] : [],
            type: 'down',
          }
          self.keyEventSubject(event)
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
          const result = await self.gnomeShell.GrabAccelerator(accelerator, 0)
          return result
        },
        catch: (error) => new HotkeyRegistrationFailed({
          hotkey: hotkeyKey,
          reason: error instanceof Error ? error.message : String(error),
        }),
      })

      if (actionId === 0) {
        yield* Effect.fail(new HotkeyRegistrationFailed({
          hotkey: hotkeyKey,
          reason: 'GNOME Shell returned invalid action ID',
        }))
      }

      self.registeredHotkeys.set(hotkeyKey, actionId)
      yield* Effect.log(`Registered hotkey: ${hotkeyKey} with action ID: ${actionId}`)
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
          await self.gnomeShell.UngrabAccelerator(actionId)
        },
        catch: (error) => new HotkeyRegistrationFailed({
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

  private cleanup = () => {
    const self = this
    return Effect.gen(function* () {
      for (const [hotkeyKey, actionId] of self.registeredHotkeys) {
        yield* Effect.ignore(Effect.tryPromise({
          try: async () => {
            await self.gnomeShell?.UngrabAccelerator(actionId)
          },
          catch: () => undefined,
        }))
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

    yield* Effect.addFinalizer(() => service['cleanup']())

    return KeyboardService.of(service)
  }),
)