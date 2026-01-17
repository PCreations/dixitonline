# Arbre Source Annoté - Tixid Online

## Structure Racine

```
dixitonline/
├── src/                          # Code source principal
├── acceptance/                   # Tests d'acceptance multi-canaux
├── drizzle/                     # Migrations SQL générées
├── patches/                     # Patches npm (babel plugin)
├── _bmad/                       # Configuration BMAD Method
├── _bmad-output/                # Artefacts générés BMAD
├── docs/                        # Documentation additionnelle
├── .claude/                     # Configuration Claude Code (skills)
│
├── package.json                 # Configuration npm/pnpm
├── tsconfig.json                # Configuration TypeScript
├── tsconfig.build.json          # Config build production
├── vitest.config.ts             # Config tests unitaires
├── vitest.config.int.ts         # Config tests intégration
├── playwright.config.ts         # Config tests E2E
├── drizzle.config.ts            # Config Drizzle ORM
├── tailwind.config.ts           # Config TailwindCSS
├── biome.json                   # Config linter Biome
│
├── CLAUDE.md                    # Guide développement Claude
├── README.md                    # README projet
└── WARP.md                      # Notes développement
```

## Source Principal (`src/`)

### Module Game - Coeur Métier

```
src/game/
│
├── # ═══════════════════════════════════════════════════════════
├── # DOMAIN ENTITIES (Aggregates)
├── # ═══════════════════════════════════════════════════════════
│
├── game.entity.ts              # [~900 lignes] Aggregate root Game
│   │                           # State machine: NotStarted → Started → Ended
│   │                           # Mutations: join(), leave(), start()
│   │                           # Returns: EntityWithEvents<Entity, Event>
│   │                           # Branded types: GameId, PlayerId
│   └── exports: GameEntity, NotStartedGameEntity, StartedGameEntity,
│                EndedGameEntity, GameId, MAX_PLAYERS (6), MIN_PLAYERS (3)
│
├── turn.entity.ts              # [~557 lignes] Turn aggregate
│   │                           # Phases: storytelling → selecting → voting → scoring
│   │                           # Methods: submitClue(), selectCard(), voteOnCard()
│   │                           # Scoring: computeTurnScores()
│   └── exports: TurnEntity, TurnPhase, TurnSnapshot
│
├── deck.entity.ts              # [~108 lignes] Deck value object
│   │                           # Cards, shuffle strategies
│   └── exports: DeckEntity, Card, CardId, DeckId, DeckShuffleStrategy
│
├── player.entity.ts            # [~70 lignes] Player value object
│   │                           # Username, anonymous flag
│   └── exports: PlayerEntity, PlayerId
│
├── game-events.ts              # Domain events (Data.TaggedEnum)
│   │                           # PlayerJoined, GameStarted, ClueSubmitted, etc.
│   └── exports: GameEvent, GameEvent$match
│
├── game-rules.ts               # Scoring logic Dixit
│   │                           # EveryoneFound, NoOneFound, AtLeastOneFound
│   └── exports: ScoreReason, computeScores
│
├── game-snapshot.schema.ts     # Effect.Schema pour validation DB
│   └── exports: GameSnapshotSchema, NotStartedGameSnapshotSchema, etc.
│
├── # ═══════════════════════════════════════════════════════════
├── # USE CASES (Commands - Write Side)
├── # ═══════════════════════════════════════════════════════════
│
├── create-game.usecase.ts      # Créer une nouvelle partie
│   │                           # Input: gameId, hostId, deckId?, endCondition?
│   │                           # Output: Either<Right<success>, Left<error>>
│   └── exports: CreateGameUseCase, CreateGameCommand
│
├── join-game.usecase.ts        # Rejoindre une partie existante
│   │                           # Input: gameId, playerId
│   │                           # Validates: game exists, not full, not started
│   └── exports: JoinGameUseCase
│
├── leave-game.usecase.ts       # Quitter une partie
│   │                           # Host leaving → game cancelled
│   └── exports: LeaveGameUseCase
│
├── start-game.usecase.ts       # Démarrer la partie
│   │                           # Validates: host only, min players
│   │                           # Uses: saveWithEvents (outbox pattern)
│   └── exports: StartGameUseCase, StartGameCommand
│
├── submit-clue.usecase.ts      # Storyteller soumet indice + carte
│   │                           # Phase: storytelling → selecting-cards
│   └── exports: SubmitClueUseCase
│
├── select-card.usecase.ts      # Joueurs sélectionnent leur carte
│   │                           # Phase: selecting-cards → voting (when all selected)
│   └── exports: SelectCardUseCase
│
├── vote-on-card.usecase.ts     # Joueurs votent sur les cartes
│   │                           # Phase: voting → scoring (when all voted)
│   └── exports: VoteOnCardUseCase
│
├── notify-ready-for-next-turn.usecase.ts  # Joueur prêt pour tour suivant
│   │                           # After scoring phase
│   └── exports: NotifyReadyForNextTurnUseCase
│
├── optimistic-retry.ts         # Retry logic pour concurrency
│   └── exports: withOptimisticRetry
│
├── # ═══════════════════════════════════════════════════════════
├── # QUERY SERVICES (Read Side)
├── # ═══════════════════════════════════════════════════════════
│
├── lobby.query-service.ts      # Query service pour état lobby
│   │                           # Returns: LobbyState (players, canStart, actions)
│   └── exports: LobbyQueryService, LobbyState, LobbyPlayer
│
├── game-view-projector.ts      # Projection game → views par joueur
│   │                           # Per-player views (hidden information)
│   └── exports: GameViewProjector, ShufflerService, TurnBoardCardsShuffler
│
├── game-view.ts                # View storage port
│   └── exports: GameView, InMemoryGameView
│
├── # ═══════════════════════════════════════════════════════════
├── # PORTS (Abstract Interfaces)
├── # ═══════════════════════════════════════════════════════════
│
├── game.repository.ts          # Repository port + InMemory impl
│   │                           # Methods: save, saveWithEvents, findById, etc.
│   │                           # Errors: OptimisticConcurrencyError, DatabaseError
│   └── exports: GameRepository, InMemoryGameRepository, makeInMemoryGameRepository
│
├── deck.repository.ts          # Deck repository port
│   └── exports: DeckRepository, InMemoryDeckRepository
│
├── game-event-bus.ts           # Event bus pour PubSub local
│   │                           # publish(), subscribe()
│   └── exports: GameEventBus, InMemoryGameEventBus, NoopGameEventBus
│
├── # ═══════════════════════════════════════════════════════════
├── # LAYER COMPOSITION
├── # ═══════════════════════════════════════════════════════════
│
├── index.ts                    # Layer composition & exports
│   │                           # GameLayerLive, GameLayerWithoutDependencies
│   └── exports: All use cases + layers
│
├── # ═══════════════════════════════════════════════════════════
├── # INFRASTRUCTURE (Driven Adapters)
├── # ═══════════════════════════════════════════════════════════
│
├── infra/
│   └── drizzle/
│       ├── drizzle-game.repository.ts   # PostgreSQL implementation
│       │                                 # Uses Drizzle ORM + optimistic locking
│       └── game-snapshot.schema.test.ts # Schema validation tests
│
├── # ═══════════════════════════════════════════════════════════
├── # TESTS
├── # ═══════════════════════════════════════════════════════════
│
└── tests/
    ├── game.driver.ts          # GameDriver DSL (Given/When/Then)
    │                           # makeGameDriverTestLayer()
    │                           # makeGameDriverDrizzleLayer()
    ├── game-driver.interface.ts # Interface GameDriverDSL
    ├── game.builder.ts         # GameBuilder pour scénarios complexes
    ├── score-computation.test.ts
    └── deterministic-shuffler.test.ts
```

### Module Player

```
src/player/
├── player.entity.ts            # Entity avec username, anonymous
├── player.repository.ts        # Port + InMemory + Drizzle impls
├── ensure-player-exists.usecase.ts  # Create player if not exists
├── index.ts                    # Layer composition
└── tests/
    ├── player.driver.ts        # Test DSL
    ├── player.entity.test.ts
    └── ensure-player-exists.usecase.test.ts
```

### Module Auth

```
src/auth/
├── auth.hook.ts               # Fastify hook for auth
├── auth.service.ts            # CurrentUser context
├── jwt.middleware.ts          # JWT verification (jose)
└── index.ts                   # Exports publics
```

### Infrastructure

```
src/infra/
│
├── db/
│   ├── schema.ts              # Drizzle table definitions
│   │                          # gamesTable, playersTable, outboxEventsTable
│   └── database.service.ts    # Database service (connection pool)
│
├── outbox/
│   ├── outbox.repository.ts       # Outbox port + Drizzle impl
│   ├── outbox-event-relay.ts      # Supabase Realtime listener
│   │                              # Subscribes to INSERT on outbox_events
│   ├── outbox-polling-daemon.ts   # Fallback polling for missed events
│   ├── index.ts
│   └── tests/
│       ├── outbox.driver.ts
│       ├── outbox-polling-daemon.test.ts
│       └── outbox-e2e.int.test.ts
│
├── supabase/
│   └── supabase-client.service.ts  # Supabase client service
│
└── observability/
    ├── tracing.ts             # OpenTelemetry + Sentry setup
    └── index.ts
```

### HTTP Layer

```
src/http/
│
├── plugins/
│   ├── app-runtime.plugin.ts  # ManagedRuntime decorator
│   ├── render.plugin.ts       # renderHtmlPage, renderToString decorators
│   └── index.ts
│
├── routes/
│   ├── home.routes.ts         # GET / → Home page
│   ├── auth.routes.ts         # /api/auth/* → Auth endpoints
│   ├── game-create.routes.ts  # POST /game/create
│   ├── game-lobby.routes.ts   # GET /game/:id/lobby, /join
│   ├── game-play.routes.ts    # GET /game → Game board
│   ├── game-events.routes.ts  # GET /game/:id/events (SSE)
│   ├── test.routes.ts         # /api/test/* → Test utilities
│   └── index.ts
│
└── types.ts                   # Fastify type augmentations
```

### View Layer

```
src/view/
│
├── render.tsx                 # SSR utilities
│   │                          # renderHtmlPage(), renderToString()
│   └── exports: renderHtmlPage, renderToString
│
├── components/
│   ├── # Layout components
│   ├── Logo.tsx               # Tixid logo SVG
│   ├── Menu.tsx               # Navigation menu
│   ├── Button.tsx             # Button variants
│   │
│   ├── # Background/decorative
│   ├── Stars.tsx              # Animated stars background
│   ├── Star.tsx               # Single star
│   ├── Moon.tsx               # Moon decoration
│   ├── Dune.tsx               # Sand dune decoration
│   ├── SandSteps.tsx          # Footsteps decoration
│   │
│   ├── # Auth components
│   ├── Login.tsx              # Login page
│   ├── LoginForm.tsx          # Login form
│   ├── AuthProvider.tsx       # Auth context (Alpine.js)
│   ├── AuthCallback.tsx       # OAuth callback handling
│   │
│   ├── # Game components
│   ├── Home.tsx               # Home page
│   ├── CreateGame.tsx         # Create game form
│   ├── Lobby.tsx              # Lobby page (SSE container)
│   ├── LobbyContent.tsx       # Lobby content (HTMX swappable)
│   ├── Game.tsx               # Game board
│   ├── Card.tsx               # Card front display
│   └── CardBack.tsx           # Card back design
│
├── view-models/
│   └── lobby.view-model.ts    # Pure function: LobbyState → LobbyViewModel
│
└── assets/
    └── styles/
        ├── main.css           # TailwindCSS source
        └── main.build.css     # Generated CSS (git-ignored)
```

### Server Entry Point

```
src/server.ts                  # Application bootstrap
│                              # - Sentry initialization
│                              # - Layer composition
│                              # - ManagedRuntime creation
│                              # - OutboxEventRelay start
│                              # - OutboxPollingDaemon start
│                              # - Fastify plugins registration
│                              # - Auth hook registration
│                              # - Route registration
│                              # - Server start (port 3010)
```

## Tests d'Acceptance

```
acceptance/
│
├── channels/
│   ├── in-memory/             # Tests avec repos in-memory
│   │   └── *.test.ts
│   │
│   ├── drizzle/               # Tests avec PostgreSQL (Testcontainers)
│   │   ├── *.int.test.ts
│   │   └── acceptance-test.setup.ts  # DB setup/cleanup
│   │
│   └── playwright/            # Tests E2E browser
│       └── *.spec.ts
│
└── shared/
    └── tests/
        └── setup/
            └── test-db.ts     # Test database utilities
```

## Claude Skills

```
.claude/skills/
├── creating-effect-usecase/   # Pattern pour nouveaux use cases
├── repository-pattern/        # Pattern repository avec validation
├── effect-dependencies/       # Règles DI (abstractions only)
├── implementing-feature/      # DDD + hexagonal workflow
├── four-layer-testing/        # Strategy de tests multi-canaux
├── writing-game-tests/        # GameDriver DSL
├── rich-entities/             # Entities avec logique métier
├── domain-events/             # TaggedEnum events
├── sse-htmx/                  # SSE + HTMX patterns
└── adding-htmx-route/         # Thin controllers + view models
```

## Fichiers de Configuration

| Fichier | Description |
|---------|-------------|
| `package.json` | Dependencies, scripts, pnpm config |
| `tsconfig.json` | TypeScript config (strict, ESM) |
| `biome.json` | Linter + formatter rules |
| `vitest.config.ts` | Unit test config |
| `vitest.config.int.ts` | Integration test config (Testcontainers) |
| `playwright.config.ts` | E2E browser test config |
| `drizzle.config.ts` | ORM config (push to local) |
| `tailwind.config.ts` | CSS framework config |
