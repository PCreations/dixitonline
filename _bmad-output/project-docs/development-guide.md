# Guide de Développement - Tixid Online

## Prérequis

- **Node.js** 22+ (LTS recommandé)
- **pnpm** 10.17+ (via corepack)
- **Docker** (pour PostgreSQL via Testcontainers)
- **Supabase CLI** (optionnel, pour dev local complet)

## Installation

```bash
# Cloner le repository
git clone https://github.com/PCreations/dixitonline.git
cd dixitonline

# Activer corepack pour pnpm
corepack enable

# Installer les dépendances
pnpm install

# Copier le fichier d'environnement
cp .env.example .env
```

## Configuration

### Variables d'environnement

```bash
# .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dixitonline
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_JWT_ISSUER=http://127.0.0.1:54321/auth/v1
SENTRY_DSN=                    # Optionnel
NODE_ENV=development
```

### Supabase Local (optionnel)

```bash
# Démarrer Supabase local
supabase start

# Récupérer les clés
supabase status

# Appliquer les migrations
supabase db push
```

## Commandes Principales

### Développement

```bash
# Lancer le serveur de développement (watch mode)
pnpm dev

# Le serveur démarre sur http://localhost:3010
# Hot reload activé pour TypeScript et CSS
```

### Build

```bash
# Build complet (TypeScript + CSS)
pnpm build

# Build CSS uniquement
pnpm css:build

# Nettoyer les builds
pnpm clean
```

### Tests

```bash
# Tests unitaires (watch mode)
pnpm test

# Tests d'acceptance in-memory
pnpm test:acceptance:in-memory

# Tests d'intégration (PostgreSQL via Testcontainers)
pnpm test:acceptance:drizzle

# Tests E2E (Playwright)
pnpm test:acceptance:e2e

# Couverture de code
pnpm coverage
```

### Qualité de Code

```bash
# Type-checking
pnpm check

# Linting
pnpm lint

# Auto-fix linting
pnpm lint-fix
```

### Base de données

```bash
# Générer une migration Drizzle
pnpm db:generate

# Appliquer les migrations
pnpm db:migrate
```

## Structure d'un Use Case

### 1. Créer le fichier

```typescript
// src/game/my-feature.usecase.ts
import { Effect, Option } from 'effect';
import { GameRepository } from './game.repository.js';
import type { GameId, PlayerId } from './game.entity.js';

export type MyFeatureCommand = {
  readonly gameId: string;
  readonly playerId: string;
  // ... autres props
};

export class MyFeatureUseCase extends Effect.Service<MyFeatureUseCase>()(
  'game/MyFeatureUseCase',
  {
    effect: Effect.gen(function* () {
      // Dépendre des ABSTRACTIONS uniquement
      const gameRepository = yield* GameRepository;

      return {
        execute: (command: MyFeatureCommand) =>
          Effect.gen(function* () {
            // 1. Load aggregate
            const maybeGame = yield* gameRepository.findById(command.gameId);

            // 2. Handle Option
            const game = yield* Option.match(maybeGame, {
              onNone: () => Effect.fail(new Error('Game not found')),
              onSome: Effect.succeed,
            });

            // 3. Execute domain logic (returns entity + events)
            const { entity, events } = yield* game.myDomainMethod({
              playerId: PlayerId(command.playerId),
            });

            // 4. Save with events (transactional outbox)
            yield* gameRepository.saveWithEvents(entity, events);

            // 5. Return result
            return { success: true };
          }),
      };
    }),
    // NO dependencies - let layer composition provide them
  },
) {}
```

### 2. Ajouter au Layer

```typescript
// src/game/index.ts
export const GameLayerWithoutDependencies = Layer.mergeAll(
  // ... existing use cases
  MyFeatureUseCase.Default,
);
```

### 3. Créer la route HTTP

```typescript
// src/http/routes/my-feature.routes.ts
import { Effect } from 'effect';
import type { FastifyPluginAsync } from 'fastify';
import { MyFeatureUseCase } from '../../game/my-feature.usecase.js';

const myFeatureRoutes: FastifyPluginAsync = async (fastify) => {
  const { appRuntime } = fastify;

  fastify.post('/my-feature', async (request, reply) => {
    const { gameId } = request.body as { gameId: string };

    const program = Effect.gen(function* () {
      const { playerId } = yield* CurrentUser;
      const useCase = yield* MyFeatureUseCase;
      return yield* useCase.execute({ gameId, playerId });
    });

    return appRuntime
      .runPromise(program.pipe(Effect.provide(request.authLayer)))
      .then((result) => reply.send(result))
      .catch((error) => reply.status(500).send({ error: error.message }));
  });
};

export default myFeatureRoutes;
```

### 4. Écrire les tests

```typescript
// src/game/tests/my-feature.test.ts
import { describe, it } from '@effect/vitest';
import { Effect } from 'effect';
import { GameDriver } from './game.driver.js';
import { makeGameDriverTestLayer } from './game.driver.js';

describe('MyFeature', () => {
  it.effect(
    'should execute my feature successfully',
    () =>
      Effect.gen(function* () {
        const driver = yield* GameDriver;

        // GIVEN
        yield* driver.given.existingNonStartedGame({
          gameId: 'game-1',
          hostId: 'player-1',
          players: ['player-1', 'player-2', 'player-3'],
        });

        // WHEN
        yield* driver.when./* your action */({
          gameId: 'game-1',
          playerId: 'player-1',
        });

        // THEN
        yield* driver.assert./* your assertion */({
          gameId: 'game-1',
          // expected values
        });
      }),
    { layer: makeGameDriverTestLayer() },
  );
});
```

## Patterns Effect

### Service Definition

```typescript
// Abstract service (port)
export class MyService extends Effect.Tag('MyService')<
  MyService,
  {
    readonly doSomething: (input: Input) => Effect.Effect<Output, MyError>;
  }
>() {}

// Implementation
export const MyServiceLive = Layer.succeed(MyService, {
  doSomething: (input) =>
    Effect.gen(function* () {
      // implementation
    }),
});
```

### Error Handling

```typescript
import { Data } from 'effect';

// Define error class
export class MyError extends Data.TaggedError('MyError')<{
  readonly reason: string;
}> {}

// Use in Effect
Effect.gen(function* () {
  if (condition) {
    return yield* Effect.fail(new MyError({ reason: 'Something went wrong' }));
  }
});

// Catch errors
program.pipe(
  Effect.catchTag('MyError', (error) => {
    console.log(error.reason);
    return Effect.succeed(fallbackValue);
  }),
);
```

### Layer Composition

```typescript
// Compose layers
const AppLayer = Layer.mergeAll(
  ServiceA.Default,
  ServiceB.Default,
).pipe(
  Layer.provide(InfrastructureLayer),
);

// Run with layer
Effect.runPromise(
  program.pipe(Effect.provide(AppLayer))
);

// Or use ManagedRuntime
const runtime = ManagedRuntime.make(AppLayer);
await runtime.runPromise(program);
```

## Frontend Patterns

### Composant HTMX

```tsx
// src/view/components/MyComponent.tsx
/** @jsx h */
import { h } from 'preact';

interface Props {
  gameId: string;
  data: string;
}

export function MyComponent({ gameId, data }: Props) {
  return (
    <div
      hx-get={`/game/${gameId}/refresh`}
      hx-trigger="click"
      hx-target="#content"
      hx-swap="innerHTML"
    >
      {data}
    </div>
  );
}
```

### Composant Alpine.js

```tsx
export function InteractiveComponent() {
  return (
    <div x-data="{ selected: null }">
      <button
        x-on:click="selected = 'option1'"
        x-bind:class="selected === 'option1' ? 'active' : ''"
      >
        Option 1
      </button>
      <button
        x-on:click="selected = 'option2'"
        x-bind:class="selected === 'option2' ? 'active' : ''"
      >
        Option 2
      </button>
      <p x-show="selected">
        You selected: <span x-text="selected"></span>
      </p>
    </div>
  );
}
```

### SSE Integration

```tsx
export function RealtimeComponent({ gameId }: { gameId: string }) {
  return (
    <div hx-ext="sse" sse-connect={`/game/${gameId}/events`}>
      {/* Contenu mis à jour automatiquement */}
      <div
        id="content"
        sse-swap="update"
        hx-swap="outerHTML"
      >
        {/* Initial content */}
      </div>
    </div>
  );
}
```

## Debugging

### OpenTelemetry Tracing

Les spans sont automatiquement créés pour :
- Requêtes HTTP
- Use cases
- Repository operations

```typescript
// Ajouter des annotations manuelles
yield* Effect.annotateCurrentSpan('context.input', JSON.stringify(input));
yield* Effect.annotateCurrentSpan('context.output', JSON.stringify(output));
```

### Logging

```typescript
// Pino logger disponible via Fastify
request.log.info('Message');
request.log.error({ err: error }, 'Error message');
```

### Console Ninja (VSCode)

Le projet est configuré pour Console Ninja. Les logs apparaissent inline dans l'éditeur.

### Wallaby (Tests)

Configuration Wallaby incluse pour tests en temps réel.

## Git Workflow

### Branches

- `master` : Production
- `v2` : Développement actuel (v2)
- `feature/*` : Nouvelles fonctionnalités
- `fix/*` : Corrections de bugs

### Commits

Format Conventional Commits :

```
feat(game): add card selection logic
fix(lobby): resolve player count display
refactor(auth): simplify JWT validation
test(game): add scoring tests
docs: update API documentation
chore: upgrade dependencies
```

### PR Process

1. Créer une branche depuis `v2`
2. Implémenter la fonctionnalité avec tests
3. Vérifier : `pnpm check && pnpm lint && pnpm test`
4. Créer une PR vers `v2`
5. Review + merge

## Troubleshooting

### "Module not found"

Vérifier que les imports incluent `.js` :
```typescript
// ❌ Mauvais
import { Game } from './game.entity';

// ✅ Bon
import { Game } from './game.entity.js';
```

### "Effect.Tag not found"

S'assurer que le service est dans le layer :
```typescript
const layer = Layer.mergeAll(
  MyService.Default,  // Ajouter ici
);
```

### Tests PostgreSQL échouent

Docker doit être en cours d'exécution pour Testcontainers :
```bash
docker info  # Vérifier que Docker fonctionne
```

### CSS non mis à jour

Relancer le build CSS :
```bash
pnpm css:build
```

## Ressources

- [Effect Documentation](https://effect.website/docs/introduction)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Fastify](https://fastify.dev/)
- [HTMX](https://htmx.org/docs/)
- [Alpine.js](https://alpinejs.dev/)
- [TailwindCSS](https://tailwindcss.com/docs)
