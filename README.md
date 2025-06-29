# UltraWhisper

A minimalistic, local-only voice transcription tool for Linux using Effect.ts, similar to SuperWhisper but focused on core functionality.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Effect.ts
- **Language**: TypeScript
- **Code Quality**: Biome
- **Architecture**: Domain-Driven Design

## Project Structure

```
src/
├── app/                    # Application layer
├── domain/                 # Core domain logic
│   ├── audio/             # Audio recording context
│   ├── transcription/     # Whisper transcription context
│   ├── keyboard/          # Input handling context
│   └── clipboard/         # Output context
├── infrastructure/        # External implementations
└── shared/               # Shared types and errors
```

## Usage

### Global Hotkey

UltraWhisper automatically registers **Ctrl+`** as the global recording hotkey on supported desktop environments.

**Supported environments:**
- ✅ **GNOME** (Ubuntu default) - Uses GNOME Shell DBus API
- ✅ **KDE Plasma** - Uses Desktop Portal API  
- ✅ **XFCE** - Uses Desktop Portal API
- ✅ **Other Wayland compositors** - Uses Desktop Portal API

**How it works:**
1. Press and hold `Ctrl+`` to start recording
2. Release to stop recording and get transcription
3. Text is automatically placed in your clipboard

### Manual Setup

If automatic hotkey registration fails, you can set it up manually:

**GNOME (Ubuntu):**
```bash
# Open Settings → Keyboard → Keyboard Shortcuts → Custom Shortcuts
# Add new shortcut:
# Name: UltraWhisper Record
# Command: ultrawhisper --record  
# Shortcut: Ctrl+`
```

**Other desktop environments:** Run the app and it will show specific instructions for your system.

### System Tray Alternative

If global hotkeys are unavailable, UltraWhisper provides a system tray icon:
- Click to start/stop recording
- Right-click for settings
- Works on all desktop environments

## Development

### Install dependencies
```bash
bun install
```

### Run in development mode (with hot-reload)
```bash
bun run dev
```

### Run the application
```bash
bun run start
```

### Run linter
```bash
bun run lint
```

### Fix linting issues
```bash
bun run lint:fix
```

### Type checking
```bash
bun run typecheck
```

## Milestones

See [plans/](./plans/) directory for detailed implementation plans.

- [x] Milestone 1: Project Setup & Basic Effect.ts Structure
- [x] Milestone 2: Global Hotkey Detection
- [ ] Milestone 3: Audio Recording
- [ ] Milestone 4: Local Whisper Integration
- [ ] Milestone 5: Clipboard Integration
- [ ] Milestone 6: System Tray Integration
- [ ] Milestone 7: Configuration Management
- [ ] Milestone 8: Transcription Modes
- [ ] Milestone 9: Performance Optimization
- [ ] Milestone 10: Polish & Error Handling
