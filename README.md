# Tixid Online

An online implementation of the Dixit board game, built with TypeScript, Effect, Fastify, and HTMX.

## Architecture

### Domain Events & At-Least-Once Delivery

The application uses the **Transactional Outbox Pattern** to guarantee at-least-once delivery of domain events across multiple server instances.

```mermaid
sequenceDiagram
    participant Client
    participant UseCase
    participant DB as PostgreSQL
    participant Outbox as outbox_events
    participant Realtime as Supabase Realtime
    participant Relay as OutboxEventRelay
    participant PubSub as GameEventBus
    participant SSE as SSE Handler

    Note over UseCase,Outbox: Transaction boundary

    Client->>UseCase: Action (e.g., joinGame)
    UseCase->>UseCase: Load aggregate
    UseCase->>UseCase: Execute domain logic
    UseCase->>UseCase: Aggregate returns {entity, events}

    rect rgb(240, 248, 255)
        Note over DB,Outbox: Atomic transaction
        UseCase->>DB: Save game state
        UseCase->>Outbox: Insert domain events
    end

    DB-->>Realtime: postgres_changes INSERT
    Realtime-->>Relay: Broadcast event
    Relay->>PubSub: publish(event)
    Relay->>Outbox: markAsProcessed(eventId)
    PubSub-->>SSE: Stream event
    SSE-->>Client: Server-Sent Event
```

### Event Flow Architecture

```mermaid
flowchart TB
    subgraph Instance_A[Server Instance A]
        UC_A[Use Case]
        Relay_A[OutboxEventRelay]
        PubSub_A[GameEventBus]
        SSE_A[SSE Endpoints]
    end

    subgraph Instance_B[Server Instance B]
        Relay_B[OutboxEventRelay]
        PubSub_B[GameEventBus]
        SSE_B[SSE Endpoints]
    end

    subgraph PostgreSQL
        Games[(games)]
        Outbox[(outbox_events)]
    end

    subgraph Supabase[Supabase Realtime]
        RT[postgres_changes]
    end

    UC_A -->|1. Transaction| Games
    UC_A -->|1. Transaction| Outbox
    Outbox -->|2. INSERT trigger| RT
    RT -->|3. Broadcast| Relay_A
    RT -->|3. Broadcast| Relay_B
    Relay_A -->|4. Publish| PubSub_A
    Relay_B -->|4. Publish| PubSub_B
    PubSub_A -->|5. Stream| SSE_A
    PubSub_B -->|5. Stream| SSE_B
    SSE_A -->|6. Push| Client_A[Clients on A]
    SSE_B -->|6. Push| Client_B[Clients on B]
```

### Key Components

| Component | Description |
|-----------|-------------|
| **GameEntity** | Domain aggregate that produces events on mutation |
| **GameRepository.saveWithEvents** | Atomic save of aggregate + outbox events |
| **OutboxEventRelay** | Listens to Supabase Realtime, publishes to local PubSub |
| **OutboxPollingDaemon** | Fallback polling for missed events |
| **GameEventBus** | In-memory PubSub for SSE delivery |

### Domain Events

Events are defined using Effect's `Data.TaggedEnum`:

```typescript
type GameEvent = Data.TaggedEnum<{
  PlayerJoined: { gameId: GameId; playerId: PlayerId };
  PlayerLeft: { gameId: GameId; playerId: PlayerId };
  GameStarted: { gameId: GameId };
  ClueSubmitted: { gameId: GameId };
  CardSelected: { gameId: GameId; playerId: PlayerId };
  VoteSubmitted: { gameId: GameId; playerId: PlayerId };
  TurnScored: { gameId: GameId };
  GameEnded: { gameId: GameId };
}>;
```

### Guarantees

- **Atomicity**: Game state and events are saved in the same transaction
- **At-least-once delivery**: Events may be delivered multiple times, handlers must be idempotent
- **Cross-instance**: All server instances receive all events via Supabase Realtime
- **Fallback**: Polling daemon catches events missed by Realtime

## Development

### Prerequisites

- Node.js 20+
- pnpm
- Docker (for Supabase local development)

### Commands

```sh
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests (watch mode by default)
pnpm test

# Run tests once without watch mode
pnpm test --run

# Run integration tests (requires Docker)
pnpm test:int

# Type check
pnpm check

# Build
pnpm build

# Database migrations
pnpm db:generate  # Generate migrations from schema
pnpm db:migrate   # Apply migrations
```

### Environment Variables

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dixitonline
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...  # From `supabase status`
```

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify
- **Frontend**: Preact (SSR) + HTMX + Alpine.js
- **Database**: PostgreSQL with Drizzle ORM
- **Functional Programming**: Effect
- **Real-time**: Supabase Realtime + Server-Sent Events
- **Testing**: Vitest with @effect/vitest
