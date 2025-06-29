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
  CreateSession(options: Record<string, unknown>): Promise<[string, Record<string, unknown>]>
  CreateShortcut(
    session_handle: string,
    shortcut_id: string,
    trigger: string,
    options: Record<string, unknown>,
  ): Promise<[string, Record<string, unknown>]>
  DeleteShortcut(session_handle: string, shortcut_id: string): Promise<void>
  on(event: string, callback: (...args: unknown[]) => void): void
}

export class PortalKeyboardService implements KeyboardService {
  private bus: DBusConnection | null = null
  private portal: DBusInterface | null = null
  private sessionHandle: string | null = null
  private registeredHotkeys = new Map<string, string>()
  private keyEventSubject: ((event: KeyEvent) => void) | null = null

  private connectToPortal = () => {
    const self = this
    return Effect.gen(function* () {
      console.log('🔧 connectToPortal called')
      if (self.bus && self.portal && self.sessionHandle) {
        console.log('✅ Already connected to Portal')
        return
      }

      console.log('🚌 Creating D-Bus session connection...')
      self.bus = yield* Effect.sync(() => dbus.sessionBus())

      console.log('🔌 Connecting to Desktop Portal GlobalShortcuts...')
      self.portal = yield* Effect.tryPromise({
        try: async () => {
          const portal = await self.bus!.getProxyObject(
            DBUS_SERVICES.DESKTOP_PORTAL,
            '/org/freedesktop/portal/desktop',
          )
          console.log('📦 Got Desktop Portal proxy object')
          const interface_ = portal.getInterface('org.freedesktop.portal.GlobalShortcuts')
          console.log('✅ Got GlobalShortcuts interface')
          return interface_
        },
        catch: (error) => {
          console.error('❌ Failed to connect to Desktop Portal:', error)
          return new ServiceUnavailable({
            service: 'Desktop Portal GlobalShortcuts',
            details: error instanceof Error ? error.message : String(error),
          })
        },
      })

      // Create session for global shortcuts
      console.log('🔧 Creating Desktop Portal session...')
      const sessionResult = yield* Effect.tryPromise({
        try: async () => {
          if (!self.portal) throw new Error('Portal not connected')
          const result = await self.portal.CreateSession({
            handle_token: `ultrawhisper_${Date.now()}`,
          })
          console.log('📦 CreateSession result:', result)
          return result
        },
        catch: (error) => {
          console.error('❌ CreateSession failed:', error)
          return new ServiceUnavailable({
            service: 'Desktop Portal Session',
            details: error instanceof Error ? error.message : String(error),
          })
        },
      })

      self.sessionHandle = sessionResult[0]
      console.log('✅ Session created with handle:', self.sessionHandle)

      // Set up event listener for shortcut activation
      console.log('🎯 Setting up Activated event listener...')
      self.portal.on('Activated', (...args: unknown[]) => {
        const [session, shortcut_id, timestamp, _options] = args as [
          string,
          string,
          number,
          Record<string, unknown>,
        ]
        console.log(`🚨 GLOBAL HOTKEY DETECTED! 🚨`)
        console.log(`📥 Shortcut activated: ${shortcut_id} in session ${session}`)
        console.log(`⏰ Timestamp: ${timestamp}`)
        console.log(`📋 Current session: ${self.sessionHandle}`)
        console.log(`🗝️  Registered hotkeys:`, Array.from(self.registeredHotkeys.entries()))

        if (session === self.sessionHandle && self.keyEventSubject) {
          // Find the hotkey that matches this shortcut_id
          const hotkeyEntry = Array.from(self.registeredHotkeys.entries()).find(
            ([, id]) => id === shortcut_id,
          )

          if (hotkeyEntry) {
            const [hotkeyStr] = hotkeyEntry
            console.log(`✅ Emitting key event for: ${hotkeyStr}`)
            const event: KeyEvent = {
              key: hotkeyStr.includes('grave') ? '`' : hotkeyStr.split('+').pop() || hotkeyStr,
              modifiers: hotkeyStr.toLowerCase().includes('ctrl') ? ['ctrl'] : [],
              type: 'down',
            }
            self.keyEventSubject(event)
          } else {
            console.log(`❌ No matching hotkey found for shortcut_id: ${shortcut_id}`)
          }
        } else {
          console.log(
            `❌ Session mismatch or no event subject: session=${session}, hasSubject=${!!self.keyEventSubject}`,
          )
        }
      })
    })
  }

  readonly registerHotkey = (hotkey: Hotkey) => {
    const self = this
    return Effect.gen(function* () {
      console.log('🔧 PortalKeyboardService.registerHotkey called!')
      yield* self.connectToPortal()

      const hotkeyKey = hotkey.toString()
      console.log(`🔑 Registering hotkey: ${hotkeyKey}`)

      if (self.registeredHotkeys.has(hotkeyKey)) {
        console.log(`⚠️  Hotkey ${hotkeyKey} already registered`)
        return
      }

      yield* Effect.tryPromise({
        try: async () => {
          const shortcutId = `ultrawhisper-${hotkeyKey.replace(/[^a-zA-Z0-9]/g, '-')}`

          if (!self.portal || !self.sessionHandle) throw new Error('Desktop Portal not connected')
          console.log(
            `🔧 Creating shortcut: session=${self.sessionHandle}, id=${shortcutId}, trigger=${DEFAULT_RECORDING_HOTKEY}`,
          )
          const result = await self.portal.CreateShortcut(
            self.sessionHandle,
            shortcutId,
            DEFAULT_RECORDING_HOTKEY,
            {
              description: `UltraWhisper: ${hotkeyKey}`,
            },
          )
          console.log('📦 CreateShortcut result:', result)

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
          if (!self.portal || !self.sessionHandle) throw new Error('Desktop Portal not connected')
          await self.portal.DeleteShortcut(self.sessionHandle, shortcutId)
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

  cleanup = () => {
    const self = this
    return Effect.gen(function* () {
      for (const [_hotkeyKey, shortcutId] of self.registeredHotkeys) {
        yield* Effect.ignore(
          Effect.tryPromise({
            try: async () => {
              if (self.portal && self.sessionHandle) {
                await self.portal.DeleteShortcut(self.sessionHandle, shortcutId)
              }
            },
            catch: () => undefined,
          }),
        )
      }

      self.registeredHotkeys.clear()
      self.bus?.disconnect()
      self.bus = null
      self.portal = null
      self.sessionHandle = null
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
