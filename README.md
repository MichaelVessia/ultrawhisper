# UltraWhisper

A minimalistic, local-only voice transcription tool for Linux using Effect.ts, similar to SuperWhisper but focused on core functionality.

⚠️ **Personal Project Notice**: This is currently purpose-built for my own Linux setup and workflow. While the core functionality works, it requires manual setup and may not work out-of-the-box on other systems. This is primarily a personal solution for voice-to-text (VTT) on Linux rather than a general-purpose tool ready for wider distribution.

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

**Current Status**: ✅ Core transcription pipeline works perfectly, but **requires manual hotkey setup** in your desktop environment.

### How it works:
1. You manually configure a global hotkey in your desktop environment to run UltraWhisper
2. Press your configured hotkey to start the app - it will begin recording immediately
3. Press the same hotkey again (or let it run) to stop recording and get transcription  
4. Transcribed text is automatically placed in your clipboard

### Setup Instructions

**Prerequisites:**
- `arecord` (ALSA tools): `sudo apt install alsa-utils`
- `xsel` (clipboard): `sudo apt install xsel`
- Working microphone and audio system

**Manual Hotkey Setup (Required):**

You need to set up a keyboard shortcut in your desktop environment to launch UltraWhisper:

**GNOME/Ubuntu:**
1. Open Settings → Keyboard → Keyboard Shortcuts → Custom Shortcuts
2. Add new shortcut:
   - Name: UltraWhisper Record
   - Command: `cd /path/to/ultrawhisper && bun run start`
   - Shortcut: Choose your preferred key (e.g., `Ctrl+Alt+V`)

**Other desktop environments:** Set up a custom keyboard shortcut to run the command above.

⚠️ **Note**: You must manually configure the hotkey in your desktop environment - UltraWhisper does not automatically register global hotkeys.

## What Works (On My System)

✅ **Core transcription pipeline:**
- Audio recording via ALSA (arecord) in 16kHz mono format optimized for Whisper
- Local Whisper model integration using whisper-node (no cloud dependency)
- Clipboard integration using xsel
- Real-time console feedback and error handling

✅ **Hotkey functionality:**
- Responds to hotkey events (when manually configured in desktop environment)
- Toggle recording functionality (press hotkey to start/stop)

🔧 **Setup requirements:**
- Manual hotkey configuration in desktop environment (user responsibility)
- Tested primarily on Ubuntu/GNOME
- May require tweaking for different audio setups
- No configuration file support yet

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

**🎯 Core transcription works, but needs polish for general use**

### To Make This Generally Usable
- [ ] **Better Documentation**: Step-by-step setup guide for different Linux distros
- [ ] **Reliable Hotkey Setup**: Fix automatic global hotkey registration across DEs
- [ ] **Configuration System**: Config files for audio settings, hotkeys, etc.
- [ ] **Installation Script**: Automated dependency checking and setup
- [ ] **Error Handling**: User-friendly error messages and recovery
- [ ] **Testing**: Validation across different Linux environments

### Future Enhancements  
- [ ] **Transcription Modes**: Different Whisper model sizes, languages
- [ ] **Performance Optimization**: Faster startup, model caching
- [ ] **Advanced Features**: Custom hotkeys, output formatting options
