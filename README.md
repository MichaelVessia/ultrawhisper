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

UltraWhisper can now run as a background daemon, allowing you to toggle recording on/off with a global keybind without keeping a terminal open.

### Setup Instructions

**Prerequisites:**
- `arecord` (ALSA tools): `sudo apt install alsa-utils`
- `xsel` (clipboard): `sudo apt install xsel`
- Working microphone and audio system

**1. Install Scripts to PATH (Recommended):**

```bash
# Create symlinks to make scripts globally available
sudo ln -sf "$(pwd)/bin/ultrawhisper" /usr/local/bin/ultrawhisper
sudo ln -sf "$(pwd)/bin/ultrawhisper-toggle" /usr/local/bin/ultrawhisper-toggle

# Or add to your PATH in ~/.bashrc or ~/.zshrc:
export PATH="$PATH:/path/to/ultrawhisper/bin"
```

**2. Start the Daemon:**

```bash
# Start the background service
ultrawhisper start

# Check status
ultrawhisper status

# View logs
ultrawhisper logs

# Stop the service
ultrawhisper stop
```

**3. Set Up Global Keybinding:**

**Option A: Manual GNOME Setup**
1. Start the daemon: `ultrawhisper start`
2. Open Settings → Keyboard → Keyboard Shortcuts → Custom Shortcuts
3. Add new shortcut:
   - Name: UltraWhisper Toggle
   - Command: `ultrawhisper-toggle`
   - Shortcut: `Ctrl+\`` (backtick) or your preferred key

**Option B: Home Manager (NixOS)**
```nix
"org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0" = {
  name = "UltraWhisper Toggle";
  command = "ultrawhisper-toggle";
  binding = "<Primary>grave";  # Ctrl+`
};
```

### How it works:
1. Start the daemon once: `ultrawhisper start`
2. The daemon runs in the background listening for toggle commands
3. Press your configured hotkey anywhere to start/stop recording
4. Transcribed text is automatically placed in your clipboard
5. The daemon continues running until you stop it

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

### Daemon Management
```bash
# Start as background daemon
bun run daemon:start

# Stop the daemon
bun run daemon:stop

# Check daemon status
bun run daemon:status

# View daemon logs
bun run daemon:logs

# Toggle recording (daemon must be running)
bun run toggle
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
