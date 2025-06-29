# Milestone 1: Project Setup & Basic Effect.ts Structure

## Overview
Set up UltraWhisper with Domain-Driven Design architecture, using Bun, Effect.ts, and modern tooling. The structure will reflect the bounded contexts identified in the initial prompt.

## Domain-Driven Design Structure
```
ultrawhisper/
├── src/
│   ├── index.ts                    # Application entry point
│   ├── app/                        # Application layer
│   │   ├── cli.ts                  # CLI interface
│   │   └── config.ts               # App configuration
│   ├── domain/                     # Core domain logic
│   │   ├── audio/                  # Audio recording context
│   │   │   ├── AudioRecording.ts   # Value object
│   │   │   ├── AudioService.ts     # Domain service interface
│   │   │   └── AudioErrors.ts      # Domain-specific errors
│   │   ├── transcription/          # Transcription context
│   │   │   ├── Transcript.ts       # Entity
│   │   │   ├── WhisperService.ts   # Domain service interface
│   │   │   └── TranscriptionMode.ts # Value object
│   │   ├── keyboard/               # Input handling context
│   │   │   ├── Hotkey.ts           # Value object
│   │   │   └── KeyboardService.ts  # Domain service interface
│   │   └── clipboard/              # Output context
│   │       ├── ClipboardService.ts # Domain service interface
│   │       └── InsertionMode.ts    # Value object
│   ├── infrastructure/             # External implementations
│   │   ├── audio/                  # Audio recording impl
│   │   ├── transcription/          # Whisper integration
│   │   ├── keyboard/               # Global hotkey impl
│   │   ├── clipboard/              # System clipboard impl
│   │   ├── config/                 # Configuration persistence
│   │   └── tray/                   # System tray impl
│   ├── shared/                     # Shared kernel
│   │   ├── types.ts                # Common types
│   │   └── errors.ts               # Base error types
│   └── main.ts                     # Effect program composition
├── test/                           # Tests mirror src structure
├── package.json
├── tsconfig.json
├── biome.json
└── README.md
```

## Implementation Tasks

### 1. Initialize Bun Project with DDD Structure
- Create directory structure following bounded contexts
- Set up TypeScript with path aliases for clean imports
- Configure module boundaries

### 2. Set up Effect.ts with DDD Patterns
- Create base Effect services for each domain context
- Define service interfaces in domain layer
- Set up dependency injection with Effect layers

### 3. Create Basic CLI with Domain Logic
- Implement minimal AudioService interface
- Create simple Effect program that composes services
- Print "Recording audio..." when hotkey pressed

### 4. Configure Modern Tooling
- Biome configuration with import order rules
- Enforce architectural boundaries (domain can't import infrastructure)
- Set up development scripts

### 5. Establish Service Architecture
- Define core service traits using Effect
- Create infrastructure layer structure
- Set up proper error handling patterns

## Key Design Principles
- **Domain Independence**: Domain layer has no external dependencies
- **Service Interfaces**: All external interactions through interfaces
- **Effect Composition**: Services composed using Effect layers
- **Error Handling**: Domain-specific errors, Effect error channels
- **Immutability**: All domain objects are immutable

## Initial Services to Define
```typescript
// Domain service interfaces (no implementations yet)
- AudioService: Record/stop audio, get audio stream
- KeyboardService: Register hotkeys, event streams  
- WhisperService: Transcribe audio to text
- ClipboardService: Insert text at cursor
- ConfigService: Load/save configuration
- TrayService: System tray interactions
```

## Success Criteria
- [ ] Bun project initialized with TypeScript
- [ ] Effect.ts integrated with basic program structure
- [ ] DDD folder structure created
- [ ] Basic CLI prints "Hello from Effect"
- [ ] Development environment configured with Biome
- [ ] Hot-reload working with Bun's watch mode

## Implementation Log

### Step 1: Initialize Bun Project
- Created project directory structure
- Initialized with `bun init`
- Configured TypeScript with strict settings

### Step 2: Install Dependencies
- Effect.ts core packages
- Development tools (Biome)

### Step 3: Create Domain Structure
- Set up bounded contexts
- Define service interfaces
- Create shared types

### Step 4: Basic Effect Program
- Simple CLI that uses Effect
- Service layer architecture
- Dependency injection setup