# Documentation Projet - Tixid Online

> **Généré le** : 2026-01-17
> **Méthode** : BMAD Method - Document Project (Exhaustive Scan)
> **Version** : 2.0.0

## Vue d'ensemble

**Tixid Online** est une implémentation web du jeu de société Dixit, permettant à 3-6 joueurs de jouer ensemble en temps réel.

| Attribut | Valeur |
|----------|--------|
| **Type** | Application Web Full-Stack |
| **Architecture** | Hexagonale (Ports & Adapters) + DDD |
| **Paradigme** | Functional Programming (Effect) |
| **Stack** | Node.js, Fastify, Effect, Drizzle, Preact SSR, HTMX, Alpine.js |
| **Base de données** | PostgreSQL (Supabase) |
| **Tests** | Vitest + Playwright (4-layer strategy) |

## Documentation Technique

### Architecture

| Document | Description |
|----------|-------------|
| [Architecture](architecture.md) | Vue d'ensemble de l'architecture technique, patterns, flux de données |
| [Source Tree](source-tree.md) | Arbre source annoté avec description de chaque module |
| [Data Models](data-models.md) | Modèles de données, entities, schemas, domain events |
| [API Reference](api-reference.md) | Documentation des endpoints HTTP, HTMX, SSE |

### Développement

| Document | Description |
|----------|-------------|
| [Development Guide](development-guide.md) | Guide de démarrage, commandes, patterns Effect, debugging |

### Documentation Existante

| Document | Description |
|----------|-------------|
| [CLAUDE.md](../../CLAUDE.md) | Guide complet pour le développement avec Claude |
| [README.md](../../README.md) | README du projet |

## Skills Claude Code

Le projet inclut des skills Claude Code pour guider le développement :

| Skill | Description |
|-------|-------------|
| `creating-effect-usecase` | Pattern pour créer des use cases Effect |
| `repository-pattern` | Pattern repository avec validation Schema |
| `effect-dependencies` | Règles d'injection de dépendances (DIP) |
| `implementing-feature` | Workflow DDD + hexagonal |
| `four-layer-testing` | Stratégie de tests multi-canaux |
| `writing-game-tests` | DSL GameDriver pour tests |
| `rich-entities` | Entities avec logique métier |
| `domain-events` | Events avec TaggedEnum |
| `sse-htmx` | Patterns SSE + HTMX |
| `adding-htmx-route` | Thin controllers + view models |

## Stack Technologique

### Backend

| Technologie | Version | Rôle |
|-------------|---------|------|
| Node.js | 22+ | Runtime |
| Fastify | 5.5 | Framework HTTP |
| Effect | 3.19 | FP, DI, Error handling |
| Drizzle | 0.44 | ORM type-safe |
| PostgreSQL | 15+ | Base de données |
| jose | 6.1 | JWT validation |

### Frontend (SSR)

| Technologie | Version | Rôle |
|-------------|---------|------|
| Preact | 10.27 | JSX templating |
| HTMX | 2.x | Partial updates |
| Alpine.js | 3.x | Local state |
| TailwindCSS | 4.1 | Styling |

### Infrastructure

| Technologie | Rôle |
|-------------|------|
| Supabase | Auth, Storage, Realtime |
| Sentry | Error tracking |
| OpenTelemetry | Tracing |

### Tests

| Technologie | Rôle |
|-------------|------|
| Vitest | Unit & Integration tests |
| Playwright | E2E browser tests |
| Testcontainers | PostgreSQL pour tests |

## Patterns Clés

### 1. Effect Service Pattern

```typescript
export class MyUseCase extends Effect.Service<MyUseCase>()(
  'game/MyUseCase',
  {
    effect: Effect.gen(function* () {
      const repo = yield* Repository;  // Depend on abstraction
      return { execute: (cmd) => ... };
    }),
  },
) {}
```

### 2. EntityWithEvents

```typescript
const { entity, events } = yield* game.start({ ... });
yield* repository.saveWithEvents(entity, events);
```

### 3. Transactional Outbox

```
Use Case → Save Game + Events (atomic) → Supabase Realtime → SSE
```

### 4. GameDriver DSL

```typescript
yield* driver.given.existingNonStartedGame({ ... });
yield* driver.when.joiningGame({ ... });
yield* driver.assert.playerToHaveJoinedGame({ ... });
```

## Commandes Rapides

```bash
# Développement
pnpm dev                        # Server + CSS watch

# Tests
pnpm test                       # Unit tests
pnpm test:acceptance:drizzle    # Integration tests
pnpm playwright test            # E2E tests

# Build
pnpm build                      # Production build
pnpm check                      # Type checking
pnpm lint                       # Linting
```

## Prochaines Étapes BMAD

Ce document fait partie du workflow **Document Project** de la méthode BMAD.

Les prochaines étapes recommandées sont :

1. **PRD** (Product Requirements Document)
   - Définir les fonctionnalités manquantes
   - Prioriser les user stories

2. **Architecture Review**
   - Valider les décisions architecturales
   - Identifier les améliorations

3. **Epics & Stories**
   - Créer les epics depuis le PRD
   - Détailler les user stories

4. **Sprint Planning**
   - Organiser les sprints
   - Estimer les efforts

## Liens Utiles

- [Repository GitHub](https://github.com/PCreations/dixitonline)
- [Effect Documentation](https://effect.website/docs/introduction)
- [Drizzle ORM](https://orm.drizzle.team/)
- [HTMX](https://htmx.org/docs/)
- [Alpine.js](https://alpinejs.dev/)
