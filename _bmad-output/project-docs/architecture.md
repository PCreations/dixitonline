# Architecture Technique - Tixid Online

## Vue d'ensemble

**Tixid Online** est une implémentation web du jeu de société Dixit, construite selon les principes du **Domain-Driven Design (DDD)** et de l'**architecture hexagonale** (Ports & Adapters).

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Preact JSX    │  │      HTMX       │  │   Alpine.js     │  │
│  │   (SSR only)    │  │  (HTTP swap)    │  │  (local state)  │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
┌───────────┼────────────────────┼────────────────────┼───────────┐
│           │              HTTP LAYER                 │           │
│  ┌────────▼────────────────────▼────────────────────▼────────┐  │
│  │                    Fastify 5.x Routes                     │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  │
│  │  │ home     │ │ auth     │ │ game     │ │ events (SSE) │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                      APPLICATION LAYER                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Use Cases (Commands)                   │  │
│  │  CreateGame │ JoinGame │ StartGame │ SubmitClue │ Vote    │  │
│  │  SelectCard │ LeaveGame │ NotifyReadyForNextTurn          │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  Query Services (Reads)                   │  │
│  │               LobbyQueryService │ GameViewProjector       │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                        DOMAIN LAYER                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Rich Aggregates                        │  │
│  │                                                           │  │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐  │  │
│  │  │ GameEntity  │   │ TurnEntity  │   │  PlayerEntity   │  │  │
│  │  │ (state     │◄──│ (phases,    │   │  (profile,      │  │  │
│  │  │  machine)   │   │  scoring)   │   │   anonymous)    │  │  │
│  │  └─────────────┘   └─────────────┘   └─────────────────┘  │  │
│  │                                                           │  │
│  │  ┌─────────────┐   ┌─────────────────────────────────┐    │  │
│  │  │ DeckEntity  │   │ Domain Events (TaggedEnum)      │    │  │
│  │  │ (cards,     │   │ PlayerJoined │ GameStarted │    │    │  │
│  │  │  shuffle)   │   │ ClueSubmitted │ VoteSubmitted   │    │  │
│  │  └─────────────┘   └─────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                 Ports (Abstract Interfaces)               │  │
│  │  GameRepository │ DeckRepository │ PlayerRepository       │  │
│  │  OutboxRepository │ GameEventBus │ ShufflerService        │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  Database (PostgreSQL)                    │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐   │  │
│  │  │ Drizzle ORM  │ │ games table  │ │ outbox_events    │   │  │
│  │  │ (type-safe)  │ │ (JSONB data) │ │ (event delivery) │   │  │
│  │  └──────────────┘ └──────────────┘ └──────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Supabase Integration                    │  │
│  │  Auth (JWT) │ Storage (card images) │ Realtime (outbox)   │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     Observability                         │  │
│  │  OpenTelemetry (tracing) │ Sentry (errors) │ Pino (logs)  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Stack Technologique

| Catégorie | Technologie | Version | Rôle |
|-----------|-------------|---------|------|
| **Runtime** | Node.js | 22+ | JavaScript server runtime |
| **Framework HTTP** | Fastify | 5.5 | Web server, routing, plugins |
| **Paradigme** | Effect | 3.19 | Functional programming, DI, error handling |
| **ORM** | Drizzle | 0.44 | Type-safe SQL queries |
| **Database** | PostgreSQL | 15+ | Persistence (via Supabase) |
| **SSR** | Preact | 10.27 | JSX templating |
| **Interactivité** | HTMX + Alpine.js | 2.x / 3.x | Partial page updates + local state |
| **CSS** | TailwindCSS | 4.1 | Utility-first styling |
| **Auth** | Supabase Auth | 2.89 | JWT authentication |
| **Tests** | Vitest + Playwright | 3.2 / 1.57 | Unit/Integration/E2E testing |
| **Linting** | Biome | 2.1 | Fast linter + formatter |

## Patterns Architecturaux

### 1. Hexagonal Architecture (Ports & Adapters)

```
     Driving Adapters              Driven Adapters
  ┌─────────────────┐           ┌─────────────────┐
  │  HTTP Routes    │──────────►│ DrizzleGameRepo │
  │  SSE Events     │           │ InMemoryGameRepo│
  └─────────────────┘           └─────────────────┘
          │                              ▲
          ▼                              │
  ┌─────────────────────────────────────────────────┐
  │                 APPLICATION CORE                 │
  │  ┌─────────┐  ┌─────────────┐  ┌───────────┐    │
  │  │Use Cases│◄─│   Domain    │─►│   Ports   │────┼──► Abstract interfaces
  │  │(Commands)│ │ (Entities)  │  │(Contracts)│    │
  │  └─────────┘  └─────────────┘  └───────────┘    │
  └─────────────────────────────────────────────────┘
```

**Principe fondamental** : L'application core ne dépend jamais des détails d'implémentation.

### 2. Effect Service Pattern

Tous les services utilisent le pattern `Effect.Service` pour l'injection de dépendances :

```typescript
export class CreateGameUseCase extends Effect.Service<CreateGameUseCase>()(
  'game/CreateGameUseCase',
  {
    effect: Effect.gen(function* () {
      // Dépend des ABSTRACTIONS (Context.Tag)
      const gameRepository = yield* GameRepository;
      const deckRepository = yield* DeckRepository;

      return {
        createGame: (command: CreateGameCommand) =>
          Effect.gen(function* () {
            // Business logic...
          }),
      };
    }),
    // NO baked-in dependencies
  },
) {}
```

### 3. Rich Domain Entities

Les entités contiennent la logique métier et produisent des événements de domaine :

```typescript
// Mutation returns entity + events
const { entity: updatedGame, events } = yield* gameEntity.start({
  playerId,
  deck,
  startedAt: new Date(),
});
```

### 4. Transactional Outbox Pattern

```
┌──────────────────────────────────────────────────────────┐
│                      Use Case                            │
│  1. Load aggregate                                       │
│  2. Execute domain logic → produces events               │
│  3. Save game + events atomically (single transaction)   │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                  PostgreSQL Transaction                  │
│  ┌────────────────┐    ┌────────────────────────────┐    │
│  │  games table   │    │    outbox_events table     │    │
│  │  (state)       │    │    (events to relay)       │    │
│  └────────────────┘    └─────────────┬──────────────┘    │
└──────────────────────────────────────┼───────────────────┘
                                       │
         ┌─────────────────────────────┴──────────────────┐
         │                                                │
         ▼                                                ▼
┌─────────────────────┐                    ┌──────────────────────┐
│  Supabase Realtime  │                    │  Polling Daemon      │
│  (INSERT trigger)   │                    │  (fallback recovery) │
└──────────┬──────────┘                    └───────────┬──────────┘
           │                                           │
           └──────────────────┬────────────────────────┘
                              ▼
                   ┌─────────────────────┐
                   │   GameEventBus      │
                   │   (local PubSub)    │
                   └──────────┬──────────┘
                              ▼
                   ┌─────────────────────┐
                   │   SSE Endpoints     │
                   │   (push to clients) │
                   └─────────────────────┘
```

### 5. CQRS (Command Query Responsibility Segregation)

- **Commands** (Use Cases) : Modifient l'état via les aggregates
- **Queries** (Query Services) : Lecture optimisée via projections

```typescript
// Command: modifie l'état
yield* joinGameUseCase.joinGame({ gameId, playerId });

// Query: lecture seule
const lobbyState = yield* lobbyQueryService.getLobbyState(gameId, playerId);
```

## Structure des Modules

### Module Game (Domaine Principal)

```
src/game/
├── game.entity.ts            # Aggregate root (state machine)
├── turn.entity.ts            # Turn phases and scoring
├── deck.entity.ts            # Cards and shuffling
├── player.entity.ts          # Player value object
├── game-events.ts            # Domain events (TaggedEnum)
├── game-rules.ts             # Scoring rules
├── game-snapshot.schema.ts   # Effect.Schema for validation
│
├── create-game.usecase.ts    # Create game command
├── join-game.usecase.ts      # Join game command
├── start-game.usecase.ts     # Start game command
├── submit-clue.usecase.ts    # Storyteller submits clue
├── select-card.usecase.ts    # Players select cards
├── vote-on-card.usecase.ts   # Players vote
│
├── game.repository.ts        # Repository port + InMemory impl
├── game-event-bus.ts         # Event bus port + impl
├── game-view.ts              # View projection port
├── game-view-projector.ts    # View projection logic
├── lobby.query-service.ts    # Lobby read model
│
├── index.ts                  # Layer composition
│
├── infra/drizzle/            # PostgreSQL implementation
│   ├── drizzle-game.repository.ts
│   └── game-snapshot.schema.test.ts
│
└── tests/                    # Test infrastructure
    ├── game.driver.ts        # Test DSL (Given/When/Then)
    ├── game.builder.ts       # Scenario builder
    └── *.test.ts             # Test suites
```

### Module Player

```
src/player/
├── player.entity.ts
├── player.repository.ts
├── ensure-player-exists.usecase.ts
├── index.ts
└── tests/
```

### Infrastructure

```
src/infra/
├── db/
│   ├── schema.ts             # Drizzle table definitions
│   └── database.service.ts   # Database connection service
│
├── outbox/
│   ├── outbox.repository.ts
│   ├── outbox-event-relay.ts    # Supabase Realtime listener
│   └── outbox-polling-daemon.ts # Fallback polling
│
├── supabase/
│   └── supabase-client.service.ts
│
└── observability/
    └── tracing.ts            # OpenTelemetry setup
```

### Présentation (View)

```
src/view/
├── render.tsx                # SSR utilities
├── components/
│   ├── Lobby.tsx            # Lobby page
│   ├── LobbyContent.tsx     # Lobby partial (HTMX swap)
│   ├── Game.tsx             # Game board
│   ├── Card.tsx             # Card display
│   └── ...
├── view-models/
│   └── lobby.view-model.ts  # Pure functions: state → view
└── assets/styles/
    └── main.css             # TailwindCSS source
```

## Modèle de Données

### Tables PostgreSQL

```sql
-- Game state (JSONB for flexibility)
CREATE TABLE games (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL,  -- 'NotStartedGame' | 'StartedGame' | 'EndedGame'
  data JSONB NOT NULL,   -- Full game state snapshot
  version INTEGER NOT NULL  -- Optimistic locking
);

-- Player profiles
CREATE TABLE players (
  id UUID PRIMARY KEY,      -- = Supabase auth.users.id
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Transactional outbox for event delivery
CREATE TABLE outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type TEXT NOT NULL,  -- 'game', 'player'
  aggregate_id UUID NOT NULL,
  aggregate_version INTEGER NOT NULL,
  event_type TEXT NOT NULL,      -- 'playerJoined', 'gameStarted', etc.
  payload JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP         -- NULL until relayed
);
```

### Domain Events

```typescript
export type GameEvent = Data.TaggedEnum<{
  PlayerJoined: { readonly gameId: GameId; readonly playerId: PlayerId };
  PlayerLeft: { readonly gameId: GameId; readonly playerId: PlayerId };
  GameStarted: { readonly gameId: GameId };
  ClueSubmitted: { readonly gameId: GameId };
  CardSelected: { readonly gameId: GameId; readonly playerId: PlayerId };
  VoteSubmitted: { readonly gameId: GameId; readonly playerId: PlayerId };
  TurnScored: { readonly gameId: GameId };
  GameEnded: { readonly gameId: GameId };
}>;
```

## Testing Strategy

### Four-Layer Testing Model

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: In-Memory (Unit Tests)                            │
│  - InMemoryGameRepository                                   │
│  - Fast, deterministic, no external deps                    │
│  - Tests: src/game/tests/*.test.ts                         │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Drizzle (Integration Tests)                       │
│  - DrizzleGameRepository + PostgreSQL (Testcontainers)      │
│  - Tests: acceptance/channels/drizzle/*.int.test.ts        │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: E2E (Playwright)                                  │
│  - Real browser + full stack                                │
│  - Tests: acceptance/channels/playwright/*.spec.ts         │
└─────────────────────────────────────────────────────────────┘
```

### GameDriver DSL

```typescript
it.effect('should allow players to join a game', () =>
  Effect.gen(function* () {
    const driver = yield* GameDriver;

    // GIVEN
    yield* driver.given.existingNonStartedGame({
      gameId: 'game-1',
      hostId: 'player-1',
    });

    // WHEN
    yield* driver.when.joiningGame({
      gameId: 'game-1',
      playerId: 'player-2',
    });

    // THEN
    yield* driver.assert.playerToHaveJoinedGame({
      gameId: 'game-1',
      playerId: 'player-2',
    });
  })
);
```

## Flux de Données

### Flux d'une Action de Jeu

```
1. Client (browser)
   │  hx-post="/game/{gameId}/join"
   │
   ▼
2. Fastify Route Handler
   │  const program = Effect.gen(function* () {
   │    const joinGameUseCase = yield* JoinGameUseCase;
   │    yield* joinGameUseCase.joinGame({ gameId, playerId });
   │  });
   │
   ▼
3. Use Case (JoinGameUseCase)
   │  // Load aggregate
   │  const game = yield* gameRepository.findNotStartedGameById(gameId);
   │  // Execute domain logic
   │  const { entity, events } = yield* game.join({ playerId });
   │  // Save with events (transactional)
   │  yield* gameRepository.saveWithEvents(entity, events);
   │
   ▼
4. Repository (DrizzleGameRepository)
   │  BEGIN TRANSACTION
   │  INSERT INTO games ... ON CONFLICT DO UPDATE (optimistic lock)
   │  INSERT INTO outbox_events ...
   │  COMMIT
   │
   ▼
5. Event Delivery
   │  Supabase Realtime → OutboxEventRelay → GameEventBus
   │                                              │
   ▼                                              ▼
6. SSE Endpoint                           Other clients
   │  Push event to connected clients     receive update
   │
   ▼
7. HTMX Swap
   Client updates DOM with new lobby state
```

## Configuration Environnement

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `SUPABASE_URL` | Supabase project URL | `http://127.0.0.1:54321` |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | - |
| `SUPABASE_JWT_ISSUER` | JWT issuer for validation | - |
| `SENTRY_DSN` | Sentry error tracking | - |
| `NODE_ENV` | Environment mode | `development` |

## Considérations de Sécurité

1. **Authentification** : JWT validation via Supabase Auth
2. **Autorisation** : Player verification dans chaque use case
3. **Validation** : Effect.Schema pour toutes les entrées/sorties DB
4. **Optimistic Locking** : Prévention des conditions de course
5. **RLS** (Row Level Security) : Configuré dans Supabase

## Points d'Évolution

- [ ] Event Sourcing complet (replay des événements)
- [ ] WebSocket pour remplacer SSE (bidirectionnel)
- [ ] Multi-langues (i18n)
- [ ] Analytics et métriques avancées
- [ ] Mode spectateur
