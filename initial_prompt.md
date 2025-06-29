# SuperWhisper Linux Clone - Development Plan

## Project Overview
Build a minimalistic, local-only voice transcription tool for Linux using Effect.ts, similar to SuperWhisper but focused on core functionality.

## Core Technologies
- **Effect.ts**: Main application framework
- **Node.js**: Runtime environment
- **Whisper**: Local transcription model (whisper.cpp or whisper-node)
- **node-global-key-listener**: Global hotkey detection
- **node-record-lpcm16**: Audio recording
- **X11/Wayland**: Clipboard and window interaction

## Milestone Breakdown

### Milestone 1: Project Setup & Basic Effect.ts Structure
**Goal**: Establish project foundation with Effect.ts patterns

**Tasks**:
1. Initialize Node.js project with TypeScript
2. Set up Effect.ts with basic program structure
3. Create basic CLI that prints "Hello from Effect"
4. Set up development environment (nodemon, ts-node)

**Test**: Run `npm start` and see Effect program execute successfully

**Deliverables**:
- package.json with dependencies
- tsconfig.json configured for Effect.ts
- Basic Effect program that runs

---

### Milestone 2: Global Hotkey Detection
**Goal**: Detect global keypresses on Linux

**Tasks**:
1. Integrate node-global-key-listener or similar library
2. Create Effect service for keyboard monitoring
3. Implement configurable hotkey (e.g., Ctrl+Alt+Space)
4. Handle key down/up events with Effect streams

**Test**: Press hotkey anywhere in Linux and see console output

**Deliverables**:
- KeyboardService using Effect patterns
- Hotkey configuration
- Event stream handling

---

### Milestone 3: Audio Recording
**Goal**: Record audio from microphone using Effect.ts

**Tasks**:
1. Integrate audio recording library (node-record-lpcm16)
2. Create AudioService with Effect
3. Start/stop recording based on hotkey
4. Save audio to temporary WAV file
5. Handle errors gracefully (no mic, permissions)

**Test**: Hold hotkey, speak, release, and verify WAV file created

**Deliverables**:
- AudioService with record/stop methods
- Temporary file management
- Error handling for audio permissions

---

### Milestone 4: Local Whisper Integration
**Goal**: Transcribe audio using local Whisper model

**Tasks**:
1. Choose Whisper implementation (whisper.cpp Node bindings or whisper-node)
2. Create WhisperService in Effect
3. Download and configure small Whisper model (tiny or base)
4. Implement transcription pipeline
5. Handle model loading and errors

**Test**: Record audio and get text transcription in console

**Deliverables**:
- WhisperService with transcribe method
- Model management
- Transcription configuration (language, model size)

---

### Milestone 5: Clipboard Integration
**Goal**: Insert transcribed text at cursor position

**Tasks**:
1. Integrate clipboard library (node-clipboard or xclip wrapper)
2. Create ClipboardService with Effect
3. Save current clipboard state
4. Simulate paste operation (Ctrl+V)
5. Restore clipboard if needed

**Test**: Transcribed text appears where cursor was positioned

**Deliverables**:
- ClipboardService
- Text insertion mechanism
- Clipboard state management

---

### Milestone 6: System Tray Integration
**Goal**: Add system tray icon with basic controls

**Tasks**:
1. Integrate electron or node-systray for tray icon
2. Create TrayService with Effect
3. Show recording status in tray
4. Add basic menu (quit, settings)
5. Visual feedback during recording

**Test**: See tray icon that changes during recording

**Deliverables**:
- TrayService
- Status indicators
- Basic menu functionality

---

### Milestone 7: Configuration Management
**Goal**: Persistent settings for the application

**Tasks**:
1. Create ConfigService with Effect
2. Define configuration schema (hotkeys, model, language)
3. Load/save from ~/.config/superwhisper-clone/
4. Hot-reload configuration changes
5. Validate configuration

**Test**: Change config file and see changes take effect

**Deliverables**:
- ConfigService
- Configuration file format
- Settings validation

---

### Milestone 8: Transcription Modes
**Goal**: Support different transcription workflows

**Tasks**:
1. Implement multiple modes (instant paste, window popup, clipboard only)
2. Create mode selection via hotkeys or tray menu
3. Add punctuation and capitalization options
4. Implement "continuous mode" (keep recording until stopped)

**Test**: Switch between modes and verify behavior

**Deliverables**:
- Multiple transcription modes
- Mode switching logic
- Enhanced text processing

---

### Milestone 9: Performance Optimization
**Goal**: Ensure fast, responsive transcription

**Tasks**:
1. Implement audio streaming to Whisper (if supported)
2. Pre-load Whisper model at startup
3. Optimize Effect layers and services
4. Add performance logging
5. Implement audio level detection (VAD)

**Test**: Transcription appears within 1-2 seconds of speaking

**Deliverables**:
- Optimized transcription pipeline
- Performance metrics
- Voice activity detection

---

### Milestone 10: Polish & Error Handling
**Goal**: Make the app robust and user-friendly

**Tasks**:
1. Comprehensive error handling with Effect
2. User notifications for errors
3. Graceful degradation
4. Resource cleanup on exit
5. Basic logging system

**Test**: App handles various error scenarios gracefully

**Deliverables**:
- Error handling throughout
- User notifications
- Clean shutdown procedures

---

## Technical Architecture

### Effect.ts Service Structure
```typescript
// Core services to implement
- KeyboardService: Global hotkey monitoring
- AudioService: Microphone recording
- WhisperService: Local transcription
- ClipboardService: Text insertion
- ConfigService: Settings management
- TrayService: System tray UI
```

### Key Effect.ts Patterns to Use
- Services and Layers for dependency injection
- Streams for audio and keyboard events
- Error handling with Effect.catchAll
- Resource management with Effect.acquireRelease
- Configuration with Config module

## Development Tips

1. **Start Simple**: Get each milestone working with minimal features first
2. **Test on Real Linux**: Ensure compatibility with your specific desktop environment
3. **Use Effect.ts Idioms**: Leverage Effect's error handling and composition
4. **Keep It Local**: No network calls, everything runs on-device
5. **Focus on Core Loop**: Record → Transcribe → Insert should be rock-solid

## Dependencies to Research

- **Audio**: node-record-lpcm16, sox, or similar
- **Whisper**: whisper.cpp Node bindings, whisper-node, or child process
- **Global Keys**: node-global-key-listener, iohook, or X11 bindings
- **Clipboard**: node-clipboard, clipboardy, or xclip wrapper
- **Tray**: node-systray or minimal Electron setup

## Success Criteria

- Can record audio with a global hotkey
- Transcribes locally without internet
- Inserts text where cursor is positioned
- Minimal resource usage when idle
- Fast transcription (under 2 seconds)
- Works reliably on your Linux setup
