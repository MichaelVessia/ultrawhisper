export const DEFAULT_RECORDING_HOTKEY = 'ctrl+`' as const

export const RECORDING_HOTKEY_ACCELERATOR = '<Control>grave' as const

export const APPLICATION_NAME = 'UltraWhisper' as const

export const DBUS_SERVICES = {
  GNOME_SHELL: 'org.gnome.Shell',
  DESKTOP_PORTAL: 'org.freedesktop.portal.Desktop',
  FREEDESKTOP_DBUS: 'org.freedesktop.DBus',
} as const

export const DBUS_PATHS = {
  GNOME_SHELL: '/org/gnome/Shell',
  DESKTOP_PORTAL: '/org/freedesktop/portal/desktop',
  FREEDESKTOP_DBUS: '/org/freedesktop/DBus',
} as const