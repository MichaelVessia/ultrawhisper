import { TrayService } from '@domain/tray/TrayService.ts'
import { TrayStatus } from '@domain/tray/TrayStatus.ts'
import { TrayInitializationError, TrayNotSupportedError } from '@domain/tray/TrayErrors.ts'
import { Console, Effect, Layer } from 'effect'
import { app, Tray, Menu, nativeImage } from 'electron'
import { TrayIcons } from './TrayIcons.ts'

export class ElectronTrayService implements TrayService {
  private tray: Tray | null = null
  private currentStatus: TrayStatus = TrayStatus.Idle

  isSupported = (): Effect.Effect<boolean, unknown, never> => {
    return Effect.sync(() => {
      // Check if we're in an Electron environment and system tray is supported
      try {
        return process.versions.electron !== undefined && 
               process.platform !== 'darwin' || 
               app.dock !== undefined
      } catch {
        return false
      }
    })
  }

  showTray = (): Effect.Effect<void, unknown, never> => {
    return Effect.gen(function* () {
      if (this.tray) {
        return
      }

      yield* Console.log('🖥️  Initializing system tray...')

      try {
        // Create tray icon
        const icon = nativeImage.createFromDataURL(TrayIcons.idle)
        this.tray = new Tray(icon)
        
        // Set initial tooltip
        this.tray.setToolTip('UltraWhisper - Voice Transcription')
        
        // Create context menu
        const contextMenu = Menu.buildFromTemplate([
          {
            label: 'Start Recording',
            click: () => {
              // This will be handled by the main application
              Console.log('Tray: Start recording clicked').pipe(Effect.runSync)
            }
          },
          {
            label: 'Stop Recording',
            enabled: false,
            click: () => {
              Console.log('Tray: Stop recording clicked').pipe(Effect.runSync)
            }
          },
          { type: 'separator' },
          {
            label: 'Quit',
            click: () => {
              app.quit()
            }
          }
        ])
        
        this.tray.setContextMenu(contextMenu)
        
        // Handle left click (primary action)
        this.tray.on('click', () => {
          Console.log('Tray: Primary click - toggle recording').pipe(Effect.runSync)
        })

        yield* Console.log('✅ System tray initialized')
      } catch (error) {
        yield* Effect.die(new TrayInitializationError(`Failed to create tray: ${error}`))
      }
    }.bind(this))
  }

  hideTray = (): Effect.Effect<void, unknown, never> => {
    return Effect.sync(() => {
      if (this.tray) {
        this.tray.destroy()
        this.tray = null
      }
    })
  }

  updateStatus = (status: TrayStatus): Effect.Effect<void, unknown, never> => {
    return Effect.gen(function* () {
      if (!this.tray) {
        return
      }

      this.currentStatus = status
      
      // Update icon based on status
      const iconData = TrayIcons[status]
      const icon = nativeImage.createFromDataURL(iconData)
      this.tray.setImage(icon)
      
      // Update tooltip
      const tooltips = {
        [TrayStatus.Idle]: 'UltraWhisper - Ready to record',
        [TrayStatus.Recording]: 'UltraWhisper - Recording...',
        [TrayStatus.Processing]: 'UltraWhisper - Processing...'
      }
      this.tray.setToolTip(tooltips[status])
      
      // Update context menu
      const contextMenu = Menu.buildFromTemplate([
        {
          label: status === TrayStatus.Recording ? 'Stop Recording' : 'Start Recording',
          enabled: status !== TrayStatus.Processing,
          click: () => {
            const action = status === TrayStatus.Recording ? 'Stop' : 'Start'
            Console.log(`Tray: ${action} recording clicked`).pipe(Effect.runSync)
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          click: () => {
            app.quit()
          }
        }
      ])
      
      this.tray.setContextMenu(contextMenu)
      
      yield* Console.log(`🔄 Tray status updated: ${status}`)
    }.bind(this))
  }
}

export const ElectronTrayServiceLayer = Layer.succeed(
  TrayService,
  new ElectronTrayService()
)