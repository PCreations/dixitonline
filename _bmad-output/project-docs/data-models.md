# Modèles de Données - Tixid Online

## Vue d'ensemble

Le système utilise une approche hybride :
- **Domain Entities** : Objets riches avec logique métier (Effect pattern)
- **Snapshots** : Sérialisation pour persistance (JSONB)
- **Drizzle Schema** : Définition des tables PostgreSQL
- **Effect.Schema** : Validation bidirectionnelle (encode/decode)

## Domain Entities

### GameEntity (Aggregate Root)

L'entité `Game` est une **state machine** avec trois états :

```typescript
type GameEntity = NotStartedGameEntity | StartedGameEntity | EndedGameEntity;

// État initial - partie créée, en attente de joueurs
type NotStartedGameEntity = {
  readonly _tag: 'NotStartedGame';
  readonly id: GameId;                    // Branded type (UUID)
  readonly createdBy: PlayerId;           // Host de la partie
  readonly players: ReadonlyArray<PlayerId>;
  readonly deckId: DeckId;
  readonly endCondition: EndCondition;    // Condition de fin
  readonly version: number;               // Optimistic locking
  readonly startedAt: Option.Option<Date>;

  // Methods
  join(props): Effect<EntityWithEvents<NotStartedGameEntity, PlayerJoined>, Error>;
  leave(props): Effect<EntityWithEvents<NotStartedGameEntity, PlayerLeft>, Error>;
  start(props): Effect<EntityWithEvents<StartedGameEntity, GameStarted>, Error>;
  toSnapshot(): NotStartedGameSnapshot;
};

// État en cours - partie active
type StartedGameEntity = {
  readonly _tag: 'StartedGame';
  readonly id: GameId;
  readonly createdBy: PlayerId;
  readonly players: ReadonlyArray<PlayerId>;
  readonly deckId: DeckId;
  readonly endCondition: EndCondition;
  readonly version: number;
  readonly startedAt: Date;
  readonly currentTurn: TurnEntity;       // Tour en cours
  readonly scores: ReadonlyMap<PlayerId, number>;
  readonly playersHavingBeenStoryteller: ReadonlyArray<PlayerId>;
  readonly playersReadyForNextTurn: ReadonlyArray<PlayerId>;

  // Methods
  submitClue(props): Effect<EntityWithEvents<StartedGameEntity, ClueSubmitted>, Error>;
  selectCard(props): Effect<EntityWithEvents<StartedGameEntity, CardSelected>, Error>;
  voteOnCard(props): Effect<EntityWithEvents<StartedGameEntity, VoteSubmitted>, Error>;
  notifyReadyForNextTurn(props): Effect<...>;
  toSnapshot(): StartedGameSnapshot;
};

// État terminé
type EndedGameEntity = {
  readonly _tag: 'EndedGame';
  readonly id: GameId;
  readonly createdBy: PlayerId;
  readonly players: ReadonlyArray<PlayerId>;
  readonly finalScores: ReadonlyMap<PlayerId, number>;
  readonly winner: PlayerId;
  readonly version: number;

  toSnapshot(): EndedGameSnapshot;
};
```

### TurnEntity

Gère les phases d'un tour de jeu :

```typescript
type TurnPhase = 'storytelling' | 'selecting-cards' | 'voting' | 'scoring';

type TurnEntity = {
  readonly gameId: GameId;
  readonly turnNumber: number;
  readonly phase: TurnPhase;
  readonly currentStorytellerId: PlayerId;
  readonly turnClue: Option.Option<{ clue: string; cardId: CardId }>;
  readonly playerHands: ReadonlyArray<PlayerHand>;
  readonly selectedCards: ReadonlyArray<SelectedCard>;
  readonly votedCards: ReadonlyArray<VotedCard>;
  readonly pointsByPlayer: ReadonlyMap<PlayerId, ReadonlyArray<ScoreEntry>>;
  readonly cardsInDrawPile: ReadonlyArray<Card>;

  // Phase transitions
  submitClue(props): Effect<TurnEntity, Error>;
  selectCard(props): Effect<TurnEntity, Error>;
  voteOnCard(props): Effect<TurnEntity, Error>;
};

type PlayerHand = {
  readonly playerId: PlayerId;
  readonly cards: ReadonlyArray<Card>;
};

type SelectedCard = {
  readonly playerId: PlayerId;
  readonly cardId: CardId;
};

type VotedCard = {
  readonly cardId: CardId;
  readonly ownedBy: PlayerId;
  readonly votedBy: PlayerId;
};

type ScoreEntry = {
  readonly points: number;
  readonly reason: ScoreReason;
};
```

### DeckEntity

```typescript
type DeckEntity = {
  readonly id: DeckId;
  readonly isDefault: boolean;
  readonly cards: ReadonlyArray<Card>;
  readonly shuffleStrategy: DeckShuffleStrategy;

  shuffle(): DeckEntity;
  drawCards(count: number): { drawn: Card[]; remaining: DeckEntity };
  toSnapshot(): DeckSnapshot;
};

type Card = {
  readonly id: CardId;
  readonly url: string;    // URL image (Supabase Storage)
};
```

### PlayerEntity

```typescript
type PlayerEntity = {
  readonly id: PlayerId;
  readonly username: string;
  readonly email: Option.Option<string>;
  readonly isAnonymous: boolean;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  updateUsername(newUsername: string): PlayerEntity;
  linkEmail(email: string): PlayerEntity;
  toSnapshot(): PlayerSnapshot;
};
```

### EndCondition

```typescript
type EndCondition =
  | {
      type: 'NumberOfTimesBeingStoryteller';
      numberOfTimes: number;  // Default: 3
    }
  | {
      type: 'LimitOfPoints';
      limit: number;          // e.g., 30 points
    };
```

## Domain Events

Utilise `Data.TaggedEnum` d'Effect pour le pattern matching :

```typescript
import { Data } from 'effect';

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

// Constructors
export const GameEvent = Data.taggedEnum<GameEvent>();

// Pattern matching
GameEvent.$match(event, {
  PlayerJoined: ({ gameId, playerId }) => ...,
  GameStarted: ({ gameId }) => ...,
  // ...
});
```

## Schéma PostgreSQL (Drizzle)

### Table `games`

```typescript
export const gamesTable = pgTable('games', {
  id: uuid().primaryKey(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull().defaultNow(),
  status: text({
    enum: ['NotStartedGame', 'StartedGame', 'EndedGame'],
  }).notNull(),
  data: jsonb().$type<GameEntitySnapshot>().notNull(),  // Full state
  version: integer().notNull(),  // Optimistic locking
});
```

**Stratégie JSONB** : L'état complet du jeu est stocké dans la colonne `data` (JSONB).
- Avantage : Flexibilité, pas de migrations pour changements de schéma interne
- Inconvénient : Queries moins efficaces sur les champs internes

### Table `players`

```typescript
export const playersTable = pgTable('players', {
  id: uuid().primaryKey(),           // = Supabase auth.users.id
  username: text().notNull().unique(),
  email: text(),                     // nullable
  isAnonymous: boolean().notNull().default(true),
  version: integer().notNull().default(1),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});
```

### Table `outbox_events`

```typescript
export const outboxEventsTable = pgTable('outbox_events', {
  id: uuid().primaryKey().defaultRandom(),
  aggregateType: text().notNull(),       // 'game', 'player'
  aggregateId: uuid().notNull(),
  aggregateVersion: integer().notNull(),
  eventType: text().notNull(),           // 'PlayerJoined', etc.
  payload: jsonb().notNull(),            // GameEvent serialized
  createdAt: timestamp().notNull().defaultNow(),
  processedAt: timestamp(),              // null until processed
});
```

## Effect.Schema Validation

Validation des données lors de la lecture/écriture DB :

```typescript
// src/game/game-snapshot.schema.ts

export const NotStartedGameSnapshotSchema = Schema.Struct({
  status: Schema.Struct({
    _tag: Schema.Literal('NotStartedGame'),
  }),
  id: Schema.String,
  createdBy: Schema.String,
  deckId: Schema.String,
  players: Schema.Array(Schema.String),
  endCondition: EndConditionSchema,
  version: Schema.Number,
  startedAt: Schema.OptionFromNullOr(Schema.Date),
});

export const StartedGameSnapshotSchema = Schema.Struct({
  status: Schema.Struct({
    _tag: Schema.Literal('StartedGame'),
  }),
  id: Schema.String,
  createdBy: Schema.String,
  deckId: Schema.String,
  players: Schema.Array(Schema.String),
  endCondition: EndConditionSchema,
  version: Schema.Number,
  startedAt: Schema.Date,
  currentTurn: TurnSnapshotSchema,
  scores: Schema.Record({ key: Schema.String, value: Schema.Number }),
  playersHavingBeenStoryteller: Schema.Array(Schema.String),
  playersReadyForNextTurn: Schema.Array(Schema.String),
});

// Usage dans repository
findById: (id) => Effect.gen(function* () {
  const result = yield* Effect.promise(() =>
    db.select().from(gamesTable).where(eq(gamesTable.id, id)).limit(1)
  );

  if (result.length === 0) {
    return Option.none();
  }

  // Validate DB data against schema
  const snapshot = yield* Schema.decodeUnknown(GameSnapshotSchema)(result[0].data);
  return Option.some(GameEntity.fromSnapshot(snapshot));
}),
```

## Branded Types

Types nominaux pour éviter les erreurs de mélange d'IDs :

```typescript
// Types brandés
export type GameId = string & { readonly _tag: 'GameId' };
export type PlayerId = string & { readonly _tag: 'PlayerId' };
export type DeckId = string & { readonly _tag: 'DeckId' };
export type CardId = string & { readonly _tag: 'CardId' };

// Constructors
export const GameId = (id: string): GameId => id as GameId;
export const PlayerId = (id: string): PlayerId => id as PlayerId;
export const DeckId = (id: string): DeckId => id as DeckId;
export const CardId = (id: string): CardId => id as CardId;

// TypeScript empêche les erreurs :
const gameId: GameId = GameId('abc-123');
const playerId: PlayerId = PlayerId('def-456');

// ❌ Erreur de compilation
gameRepository.findById(playerId);  // Type error!

// ✅ OK
gameRepository.findById(gameId);
```

## View Models

### LobbyViewModel

Transformation pure de l'état vers la vue :

```typescript
interface LobbyState {
  readonly gameId: string;
  readonly hostId: string;
  readonly players: ReadonlyArray<LobbyPlayer>;
  readonly isHost: boolean;
  readonly canStart: boolean;
  readonly actions: ReadonlyArray<LobbyAction>;
}

interface LobbyViewModel {
  readonly gameId: string;
  readonly title: string;
  readonly statusMessage: string;      // "Prêt à démarrer!" | "En attente..."
  readonly playerCount: string;        // "4/6"
  readonly players: ReadonlyArray<LobbyPlayerViewModel>;
  readonly inviteUrl: string;
  readonly actions: ReadonlyArray<LobbyAction>;
}

interface LobbyPlayerViewModel {
  readonly name: string;
  readonly isCurrentUser: boolean;
  readonly isHost: boolean;
}

// Pure function
function createLobbyViewModel(state: LobbyState, props: { currentPlayerId: string }): LobbyViewModel;
```

## Scoring Model

```typescript
// Raisons de scoring Dixit
type ScoreReason =
  | 'EveryoneFoundTheStorytellerCard'      // 0 pts storyteller
  | 'NoOneFoundTheStorytellerCard'         // 0 pts storyteller, +2 autres
  | 'AtLeastOnePlayerFoundTheStorytellerCard'  // +3 pts storyteller
  | 'YouFoundTheStorytellerCard'           // +3 pts voteur
  | 'APlayerVotedOnYourCard';              // +1 pt par vote

// Calcul des scores
function computeTurnScores(turn: TurnEntity): Map<PlayerId, ScoreEntry[]>;
```

## Migrations

Les migrations sont générées par Drizzle Kit :

```bash
# Générer une migration
pnpm db:generate

# Appliquer les migrations
pnpm db:migrate
```

Fichiers dans `drizzle/` :

```
drizzle/
├── 0000_initial.sql           # Création tables initiales
├── 0001_add_outbox.sql        # Table outbox_events
└── meta/
    └── _journal.json          # Journal des migrations
```
