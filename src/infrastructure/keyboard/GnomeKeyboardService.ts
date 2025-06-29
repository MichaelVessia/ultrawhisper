import { Context, Effect, Layer, Stream } from 'effect'
import dbus from 'dbus-next'
import { KeyboardService, type KeyEvent } from '@domain/keyboard/KeyboardService.ts'
import type { Hotkey } from '@domain/keyboard/Hotkey.ts'
import { HotkeyRegistrationFailed, ServiceUnavailable } from '@domain/keyboard/KeyboardErrors.ts'

export class GnomeKeyboardService implements KeyboardService {
  private bus: any = null
  private gnomeShell: any = null
  private registeredHotkeys = new Map<string, number>()
  private keyEventSubject: ((event: KeyEvent) => void) | null = null

  private readonly RECORDING_HOTKEY = '<Control>grave' // Ctrl+`

  constructor() {}

  private connectToDBus = Effect.gen(function* (this: GnomeKeyboardService) {
    if (this.bus) return

    this.bus = yield* Effect.sync(() => dbus.sessionBus())

    this.gnomeShell = yield* Effect.tryPromise({
      try: async () => {
        const gnomeShell = await this.bus!.getProxyObject('org.gnome.Shell', '/org/gnome/Shell')
        return gnomeShell.getInterface('org.gnome.Shell')
      },
      catch: (error) => new ServiceUnavailable({
        service: 'GNOME Shell',
        details: error instanceof Error ? error.message : String(error),
      }),
    })

    this.gnomeShell.on('AcceleratorActivated', (actionId: number, deviceId: number) => {
      const hotkeyEntry = Array.from(this.registeredHotkeys.entries()).find(([, id]) => id === actionId)
      if (hotkeyEntry && this.keyEventSubject) {
        const [hotkeyStr] = hotkeyEntry
        const event: KeyEvent = {
          key: hotkeyStr.includes('grave') ? '`' : hotkeyStr,
          modifiers: hotkeyStr.includes('Control') ? ['ctrl'] : [],
          type: 'down',
        }
        this.keyEventSubject(event)
      }
    })
  })

  readonly registerHotkey = (hotkey: Hotkey) =>
    Effect.gen(function* (this: GnomeKeyboardService) {
      yield* this.connectToDBus

      const accelerator = this.RECORDING_HOTKEY
      const hotkeyKey = hotkey.toString()

      if (this.registeredHotkeys.has(hotkeyKey)) {
        return
      }

      const actionId = yield* Effect.tryPromise({
        try: async () => {
          const result = await this.gnomeShell.GrabAccelerator(accelerator, 0)
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

      this.registeredHotkeys.set(hotkeyKey, actionId)
      yield* Effect.log(`Registered hotkey: ${hotkeyKey} with action ID: ${actionId}`)
    })

  readonly unregisterHotkey = (hotkey: Hotkey) =>
    Effect.gen(function* (this: GnomeKeyboardService) {
      const hotkeyKey = hotkey.toString()
      const actionId = this.registeredHotkeys.get(hotkeyKey)

      if (!actionId) {
        return
      }

      yield* Effect.tryPromise({
        try: async () => {
          await this.gnomeShell.UngrabAccelerator(actionId)
        },
        catch: (error) => new HotkeyRegistrationFailed({
          hotkey: hotkeyKey,
          reason: error instanceof Error ? error.message : String(error),
        }),
      })

      this.registeredHotkeys.delete(hotkeyKey)
      yield* Effect.log(`Unregistered hotkey: ${hotkeyKey}`)
    })

  readonly keyEvents = Stream.async<KeyEvent>((emit) => {
    this.keyEventSubject = (event: KeyEvent) => {
      emit.single(event)
    }

    return Effect.sync(() => {
      this.keyEventSubject = null
    })
  })

  private cleanup = Effect.gen(function* (this: GnomeKeyboardService) {
    for (const [hotkeyKey, actionId] of this.registeredHotkeys) {
      yield* Effect.ignore(Effect.tryPromise({
        try: async () => {
          await this.gnomeShell?.UngrabAccelerator(actionId)
        },
        catch: () => undefined,
      }))
    }

    this.registeredHotkeys.clear()
    this.bus?.disconnect()
    this.bus = null
    this.gnomeShell = null
  })
}

export const GnomeKeyboardServiceLive = Layer.effect(
  KeyboardService,
  Effect.gen(function* () {
    const service = new GnomeKeyboardService()

    yield* Effect.addFinalizer(() => service['cleanup'])

    return KeyboardService.of(service)
  }),
)