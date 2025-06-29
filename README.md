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
1. Press `Ctrl+`` to start recording
2. Press `Ctrl+`` again to stop recording and get transcription
3. Text is automatically placed in your clipboard

**Current Status**: ✅ **All core functionality is implemented and working!** The application successfully handles the complete pipeline from hotkey detection through audio recording to Whisper transcription and clipboard integration. The app runs as a background service and responds to the global hotkey.

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

## What's Implemented

✅ **Complete voice transcription pipeline:**
- Global hotkey registration (`Ctrl+``) with multi-desktop support
- Audio recording via ALSA (arecord) in 16kHz mono format optimized for Whisper
- Local Whisper model integration using whisper-node (no cloud dependency)
- Automatic clipboard integration using xsel
- Real-time user feedback and error handling

✅ **Cross-desktop Linux support:**
- GNOME Shell (Ubuntu default) via DBus API
- KDE Plasma via Desktop Portal API  
- XFCE and other environments via Desktop Portal API
- Automatic desktop environment detection and fallback

✅ **System integration:**
- Background service mode - runs continuously listening for hotkey
- System dependency checking (arecord, xsel)
- Proper audio format handling and Whisper model initialization
- Memory-efficient streaming architecture using Effect.ts

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

- [x] **Milestone 1**: Project Setup & Basic Effect.ts Structure ✅
- [x] **Milestone 2**: Global Hotkey Detection ✅
- [x] **Milestone 3**: Audio Recording ✅  
- [x] **Milestone 4**: Local Whisper Integration ✅
- [x] **Milestone 5**: Clipboard Integration ✅

**🎉 Core application is complete and functional!**

### Future Milestones
- [ ] **Milestone 7**: Configuration Management
- [ ] **Milestone 8**: Transcription Modes
- [ ] **Milestone 9**: Performance Optimization
- [ ] **Milestone 10**: Polish & Error Handling
