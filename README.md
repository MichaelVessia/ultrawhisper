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
- [ ] Milestone 2: Global Hotkey Detection
- [ ] Milestone 3: Audio Recording
- [ ] Milestone 4: Local Whisper Integration
- [ ] Milestone 5: Clipboard Integration
- [ ] Milestone 6: System Tray Integration
- [ ] Milestone 7: Configuration Management
- [ ] Milestone 8: Transcription Modes
- [ ] Milestone 9: Performance Optimization
- [ ] Milestone 10: Polish & Error Handling
