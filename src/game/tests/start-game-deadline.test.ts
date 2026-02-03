import { describe, expect, it } from '@effect/vitest';
import { Effect, Layer } from 'effect';
import { makeTestClock } from '../clock.service.js';
import { Card, CardId, DeckEntity, DeckId } from '../deck.entity.js';
import { DeckRepository, InMemoryDeckRepository } from '../deck.repository.js';
import {
  NotStartedGameEntity,
  PlayersRandomizeStrategy,
} from '../game.entity.js';
import { GameRepository, InMemoryGameRepository } from '../game.repository.js';
import { NoopGameEventBus } from '../game-event-bus.js';
import { InMemoryGameView } from '../game-view.js';
import {
  GameViewProjector,
  ShufflerService,
  TurnBoardCardsShuffler,
} from '../game-view-projector.js';
import { PlayerId } from '../player.entity.js';
import { StartGameUseCase } from '../start-game.usecase.js';
import { TURN_TIMER_CONFIG } from '../turn-timer.config.js';

const createTestDeck = () => {
  const cards = Array.from({ length: 30 }, (_, i) =>
    Card.create({
      id: CardId(`card-${i + 1}`),
      url: `https://example.com/card-${i + 1}`,
    }),
  ) as [Card, ...Card[]];

  return DeckEntity.createDefault({
    id: DeckId('test-deck'),
    cards,
  });
};

const createNotStartedGame = (
  hostId: PlayerId,
  players: ReadonlyArray<PlayerId>,
) => {
  return NotStartedGameEntity.fromSnapshot({
    id: 'test-game',
    createdBy: hostId as string,
    deckId: 'test-deck',
    endCondition: { type: 'NumberOfTimesBeingStoryteller', numberOfTimes: 3 },
    players: players.map((p) => p as string),
    version: 1,
  });
};

const makeTestLayer = () => {
  const testClock = makeTestClock(new Date('2024-01-01T12:00:00Z'));

  const baseDependencies = Layer.mergeAll(
    InMemoryGameRepository,
    InMemoryDeckRepository,
    InMemoryGameView,
    Layer.succeed(PlayersRandomizeStrategy, {
      type: 'noop',
      randomize: (players) => players,
    }),
    TurnBoardCardsShuffler.Default,
    GameViewProjector.Default,
    ShufflerService.Default,
    NoopGameEventBus,
    testClock.layer,
  );

  return Layer.merge(
    StartGameUseCase.DefaultWithoutDependencies,
    baseDependencies,
  ).pipe(Layer.provide(baseDependencies));
};

describe('StartGameUseCase with deadline initialization', () => {
  it.effect('sets storyteller deadline to now + 30 seconds on game start', () =>
    Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      const deckRepository = yield* DeckRepository;

      const alice = PlayerId('alice');
      const bob = PlayerId('bob');
      const charlie = PlayerId('charlie');

      const deck = createTestDeck();
      yield* deckRepository.save(deck);

      const game = createNotStartedGame(alice, [alice, bob, charlie]);
      yield* gameRepository.save(game);

      const startGameUseCase = yield* StartGameUseCase;
      yield* startGameUseCase.startGame({
        gameId: 'test-game',
        playerId: 'alice',
      });

      const startedGame =
        yield* gameRepository.findStartedGameById('test-game');
      expect(startedGame._tag).toBe('Some');

      if (startedGame._tag === 'Some') {
        const snapshot = startedGame.value.toSnapshot();
        const storytellerId = snapshot.currentTurn.currentStorytellerId;
        const deadline = snapshot.currentTurn.playerDeadlines.get(
          PlayerId(storytellerId),
        );

        const expectedDeadline = new Date(
          new Date('2024-01-01T12:00:00Z').getTime() +
            TURN_TIMER_CONFIG.playerActionTimeoutMs,
        );

        expect(deadline).toBeDefined();
        expect(deadline?.getTime()).toBe(expectedDeadline.getTime());
      }
    }).pipe(Effect.provide(makeTestLayer())),
  );

  it.effect('only storyteller has a deadline after game start', () =>
    Effect.gen(function* () {
      const gameRepository = yield* GameRepository;
      const deckRepository = yield* DeckRepository;

      const alice = PlayerId('alice');
      const bob = PlayerId('bob');
      const charlie = PlayerId('charlie');

      const deck = createTestDeck();
      yield* deckRepository.save(deck);

      const game = createNotStartedGame(alice, [alice, bob, charlie]);
      yield* gameRepository.save(game);

      const startGameUseCase = yield* StartGameUseCase;
      yield* startGameUseCase.startGame({
        gameId: 'test-game',
        playerId: 'alice',
      });

      const startedGame =
        yield* gameRepository.findStartedGameById('test-game');
      expect(startedGame._tag).toBe('Some');

      if (startedGame._tag === 'Some') {
        const snapshot = startedGame.value.toSnapshot();
        const deadlines = snapshot.currentTurn.playerDeadlines;

        // Only storyteller should have a deadline
        expect(deadlines.size).toBe(1);
        expect(
          deadlines.has(PlayerId(snapshot.currentTurn.currentStorytellerId)),
        ).toBe(true);
        expect(deadlines.has(bob)).toBe(false);
        expect(deadlines.has(charlie)).toBe(false);
      }
    }).pipe(Effect.provide(makeTestLayer())),
  );
});
