import { Effect, Layer, Option } from "effect";

export class GameRepository extends Effect.Tag("game/GameRepository")<GameRepository, {
  save: (props: { id: string, createdBy: string }) => Effect.Effect<void>
  findById: (id: string) => Effect.Effect<Option.Option<{ id: string, createdBy: string }>>
}>() {}

export const InMemoryGameRepository = Layer.effect(GameRepository, Effect.gen(function* () {
  const games = new Map<string, { id: string, createdBy: string }>()

  return {
    save: (props: { id: string, createdBy: string }) => Effect.gen(function* () {
      games.set(props.id, props)

      yield* Effect.succeed(void 0)
    }),
    findById: (id: string) => Effect.succeed(Option.fromNullable(games.get(id)))
  }
}))

export class CreateGameUseCase extends Effect.Service<CreateGameUseCase>()('game/CreateGameUseCase', {
  effect: Effect.gen(function* () {
    const gameRepository = yield* GameRepository

    return {
      createGame: (props: { gameId: string, playerId: string }) => Effect.gen(function* () {
        yield* gameRepository.save({
          id: props.gameId,
          createdBy: props.playerId
        })
      })
    }
  }),
  dependencies: [InMemoryGameRepository]
}) {}