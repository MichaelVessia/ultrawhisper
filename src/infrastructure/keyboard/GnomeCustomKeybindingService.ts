import type { Hotkey } from '@domain/keyboard/Hotkey.ts'
import { HotkeyRegistrationFailed, ServiceUnavailable } from '@domain/keyboard/KeyboardErrors.ts'
import { KeyboardService, type KeyEvent } from '@domain/keyboard/KeyboardService.ts'
import { DEFAULT_RECORDING_HOTKEY } from '@shared/constants.ts'
import { Effect, Layer, Stream } from 'effect'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync, chmodSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export class GnomeCustomKeybindingService implements KeyboardService {
  private registeredHotkeys = new Map<string, string>()
  private keyEventSubject: ((event: KeyEvent) => void) | null = null
  private triggerPath: string
  private socketPath: string

  constructor() {
    const configDir = join(homedir(), '.config', 'ultrawhisper')
    this.triggerPath = join(configDir, 'trigger.sh')
    this.socketPath = join(configDir, 'hotkey.sock')
    
    // Ensure config directory exists
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true })
    }
  }

  private createTriggerScript = () => {
    const script = `#!/bin/bash
# UltraWhisper hotkey trigger script
echo "triggered" > "${this.socketPath}"
`
    writeFileSync(this.triggerPath, script)
    chmodSync(this.triggerPath, 0o755)
    console.log(`✅ Created trigger script at: ${this.triggerPath}`)
  }

  private setupFileWatcher = () => {
    const self = this
    return Effect.gen(function* () {
      console.log(`🔍 Setting up file watcher for: ${self.socketPath}`)
      
      // Simple polling approach for now - check for file changes
      const checkForTrigger = () => {
        if (existsSync(self.socketPath) && self.keyEventSubject) {
          console.log('🚨 GLOBAL HOTKEY DETECTED via custom keybinding! 🚨')
          
          // Remove trigger file
          try {
            const fs = require('node:fs')
            fs.unlinkSync(self.socketPath)
          } catch (e) {
            // Ignore errors
          }
          
          // Emit key event
          const event: KeyEvent = {
            key: '`',
            modifiers: ['ctrl'],
            type: 'down',
          }
          self.keyEventSubject(event)
        }
      }
      
      // Poll every 100ms
      const interval = setInterval(checkForTrigger, 100)
      
      return Effect.sync(() => {
        clearInterval(interval)
      })
    })
  }

  readonly registerHotkey = (hotkey: Hotkey) => {
    const self = this
    return Effect.gen(function* () {
      console.log('🔧 GnomeCustomKeybindingService.registerHotkey called!')
      
      const hotkeyKey = hotkey.toString()
      console.log(`🔑 Setting up trigger detection for: ${hotkeyKey}`)

      if (self.registeredHotkeys.has(hotkeyKey)) {
        console.log(`⚠️  Hotkey ${hotkeyKey} already registered`)
        return
      }

      // Create trigger script
      self.createTriggerScript()
      
      // Show setup instructions
      console.log('')
      console.log('🔧 MANUAL SETUP REQUIRED:')
      console.log('1. Open GNOME Settings → Keyboard → Shortcuts')
      console.log('2. Scroll down and click "View and Customize Shortcuts"')
      console.log('3. Click "Custom Shortcuts" at the bottom')
      console.log('4. Click the "+" button to add a new shortcut')
      console.log('5. Enter:')
      console.log(`   Name: UltraWhisper`)
      console.log(`   Command: ${self.triggerPath}`)
      console.log(`   Shortcut: Ctrl+\` (backtick)`)
      console.log('6. Click "Add" to save')
      console.log('')
      console.log('Once configured, press Ctrl+` anywhere to trigger recording!')
      console.log('')

      self.registeredHotkeys.set(hotkeyKey, 'manual-setup')
      
      // Start file watcher
      yield* self.setupFileWatcher()
      
      yield* Effect.log(`Trigger detection ready for: ${hotkeyKey}`)
    })
  }

  readonly unregisterHotkey = (hotkey: Hotkey) => {
    const self = this
    return Effect.gen(function* () {
      const hotkeyKey = hotkey.toString()
      const keybindingId = self.registeredHotkeys.get(hotkeyKey)

      if (!keybindingId) {
        return
      }

      // TODO: Implement cleanup of custom keybinding
      self.registeredHotkeys.delete(hotkeyKey)
      yield* Effect.log(`Unregistered custom keybinding: ${hotkeyKey}`)
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
      // TODO: Remove custom keybindings from gsettings
      self.registeredHotkeys.clear()
    })
  }
}

export const GnomeCustomKeybindingServiceLive = Layer.effect(
  KeyboardService,
  Effect.gen(function* () {
    const service = new GnomeCustomKeybindingService()

    yield* Effect.addFinalizer(() => service.cleanup())

    return KeyboardService.of(service)
  }),
)