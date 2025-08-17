# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tixid Online (dixitonline) is an online version of the Dixit card game built with TypeScript and Effect. It's a server application using Fastify for HTTP endpoints with a domain-driven design architecture.

## Essential Commands

### Development
- `pnpm dev` - Start development server with hot reload (runs on port 3000)
- `pnpm start` - Start production server

### Testing
- `pnpm test` - Run tests with Vitest
- `pnpm coverage` - Run tests with coverage report

### Build & Type Checking
- `pnpm build` - Build complete package (ESM and CJS outputs)
- `pnpm check` - Type check the entire codebase

### Code Quality
- `pnpm lint` - Run ESLint on all TypeScript files
- `pnpm lint-fix` - Auto-fix linting issues
- Use Biome for formatting (configured in biome.json)

## Architecture

### Core Technologies
- **Effect**: Functional programming library for TypeScript - used throughout for error handling, dependency injection, and service management
- **Fastify**: HTTP server framework
- **Vitest**: Testing framework with Effect integration

### Project Structure

The application follows a domain-driven design with use case pattern:

- `src/game/` - Game domain logic
  - `*.entity.ts` - Domain entities (GameEntity, DeckEntity, PlayerEntity)
  - `*.repository.ts` - Repository interfaces and implementations
  - `*.usecase.ts` - Use cases implementing business logic
  - `index.ts` - Layer composition for dependency injection
  
- `src/server.ts` - Main server entry point with Fastify routes

### Key Patterns

1. **Effect Services & Layers**: All use cases are implemented as Effect services with dependency injection via layers
   ```typescript
   export class CreateGameUseCase extends Effect.Service<CreateGameUseCase>()
   ```

2. **Repository Pattern**: Repositories handle data persistence with in-memory implementations
   - Implements optimistic concurrency control with version tracking

3. **Domain Entities**: Immutable entities with factory methods and snapshot pattern for serialization

4. **Branded Types**: Using Effect's Brand for type-safe IDs (GameId, PlayerId, DeckId)

5. **Error Handling**: Effect-based error handling with typed errors

### Testing Approach

- Tests located in `src/**/*.test.ts`
- Uses test drivers pattern (e.g., `game.driver.ts`) for test utilities
- Effect test utilities from `@effect/vitest`
- Global test setup in `setupTests.ts`

## Important Implementation Details

- **Optimistic Concurrency**: Game entities track version numbers to prevent concurrent modification conflicts
- **Player Management**: Games enforce max 6 players, host cannot leave
- **End Conditions**: Games support two end conditions - number of storyteller rounds or point limit
- **Dependency Injection**: All services use Effect's Layer system for composition