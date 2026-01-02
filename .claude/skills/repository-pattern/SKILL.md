---
name: repository-pattern
description: Defines repository pattern for persistence with save (upsert with optimistic concurrency) and query methods (find*, is*, count*). Use when creating or modifying repositories.
---

# Repository Pattern

## Principe

Les repositories ont une API minimaliste et cohérente :

1. **Une seule méthode d'écriture** : `save` (fait toujours un upsert)
2. **Méthodes de lecture** : `find*`, `is*`, `count*`

## Structure d'un Repository

```typescript
import { Context, Data, Effect, Layer, Option } from "effect";

// Erreur pour optimistic concurrency
export class OptimisticConcurrencyError extends Data.TaggedError(
  "OptimisticConcurrencyError",
)<{ readonly entityId: string }> {}

// Interface du repository
export class MyRepository extends Effect.Tag("domain/MyRepository")<
  MyRepository,
  {
    // === ÉCRITURE ===
    // Une seule méthode : save (fait toujours upsert)
    // Peut échouer avec OptimisticConcurrencyError si version conflict
    readonly save: (entity: MyEntity) => Effect.Effect<void, OptimisticConcurrencyError>;

    // === LECTURE ===
    // find* : retourne Option<Entity>
    readonly findById: (id: MyId) => Effect.Effect<Option.Option<MyEntity>>;
    readonly findByEmail: (email: string) => Effect.Effect<Option.Option<MyEntity>>;

    // is* : retourne boolean
    readonly isEmailTaken: (email: string) => Effect.Effect<boolean>;

    // count* : retourne number
    readonly countByStatus: (status: Status) => Effect.Effect<number>;
  }
>() {}
```

## Règles

### 1. `save` fait toujours un upsert

```typescript
save: (entity) => {
  // INSERT ... ON CONFLICT DO UPDATE
  // Vérifie la version pour optimistic concurrency
}
```

Pas de méthode `create`, `update`, `insert`, `upsert` séparées.

### 2. Optimistic Concurrency avec version

Si l'entité a un champ `version`, le repository doit :
- Incrémenter la version à chaque save
- Vérifier que la version en DB correspond avant mise à jour
- Échouer avec `OptimisticConcurrencyError` si conflit

```typescript
// Dans l'implémentation Drizzle
save: (entity) => Effect.gen(function* () {
  const snapshot = entity.toSnapshot();

  const result = yield* Effect.promise(() =>
    db.insert(table)
      .values({ ...snapshot, version: snapshot.version + 1 })
      .onConflictDoUpdate({
        target: table.id,
        set: { ...snapshot, version: snapshot.version + 1 },
        where: eq(table.version, snapshot.version), // Optimistic lock
      })
  );

  if (result.rowCount === 0) {
    return yield* Effect.fail(new OptimisticConcurrencyError({ entityId: snapshot.id }));
  }
}),
```

### 3. Méthodes de lecture typées

```typescript
// find* → Option<Entity>
findById: (id) => Effect.succeed(Option.fromNullable(store.get(id)));

// is* → boolean
isEmailTaken: (email) => Effect.succeed(emailIndex.has(email));

// count* → number
countByStatus: (status) => Effect.succeed(
  [...store.values()].filter(e => e.status === status).length
);
```

### 4. Pas de logique métier dans le repository

Le repository est purement CRUD. La logique métier reste dans les entités et use cases.

```typescript
// ❌ MAUVAIS - logique métier dans le repo
findActiveGamesForPlayer: (playerId) => {
  const games = store.values();
  return games.filter(g => g.isActive() && g.hasPlayer(playerId));
}

// ✅ BON - query simple, filtrage dans le use case
findByPlayerId: (playerId) => Effect.succeed(
  Option.fromNullable([...store.values()].find(g => g.hasPlayer(playerId)))
);
```

## Implémentation InMemory

```typescript
const makeInMemoryMyRepository = (): Context.Tag.Service<MyRepository> => {
  const store = new Map<string, MyEntity>();

  return {
    save: (entity) => {
      const snapshot = entity.toSnapshot();
      const existing = store.get(snapshot.id);

      // Vérification optimistic concurrency si version existe
      if (existing && snapshot.version !== undefined) {
        const existingSnapshot = existing.toSnapshot();
        if (existingSnapshot.version !== snapshot.version - 1) {
          return Effect.fail(new OptimisticConcurrencyError({ entityId: snapshot.id }));
        }
      }

      store.set(snapshot.id, entity);
      return Effect.succeed(void 0);
    },

    findById: (id) =>
      Effect.succeed(Option.fromNullable(store.get(id))),
  };
};

export const InMemoryMyRepository = Layer.sync(
  MyRepository,
  makeInMemoryMyRepository,
);
```

## Implémentation Drizzle

```typescript
export const makeDrizzleMyRepository = ({
  db,
}: {
  db: NodePgDatabase<Record<string, never>>;
}): Context.Tag.Service<MyRepository> => {
  return {
    save: (entity) => Effect.gen(function* () {
      const snapshot = entity.toSnapshot();

      yield* Effect.promise(() =>
        db.insert(myTable)
          .values(snapshot)
          .onConflictDoUpdate({
            target: myTable.id,
            set: {
              ...snapshot,
              updatedAt: new Date(),
            },
          })
      );
    }),

    findById: (id) => Effect.gen(function* () {
      const result = yield* Effect.promise(() =>
        db.select().from(myTable).where(eq(myTable.id, id)).limit(1)
      );

      if (result.length === 0) {
        return Option.none();
      }

      return Option.some(MyEntity.fromSnapshot(result[0]));
    }),
  };
};

export const DrizzleMyRepository = Layer.effect(
  MyRepository,
  Effect.gen(function* () {
    const { db } = yield* Database;
    return makeDrizzleMyRepository({ db });
  }),
);
```

## Exemples

- [GameRepository](src/game/game.repository.ts) - `save`, `findById`, `findNotStartedGameById`, `isPlayerInGame`
- [PlayerRepository](src/player/player.repository.ts) - `save`, `findById`
- [DeckRepository](src/game/deck.repository.ts) - `save`, `findById`

## Anti-patterns

```typescript
// ❌ Plusieurs méthodes d'écriture
interface BadRepository {
  create: (entity) => Effect<void>;
  update: (entity) => Effect<void>;
  upsert: (entity) => Effect<void>;
  save: (entity) => Effect<void>;
}

// ❌ Méthodes avec logique métier
interface BadRepository {
  findActiveGamesWithEnoughPlayers: () => Effect<Game[]>;
  updatePlayerScore: (playerId, points) => Effect<void>;
}

// ❌ Retourner l'entité après save
interface BadRepository {
  save: (entity) => Effect<Entity>; // Retourne void, pas l'entité
}
```

## Checklist

1. [ ] Une seule méthode `save` (upsert)
2. [ ] Méthodes de lecture nommées `find*`, `is*`, `count*`
3. [ ] `save` retourne `Effect<void, OptimisticConcurrencyError>`
4. [ ] `find*` retourne `Effect<Option<Entity>>`
5. [ ] Pas de logique métier dans le repository
6. [ ] Implémentation InMemory pour tests
7. [ ] Implémentation Drizzle pour production
