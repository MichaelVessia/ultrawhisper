# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `bun run dev` - Run in development mode with hot-reload
- `bun run start` - Run the application
- `bun install` - Install dependencies

### Code Quality
- `bun run lint` - Run linter (Biome)
- `bun run lint:fix` - Fix linting issues automatically
- `bun run format` - Format code
- `bun run typecheck` - Type check without emitting

### Build
- `bun run build` - Build for production

## Architecture

This is a Linux voice transcription application built with Effect.ts using Domain-Driven Design principles.

### Core Structure
- **Domain Layer** (`src/domain/`): Pure business logic organized by context
  - `audio/` - Audio recording and processing
  - `keyboard/` - Global hotkey handling and input events
  - `transcription/` - Whisper integration for speech-to-text
  - `clipboard/` - System clipboard integration
- **Infrastructure Layer** (`src/infrastructure/`): External system integrations
  - Platform-specific implementations (GNOME, KDE, Desktop Portal)
  - Service factories for runtime detection
- **Application Layer** (`src/app/`): Application coordination and setup
- **Shared** (`src/shared/`): Common types, constants, and utilities

### Key Patterns
- **Effect.ts**: All async operations use Effect for composable error handling
- **Service Pattern**: Domain services defined as interfaces, implemented in infrastructure
- **Factory Pattern**: Runtime detection of desktop environment capabilities
- **Stream Processing**: Keyboard events handled as Effect streams

### Desktop Integration
The app supports multiple Linux desktop environments:
- **GNOME**: Direct GNOME Shell DBus integration
- **KDE/XFCE/Others**: Desktop Portal API (standard approach)
- **Fallback**: Mock service for unsupported environments

Service selection happens at runtime via `KeyboardServiceFactory` based on detected capabilities.

### Path Aliases
- `@app/*` → `src/app/*`
- `@domain/*` → `src/domain/*`
- `@infrastructure/*` → `src/infrastructure/*`
- `@shared/*` → `src/shared/*`

## Tech Stack
- **Runtime**: Bun
- **Framework**: Effect.ts for functional programming
- **Language**: TypeScript with strict mode
- **Linting**: Biome (replaces ESLint/Prettier)
- **Desktop Integration**: D-Bus (dbus-next) for Linux desktop APIs

## Development Notes
- Uses 2-space indentation, single quotes, no semicolons (Biome config)
- Entry point: `src/index.ts` → `src/main.ts`