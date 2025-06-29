import { Effect } from 'effect'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export type DesktopEnvironment = 'gnome' | 'kde' | 'xfce' | 'unknown'

export const detectDesktopEnvironment = Effect.gen(function* () {
  const currentDesktop = yield* Effect.sync(() => process.env.XDG_CURRENT_DESKTOP?.toLowerCase())
  const sessionDesktop = yield* Effect.sync(() => process.env.XDG_SESSION_DESKTOP?.toLowerCase())
  const sessionType = yield* Effect.sync(() => process.env.XDG_SESSION_TYPE?.toLowerCase())

  yield* Effect.log(`Desktop detection: XDG_CURRENT_DESKTOP=${currentDesktop}, XDG_SESSION_DESKTOP=${sessionDesktop}, XDG_SESSION_TYPE=${sessionType}`)

  if (currentDesktop?.includes('gnome') || sessionDesktop?.includes('gnome')) {
    return 'gnome' as const
  }

  if (currentDesktop?.includes('kde') || sessionDesktop?.includes('kde')) {
    return 'kde' as const
  }

  if (currentDesktop?.includes('xfce') || sessionDesktop?.includes('xfce')) {
    return 'xfce' as const
  }

  const gnomeShellCheck = yield* Effect.tryPromise({
    try: async () => {
      const { stdout } = await execAsync('pgrep gnome-shell')
      return stdout.trim().length > 0
    },
    catch: () => false,
  })

  if (gnomeShellCheck) {
    return 'gnome' as const
  }

  return 'unknown' as const
})

export const checkDBusService = (serviceName: string) =>
  Effect.gen(function* () {
    return yield* Effect.tryPromise({
      try: async () => {
        const { stdout } = await execAsync(`dbus-send --session --print-reply --dest=org.freedesktop.DBus /org/freedesktop/DBus org.freedesktop.DBus.ListNames | grep -q "${serviceName}"`)
        return true
      },
      catch: () => false,
    })
  })

export const isWayland = Effect.sync(() => process.env.XDG_SESSION_TYPE === 'wayland')

export const getDesktopCapabilities = Effect.gen(function* () {
  const desktop = yield* detectDesktopEnvironment
  const wayland = yield* isWayland
  const hasGnomeShell = yield* checkDBusService('org.gnome.Shell')
  const hasPortal = yield* checkDBusService('org.freedesktop.portal.Desktop')

  return {
    desktop,
    wayland,
    hasGnomeShell,
    hasPortal,
    supportedMethods: [
      ...(hasGnomeShell ? ['gnome-shell'] : []),
      ...(hasPortal ? ['portal'] : []),
    ] as ReadonlyArray<string>,
  }
})