import { Effect, Match, Option } from 'effect';
import { DeckId } from './deck.entity.js';
import { DeckRepository, InMemoryDeckRepository } from './deck.repository.js';
import {
  createLimitOfPointsEndCondition,
  createNumberOfTimesBeingStorytellerEndCondition,
  EndCondition,
  GameId,
  NotStartedGameEntity,
} from './game.entity.js';
import { GameRepository, InMemoryGameRepository } from './game.repository.js';
import { PlayerId } from './player.entity.js';

type EndConditionDto =
  | {
      type: 'NumberOfTimesBeingStoryteller';
      numberOfTimes: Option.Option<number>;
    }
  | {
      type: 'LimitOfPoints';
      limit: number;
    };

export type CreateGameCommand = {
  gameId: string;
  hostId: string;
  deckId: Option.Option<string>;
  endCondition: Option.Option<EndConditionDto>;
};

const endConditionDtoToDomain = (
  endCondition: EndConditionDto,
): EndCondition => {
  return Match.value(endCondition).pipe(
    Match.withReturnType<EndCondition>(),
    Match.when({ type: 'NumberOfTimesBeingStoryteller' }, (endCondition) =>
      createNumberOfTimesBeingStorytellerEndCondition({
        numberOfTimes: endCondition.numberOfTimes,
      }),
    ),
    Match.when({ type: 'LimitOfPoints' }, (endCondition) =>
      createLimitOfPointsEndCondition({
        limit: endCondition.limit,
      }),
    ),
    Match.exhaustive,
  );
};

export class CreateGameUseCase extends Effect.Service<CreateGameUseCase>()(
  'game/CreateGameUseCase',
  {
    effect: Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      const deckRepository = yield* DeckRepository;

      return {
        createGame: (props: CreateGameCommand) =>
          Effect.gen(function* () {
            yield* Effect.annotateCurrentSpan('context.input', JSON.stringify(props));

            const defaultDeckId = yield* deckRepository.getDefaultDeckId();

            const endCondition = Option.match(props.endCondition, {
              onNone: () =>
                createNumberOfTimesBeingStorytellerEndCondition({
                  numberOfTimes: Option.none(),
                }),
              onSome: (endCondition) => {
                return endConditionDtoToDomain(endCondition);
              },
            });

            const game = NotStartedGameEntity.create({
              id: GameId(props.gameId),
              createdBy: PlayerId(props.hostId),
              deckId: DeckId(
                Option.getOrElse(props.deckId, () =>
                  Option.getOrThrow(defaultDeckId),
                ),
              ),
              endCondition,
            });

            const result = yield* Effect.either(gameRepository.save(game));

            yield* Effect.annotateCurrentSpan('context.output', JSON.stringify({
              snapshot: game.toSnapshot(),
              result: result._tag,
            }));

            return yield* Effect.succeed(result);
          }).pipe(Effect.withSpan('CreateGameUseCase.createGame')),
      };
    }),
    dependencies: [InMemoryGameRepository, InMemoryDeckRepository],
  },
) {}
