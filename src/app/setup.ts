import type { DesktopEnvironment } from '@infrastructure/keyboard/DesktopIntegration.ts'
import { DEFAULT_RECORDING_HOTKEY } from '@shared/constants.ts'
import { Effect } from 'effect'

export const generateManualSetupInstructions = (desktop: DesktopEnvironment) =>
  Effect.gen(function* () {
    const instructions = getDesktopInstructions(desktop)

    yield* Effect.log(`
📋 Manual Hotkey Setup Instructions

Since automatic hotkey registration failed, you can set up the hotkey manually:

${instructions}

Once configured, the hotkey ${DEFAULT_RECORDING_HOTKEY} will trigger UltraWhisper recording.
`)

    return instructions
  })

function getDesktopInstructions(desktop: DesktopEnvironment): string {
  switch (desktop) {
    case 'gnome':
      return `
🔧 GNOME Setup:
1. Open Settings → Keyboard → Keyboard Shortcuts
2. Click "View and Customize Shortcuts"
3. Click "Custom Shortcuts" at the bottom
4. Click the "+" button to add a new shortcut
5. Set:
   - Name: "UltraWhisper Record"
   - Command: ultrawhisper --record
   - Shortcut: ${DEFAULT_RECORDING_HOTKEY}

Alternative method:
• Run: gsettings set org.gnome.settings-daemon.plugins.media-keys custom-keybindings "['/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/']"
• Run: gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/ name 'UltraWhisper Record'
• Run: gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/ command 'ultrawhisper --record'
• Run: gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/ binding '${DEFAULT_RECORDING_HOTKEY}'`

    case 'kde':
      return `
🔧 KDE Setup:
1. Open System Settings → Shortcuts
2. Click "Custom Shortcuts" in the left panel
3. Right-click → New → Global Shortcut → Command/URL
4. Set:
   - Name: "UltraWhisper Record"
   - Comment: "Voice recording with UltraWhisper"
   - Trigger: ${DEFAULT_RECORDING_HOTKEY}
   - Action: ultrawhisper --record
5. Click Apply

Alternative method:
• Create ~/.config/kglobalshortcutsrc entry or use kwriteconfig5`

    case 'xfce':
      return `
🔧 XFCE Setup:
1. Open Settings → Keyboard
2. Go to "Application Shortcuts" tab
3. Click "Add" button
4. Set:
   - Command: ultrawhisper --record
   - Shortcut: ${DEFAULT_RECORDING_HOTKEY}

Alternative method:
• Run: xfconf-query -c xfce4-keyboard-shortcuts -p "/commands/custom/${DEFAULT_RECORDING_HOTKEY.replace('+', '%2B')}" -n -t string -s "ultrawhisper --record"`

    default:
      return `
🔧 Generic Linux Setup:
Your desktop environment (${desktop}) may support global shortcuts through:

1. System Settings → Keyboard Shortcuts or similar
2. Look for "Custom Shortcuts" or "Application Shortcuts"
3. Add a new shortcut with:
   - Command: ultrawhisper --record
   - Key combination: ${DEFAULT_RECORDING_HOTKEY}

Alternative methods:
• Use a hotkey daemon like 'sxhkd' or 'xbindkeys'
• Configure through your window manager (i3, Sway, etc.)

For tiling window managers:
• i3: Add to ~/.config/i3/config: bindsym ${DEFAULT_RECORDING_HOTKEY} exec ultrawhisper --record
• Sway: Add to ~/.config/sway/config: bindsym ${DEFAULT_RECORDING_HOTKEY} exec ultrawhisper --record`
  }
}

export const showTrayAlternative = Effect.gen(function* () {
  yield* Effect.log(`
💡 Alternative: System Tray

If global hotkeys are not available, UltraWhisper provides a system tray icon:
• Click the microphone icon to start/stop recording
• Right-click for options and settings
• The tray icon shows recording status

This method works on all desktop environments without additional configuration.
`)
})

export const checkHotkeyAvailability = Effect.gen(function* () {
  yield* Effect.log('🔍 Checking hotkey availability...')

  // This would typically test if the hotkey can be registered
  // For now, we'll simulate a simple check

  const canUseGlobalHotkeys = yield* Effect.sync(() => {
    // Check if we're in a graphical environment
    return Boolean(process.env.DISPLAY || process.env.WAYLAND_DISPLAY)
  })

  if (!canUseGlobalHotkeys) {
    yield* Effect.log('❌ No graphical environment detected - global hotkeys unavailable')
    return false
  }

  yield* Effect.log('✅ Graphical environment detected - hotkeys should be available')
  return true
})
