# Tixid Online - Guide de développement pour Claude

## Vue d'ensemble du projet

**Tixid Online** est une implémentation en ligne du jeu de société **Dixit**, permettant à 3-6 joueurs de jouer ensemble via une application web.

### Technologies principales
- **Backend**: Fastify 5.5 (serveur HTTP)
- **Templating**: Preact JSX + preact-render-to-string (SSR uniquement, pas d'hydratation)
- **Interactivité frontend**: Alpine.js + HTMX
- **Base de données**: PostgreSQL + Drizzle ORM
- **Paradigme**: Programmation fonctionnelle avec Effect
- **Style**: TailwindCSS 4.1
- **Tests**: Vitest avec @effect/vitest
- **Linting**: Biome

### Architecture
Le projet suit une **architecture hexagonale** (ports & adapters) avec séparation stricte des couches :

```
View Layer (Preact JSX SSR + Alpine.js + HTMX)
    ↓
HTTP Layer (Fastify routes)
    ↓
Use Cases (logique métier)
    ↓
Domain Entities (Game, Turn, Deck, Player)
    ↓
Repository Pattern (interfaces)
    ↓
Infrastructure (Drizzle PostgreSQL, In-Memory pour tests)
```

### Philosophie Frontend
- **SSR-first** : Le HTML est généré côté serveur avec Preact JSX
- **HTMX** : Gère les requêtes AJAX et le remplacement partiel du DOM
- **Alpine.js** : Gère l'état local et les interactions UI légères
- **Pas de build JS client** : Pas de bundler, Alpine.js et HTMX sont chargés via CDN

## Structure du projet

```
src/
├── server.ts                    # Point d'entrée Fastify avec routes HTTP
├── game/                        # Module métier du jeu Dixit
│   ├── *.usecase.ts            # Use cases (CreateGame, JoinGame, StartGame, etc.)
│   ├── *.entity.ts             # Entités du domaine (Game, Turn, Deck, Player)
│   ├── *.repository.ts         # Interfaces de repositories
│   ├── game-rules.ts           # Implémentation des règles Dixit
│   ├── game-view-projector.ts  # Projection des vues pour clients
│   ├── index.ts                # Exports des layers Effect
│   ├── infra/drizzle/          # Implémentation PostgreSQL
│   └── tests/                  # Suite de tests complète
├── infra/
│   ├── db/schema.ts            # Schéma Drizzle PostgreSQL
│   └── drizzle/                # Migrations générées
└── view/                       # Frontend (SSR + HTMX + Alpine.js)
    ├── components/             # Composants Preact JSX
    ├── pages/                  # Pages complètes
    ├── render.tsx              # Utilitaires SSR (preact-render-to-string)
    └── assets/styles/          # TailwindCSS
```

## Principes de conception

### 1. Domain-Driven Design
- Les **entités** contiennent la logique métier (pas d'entités anémiques)
- Les **use cases** orchestrent les opérations métier
- Le **domaine** est découplé de l'infrastructure

### 2. Immutabilité stricte
- Utiliser `ReadonlyArray<T>` au lieu de `T[]`
- Utiliser `readonly` pour les propriétés d'objets
- Pas de mutations directes, toujours créer de nouveaux objets

```typescript
// ✅ BON
const newPlayers: ReadonlyArray<Player> = [...game.players, newPlayer];

// ❌ MAUVAIS
game.players.push(newPlayer);
```

### 3. Type-safety avec branded types
- Utiliser des **branded types** pour les IDs

```typescript
export type GameId = string & { readonly _tag: "GameId" };
export type PlayerId = string & { readonly _tag: "PlayerId" };

export const GameId = (id: string): GameId => id as GameId;
```

### 4. Effect-driven development
Toutes les opérations utilisent le type `Effect<Success, Error, Requirements>` :

```typescript
Effect.gen(function* () {
  const gameRepository = yield* GameRepository;
  const game = yield* gameRepository.load(gameId);
  // ...
});
```

## Patterns Effect importants

### 1. Définir un Service

```typescript
export class CreateGameUseCase extends Effect.Service<CreateGameUseCase>()(
  "CreateGameUseCase",
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      const deckRepository = yield* DeckRepository;

      return {
        execute: (input: CreateGameInput) =>
          Effect.gen(function* () {
            // logique métier
          }),
      };
    }),
    dependencies: [GameRepository.Default, DeckRepository.Default],
  },
) {}
```

### 2. Gestion d'erreurs

Utiliser `Effect.fail()` pour les erreurs métier :

```typescript
if (game.players.length >= 6) {
  return yield* Effect.fail(new GameIsFull({ gameId }));
}
```

Définir des classes d'erreur avec `Data.TaggedError` :

```typescript
export class GameNotFound extends Data.TaggedError("GameNotFound")<{
  readonly gameId: GameId;
}> {}
```

### 3. Layers et dépendances

Chaque use case expose deux layers :
- `Default` : Layer complet avec toutes les dépendances
- `DefaultWithoutDependencies` : Use case seul (pour composition)

```typescript
export const GameLayerLive = Layer.mergeAll(
  CreateGameUseCase.Default,
  JoinGameUseCase.Default,
  StartGameUseCase.Default,
  // ...
);
```

### 4. Repository Pattern

Les repositories suivent ce pattern :

```typescript
export class GameRepository extends Context.Tag("GameRepository")<
  GameRepository,
  {
    readonly save: (game: GameEntity) => Effect.Effect<void, SaveGameError>;
    readonly load: (gameId: GameId) => Effect.Effect<GameEntity, LoadGameError>;
  }
>() {}
```

Implémentation avec optimistic locking :

```typescript
save: (game) =>
  Effect.gen(function* () {
    const result = yield* db
      .update(gamesTable)
      .set({
        data: encode(game),
        version: game.version + 1
      })
      .where(
        and(
          eq(gamesTable.id, game.id),
          eq(gamesTable.version, game.version)
        )
      );

    if (result.rowCount === 0) {
      return yield* Effect.fail(new OptimisticLockError({ gameId: game.id }));
    }
  }),
```

## Patterns Frontend (HTMX + Alpine.js)

### 1. HTMX pour les interactions serveur

HTMX permet de faire des requêtes AJAX et de remplacer des parties du DOM sans JavaScript custom :

```tsx
// Composant JSX avec attributs HTMX
const JoinGameButton = ({ gameId }: { gameId: string }) => (
  <button
    hx-post={`/game/${gameId}/join`}
    hx-target="#players-list"
    hx-swap="innerHTML"
    class="btn-primary"
  >
    Rejoindre la partie
  </button>
);
```

Patterns HTMX courants :
- `hx-get` / `hx-post` : Requêtes HTTP
- `hx-target` : Élément à mettre à jour (sélecteur CSS)
- `hx-swap` : Mode de remplacement (`innerHTML`, `outerHTML`, `beforeend`, etc.)
- `hx-trigger` : Événement déclencheur (`click`, `submit`, `load`, etc.)
- `hx-indicator` : Élément à afficher pendant le chargement

### 2. Alpine.js pour l'état local

Alpine.js gère l'interactivité côté client sans requête serveur :

```tsx
// Composant avec état Alpine.js
const CardSelector = ({ cards }: { cards: Card[] }) => (
  <div x-data="{ selectedCard: null }">
    {cards.map((card) => (
      <div
        x-on:click={`selectedCard = '${card.id}'`}
        x-bind:class={`selectedCard === '${card.id}' ? 'ring-2 ring-blue-500' : ''`}
        class="card"
      >
        <img src={card.imageUrl} alt={card.id} />
      </div>
    ))}
    <button
      x-bind:disabled="!selectedCard"
      x-on:click="$refs.form.submit()"
    >
      Confirmer
    </button>
  </div>
);
```

Directives Alpine.js courantes :
- `x-data` : Définit l'état local du composant
- `x-on:event` ou `@event` : Gestionnaire d'événement
- `x-bind:attr` ou `:attr` : Liaison d'attribut dynamique
- `x-show` / `x-if` : Affichage conditionnel
- `x-for` : Boucle (rarement nécessaire avec SSR)
- `$refs` : Références aux éléments DOM

### 3. Combinaison HTMX + Alpine.js

```tsx
const VoteForm = ({ cards, gameId }: { cards: Card[]; gameId: string }) => (
  <form
    x-data="{ selectedCard: null }"
    hx-post={`/game/${gameId}/vote`}
    hx-target="#game-board"
  >
    <div class="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <label
          x-bind:class={`selectedCard === '${card.id}' ? 'ring-2' : ''`}
        >
          <input
            type="radio"
            name="cardId"
            value={card.id}
            x-model="selectedCard"
            class="sr-only"
          />
          <img src={card.imageUrl} />
        </label>
      ))}
    </div>
    <button type="submit" x-bind:disabled="!selectedCard">
      Voter
    </button>
  </form>
);
```

### 4. Routes HTMX (fragments HTML)

Les routes HTMX retournent des fragments HTML, pas des pages complètes :

```typescript
// Route retournant un fragment pour mise à jour partielle
server.post("/game/:gameId/join", async (request, reply) => {
  // ... logique métier ...

  // Retourne uniquement le fragment HTML nécessaire
  reply.type("text/html");
  return renderToString(<PlayersList players={updatedPlayers} />);
});
```

## Entités du domaine

### GameEntity (Machine à états)

```typescript
type GameEntity =
  | NotStartedGameEntity   // Partie créée, en attente
  | StartedGameEntity      // Partie en cours
  | EndedGameEntity;       // Partie terminée

type NotStartedGameEntity = {
  readonly _tag: "NotStartedGame";
  readonly id: GameId;
  readonly hostId: PlayerId;
  readonly players: ReadonlyArray<PlayerId>;
  readonly deckId: DeckId;
  readonly endCondition: EndCondition;
  readonly version: number;
};

type StartedGameEntity = {
  readonly _tag: "StartedGame";
  // ... (includes turns, scores, hands)
};
```

### TurnEntity (Phases du tour)

```typescript
type TurnPhase =
  | "storytelling"      // Storyteller donne indice
  | "selecting-cards"   // Joueurs sélectionnent cartes
  | "voting"           // Joueurs votent
  | "scoring";         // Calcul des points

type TurnEntity = {
  readonly storytellerId: PlayerId;
  readonly phase: TurnPhase;
  readonly clue?: string;
  readonly selectedCards: ReadonlyMap<PlayerId, Card>;
  readonly votes: ReadonlyMap<PlayerId, Card>;
  readonly scores?: ReadonlyArray<Score>;
};
```

## Conventions de code

### 1. Nommage
- **Fichiers** : `kebab-case.ts` (ex: `create-game.usecase.ts`)
- **Types** : `PascalCase` (ex: `GameEntity`, `PlayerId`)
- **Variables/fonctions** : `camelCase` (ex: `gameRepository`, `createGame`)
- **Constantes** : `SCREAMING_SNAKE_CASE` si vraiment constantes, sinon `camelCase`

### 2. Organisation des imports

```typescript
// 1. Imports externes
import { Effect, Layer, Context } from "effect";

// 2. Imports internes (domaine)
import { GameEntity } from "./game.entity.js";
import { GameRepository } from "./game.repository.js";

// 3. Imports de types
import type { GameId } from "./game.entity.js";
```

### 3. Exports

Toujours utiliser des **named exports** (pas de default exports) :

```typescript
// ✅ BON
export class CreateGameUseCase { }
export type GameEntity = { };

// ❌ MAUVAIS
export default class CreateGameUseCase { }
```

### 4. Extensions de fichiers

Toujours inclure `.js` dans les imports (pour ESM) :

```typescript
import { GameEntity } from "./game.entity.js";
```

## Testing

### 1. Structure des tests

Les tests utilisent le pattern **Given/When/Then** avec `GameDriver` :

```typescript
it.effect("should create a game with default deck", () =>
  Effect.gen(function* () {
    const gameDriver = yield* GameDriver;

    // GIVEN
    yield* gameDriver.given.existingDeck({
      id: DeckId("default-deck"),
      cards: [/* ... */],
    });

    // WHEN
    yield* gameDriver.when.creatingGame({
      gameId: GameId("game-1"),
      hostId: PlayerId("player-1"),
    });

    // THEN
    yield* gameDriver.assert.gameViewToEqual({
      gameId: GameId("game-1"),
      expectedView: {
        _tag: "NotStartedGame",
        hostId: PlayerId("player-1"),
        players: [PlayerId("player-1")],
        // ...
      },
    });
  })
);
```

### 2. GameBuilder et GameDriver

- **GameBuilder** : Construit des scénarios de jeu complexes
- **GameDriver** : Interface fluide pour tests

```typescript
// Créer un scénario avec 4 joueurs au tour 2
const builder = yield* GameBuilder;
yield* builder.withPlayers(4).atTurn(2);
```

### 3. Tests d'intégration

Les fichiers `*.int.test.ts` testent avec une vraie base PostgreSQL (Testcontainers) :

```bash
pnpm test:int
```

## Commandes importantes

```bash
# Développement
pnpm dev              # Watch mode avec hot reload
pnpm build            # Compile TypeScript + génère CSS

# Tests
pnpm test             # Tests unitaires (watch)
pnpm test:int         # Tests d'intégration avec PostgreSQL
pnpm coverage         # Rapport de couverture

# Code quality
pnpm check            # Type-checking TypeScript
pnpm lint             # Vérification Biome
pnpm lint-fix         # Auto-fix avec Biome

# Base de données
pnpm db:generate      # Générer migrations Drizzle
pnpm db:migrate       # Appliquer migrations

# Build
pnpm clean            # Nettoyer dist/
pnpm css:build        # Compiler TailwindCSS
```

## Ajouter une nouvelle fonctionnalité

### 1. Créer un Use Case

```typescript
// src/game/my-feature.usecase.ts
export class MyFeatureUseCase extends Effect.Service<MyFeatureUseCase>()(
  "MyFeatureUseCase",
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;

      return {
        execute: (input: MyFeatureInput) =>
          Effect.gen(function* () {
            // 1. Charger les entités
            const game = yield* gameRepository.load(input.gameId);

            // 2. Vérifier les règles métier
            if (someCondition) {
              return yield* Effect.fail(new SomeError());
            }

            // 3. Appliquer les changements
            const updatedGame = { ...game, /* modifications */ };

            // 4. Sauvegarder
            yield* gameRepository.save(updatedGame);

            // 5. Retourner le résultat
            return { success: true };
          }),
      };
    }),
    dependencies: [GameRepository.Default],
  },
) {}
```

### 2. Ajouter au Layer principal

```typescript
// src/game/index.ts
export const GameLayerLive = Layer.mergeAll(
  // ... autres use cases
  MyFeatureUseCase.Default,
);
```

### 3. Créer une route HTTP

```typescript
// src/server.ts
server.post(
  "/game/my-feature",
  async (request, reply) => {
    const { gameId } = request.body;

    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(GameLayerLive),
        Effect.catchAll((error) => /* gestion erreur */),
      )
    );

    return result;
  }
);
```

### 4. Écrire les tests

```typescript
// src/game/tests/my-feature.test.ts
describe("MyFeature", () => {
  it.effect("should do something", () =>
    Effect.gen(function* () {
      const gameDriver = yield* GameDriver;

      yield* gameDriver.given.existingGame({ /* ... */ });
      yield* gameDriver.when.doingMyFeature({ /* ... */ });
      yield* gameDriver.assert.gameViewToEqual({ /* ... */ });
    })
  );
});
```

## Règles métier importantes

### 1. Règles du jeu Dixit

- **3 joueurs** : 7 cartes en main, max 2 cartes sélectionnées
- **4-6 joueurs** : 6 cartes en main, max 1 carte sélectionnée
- **Storyteller** : Rotation dans l'ordre d'arrivée
- **Fin de partie** : Nombre de tours ou score limite

### 2. Scoring

Voir [game-rules.ts](src/game/game-rules.ts:L157-L202) pour la logique complète.

Points attribués selon :
- `EveryoneFoundTheStorytellerCard` → 0 points storyteller
- `NoOneFoundTheStorytellerCard` → 0 points storyteller, +2 pour autres
- `AtLeastOnePlayerFoundTheStorytellerCard` → Points normaux
- `YouFoundTheStorytellerCard` → +3 points
- `APlayerVotedOnYourCard` → +1 point par vote

### 3. Gestion de la concurrence

Le système utilise **optimistic locking** avec numéro de version :
- Chaque entité a un `version: number`
- Lors de la sauvegarde, le `WHERE` clause vérifie la version
- Si version différente → `OptimisticLockError`
- Le client doit retry avec la version à jour

## Conventions de commit

### Messages de commit
- Utiliser le format **Conventional Commits** : `type(scope): description`
- Types courants : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- Garder les messages concis et descriptifs

### Règles strictes sur l'attribution
- **Ne JAMAIS mentionner Claude** dans les commits (messages, footers, trailers)
- **Ne JAMAIS ajouter Claude comme co-author** (pas de `Co-authored-by: Claude`)
- **Ne JAMAIS utiliser de footer** comme "Generated with Claude Code", "AI-assisted", etc.
- Les commits doivent apparaître comme écrits par le développeur uniquement

```bash
# ✅ BON
git commit -m "feat(lobby): add real-time updates with SSE"

# ❌ MAUVAIS - footer Claude
git commit -m "feat: add SSE

🤖 Generated with Claude Code"

# ❌ MAUVAIS - co-author
git commit -m "feat: add SSE

Co-authored-by: Claude <claude@anthropic.com>"
```

## Pièges à éviter

### ❌ Ne pas muter les entités

```typescript
// MAUVAIS
game.players.push(newPlayer);

// BON
const updatedGame = {
  ...game,
  players: [...game.players, newPlayer],
};
```

### ❌ Ne pas oublier les `.js` dans les imports

```typescript
// MAUVAIS
import { Game } from "./game.entity";

// BON
import { Game } from "./game.entity.js";
```

### ❌ Ne pas utiliser `any` ou `as unknown`

Toujours typer correctement avec Effect :

```typescript
// MAUVAIS
const result: any = await something();

// BON
const result = yield* Effect.gen(function* () {
  return yield* something();
});
```

### ❌ Ne pas créer de nouvelles implémentations sans interface

Toujours définir une interface (Tag) avant l'implémentation :

```typescript
// 1. Interface
export class MyService extends Context.Tag("MyService")<
  MyService,
  { readonly doSomething: () => Effect.Effect<void> }
>() {}

// 2. Implémentation
export const MyServiceLive = Layer.succeed(MyService, {
  doSomething: () => Effect.succeed(undefined),
});
```

## Ressources

- [Effect Documentation](https://effect.website/docs/introduction)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Fastify](https://fastify.dev/)
- [Preact](https://preactjs.com/)
- [HTMX Documentation](https://htmx.org/docs/)
- [Alpine.js Documentation](https://alpinejs.dev/)

## Points d'extension futurs

- [ ] Authentification (module `auth/` prêt)
- [ ] Server-Sent Events (SSE) pour notifications temps réel
- [ ] Event Sourcing pour replay
- [ ] Analytics et métriques
- [ ] Support multi-langues (i18n)

---

**Note** : Ce projet privilégie la **clarté**, la **type-safety** et la **testabilité**. Toujours préférer l'immutabilité, la composition fonctionnelle et les types explicites.


## MCP Server

Lorsque tu dois utiliser un MCP regarde s'il y a des règles précises pour son utilisation dans le dossier .claude.