# Rich Entities / Aggregates Pattern

## Principe

Les entités ne sont PAS anémiques (simples DTOs). Elles encapsulent la logique métier.

## Structure d'une entité riche

```typescript
export class {Name}Entity {
  // 1. Constructeur privé, props privées
  private constructor(
    private readonly props: {
      readonly id: {Name}Id;
      // ... autres props
    }
  ) {}

  // Getters : ajouter seulement quand nécessaire (YAGNI)

  // 2. Factory statique avec validation
  static create(input: CreateInput): Effect.Effect<{Name}Entity, ValidationError> {
    return Effect.gen(function* () {
      // Validation des invariants
      yield* validateInput(input);
      return new {Name}Entity({ ... });
    });
  }

  // 3. Méthodes métier qui retournent Effect<NewEntity, Error>
  doSomething(input: Input): Effect.Effect<{Name}Entity, BusinessError> {
    return Effect.gen(this, function* () {
      // Validation + logique métier
      // Retourne une NOUVELLE instance (immutabilité)
      return new {Name}Entity({ ...this.props, ... });
    });
  }

  // 4. Serialization pour persistence
  toSnapshot() { return { ...this.props }; }
  static fromSnapshot(s: Snapshot): {Name}Entity { ... }
}
```

## Règles

1. **Immutabilité** : Les méthodes retournent de nouvelles instances
2. **Validation à la création** : Factory valide les invariants
3. **Erreurs typées** : Utiliser `Data.TaggedError` pour les erreurs métier
4. **Pas de logique dans les use cases** : Le use case orchestre, l'entité décide
5. **YAGNI pour les getters** : Ajouter seulement quand nécessaire

## Anti-patterns

### Entité anémique (à éviter)

```typescript
// ❌ MAUVAIS - Juste un DTO
interface Player {
  id: string;
  username: string;
  email: string | null;
}

// Logique dans le use case
const updateUsername = (player: Player, newName: string) => {
  return { ...player, username: newName };
};
```

### Entité riche (correct)

```typescript
// ✅ BON - Logique encapsulée
class PlayerEntity {
  private constructor(private readonly props: {...}) {}

  updateUsername(newName: string): PlayerEntity {
    if (newName === this.props.username) return this;
    return new PlayerEntity({ ...this.props, username: newName });
  }
}
```

## Exemples dans le codebase

- [GameEntity](src/game/game.entity.ts) - `addPlayer()`, `start()`, `submitClue()`
- [TurnEntity](src/game/turn.entity.ts) - `selectCard()`, `voteOnCard()`
- [PlayerEntity](src/player/player.entity.ts) - `updateUsername()`, `linkEmail()`
