import { describe, expect, it } from '@effect/vitest';
import { Effect, type Layer, Option } from 'effect';
import { GameQueryService } from '../../../game.query-service.js';
import { GameBuilder } from '../../game.builder.js';
import { GameDriver, type GameDriverLayer } from '../../game.driver.js';
import { defaultIdFactory, type IdFactory } from './create-game.test-suite.js';

// Extended layer type that includes GameQueryService
type GameQueryServiceTestLayer = Layer.Layer<
  Layer.Layer.Success<GameDriverLayer> | GameQueryService,
  Layer.Layer.Error<GameDriverLayer>,
  Layer.Layer.Context<GameDriverLayer>
>;

export const gameQueryServiceTestSuite = (
  makeTestLayer: () => GameQueryServiceTestLayer,
  idFactory: IdFactory = defaultIdFactory,
) => {
  const { gameId, playerId } = idFactory;

  describe('GameQueryService', () => {
    describe('Phase projections', () => {
      it.effect(
        'returns StorytellingAsStoryteller for storyteller in storytelling phase',
        () => {
          return Effect.gen(function* () {
            const gameDriver = yield* GameDriver;
            yield* gameDriver.given.existingGame(
              gameDriver,
              new GameBuilder(gameId(1))
                .hostedBy(playerId(1))
                .withDeckCards({
                  deckId: 'id-deck-1',
                  cards: generateCards(32),
                })
                .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
                .started(),
            );

            const gameQueryService = yield* GameQueryService;
            const view = yield* gameQueryService.getGameState(
              gameId(1),
              playerId(1),
            );

            expect(Option.isSome(view)).toBe(true);
            const gameView = Option.getOrThrow(view);
            expect(gameView._tag).toBe('StorytellingAsStoryteller');

            if (gameView._tag === 'StorytellingAsStoryteller') {
              expect(gameView.storyteller.id).toBe(playerId(1));
              expect(gameView.storyteller.isCurrentPlayer).toBe(true);
              expect(gameView.currentPlayer.id).toBe(playerId(1));
              expect(gameView.action.type).toBe('submit-clue');
              expect(gameView.action.disabled).toBe(false);
            }
          }).pipe(Effect.provide(makeTestLayer()));
        },
      );

      it.effect(
        'returns StorytellingAsGuesser for non-storyteller in storytelling phase',
        () => {
          return Effect.gen(function* () {
            const gameDriver = yield* GameDriver;
            yield* gameDriver.given.existingGame(
              gameDriver,
              new GameBuilder(gameId(1))
                .hostedBy(playerId(1))
                .withDeckCards({
                  deckId: 'id-deck-1',
                  cards: generateCards(32),
                })
                .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
                .started(),
            );

            const gameQueryService = yield* GameQueryService;
            const view = yield* gameQueryService.getGameState(
              gameId(1),
              playerId(2),
            );

            expect(Option.isSome(view)).toBe(true);
            const gameView = Option.getOrThrow(view);
            expect(gameView._tag).toBe('StorytellingAsGuesser');

            if (gameView._tag === 'StorytellingAsGuesser') {
              expect(gameView.storyteller.id).toBe(playerId(1));
              expect(gameView.storyteller.isCurrentPlayer).toBe(false);
              expect(gameView.currentPlayer.id).toBe(playerId(2));
            }
          }).pipe(Effect.provide(makeTestLayer()));
        },
      );

      it.effect(
        'returns SelectingCardsAsStoryteller for storyteller in selecting-cards phase',
        () => {
          return Effect.gen(function* () {
            const gameDriver = yield* GameDriver;
            yield* gameDriver.given.existingGame(
              gameDriver,
              new GameBuilder(gameId(1))
                .hostedBy(playerId(1))
                .withDeckCards({
                  deckId: 'id-deck-1',
                  cards: generateCards(32),
                })
                .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
                .started()
                .withSubmittedClueOnCardIndex('My clue', 0),
            );

            const gameQueryService = yield* GameQueryService;
            const view = yield* gameQueryService.getGameState(
              gameId(1),
              playerId(1),
            );

            expect(Option.isSome(view)).toBe(true);
            const gameView = Option.getOrThrow(view);
            expect(gameView._tag).toBe('SelectingCardsAsStoryteller');

            if (gameView._tag === 'SelectingCardsAsStoryteller') {
              expect(gameView.clue).toBe('My clue');
            }
          }).pipe(Effect.provide(makeTestLayer()));
        },
      );

      it.effect(
        'returns SelectingCardsAsGuesser for guesser in selecting-cards phase',
        () => {
          return Effect.gen(function* () {
            const gameDriver = yield* GameDriver;
            yield* gameDriver.given.existingGame(
              gameDriver,
              new GameBuilder(gameId(1))
                .hostedBy(playerId(1))
                .withDeckCards({
                  deckId: 'id-deck-1',
                  cards: generateCards(32),
                })
                .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
                .started()
                .withSubmittedClueOnCardIndex('My clue', 0),
            );

            const gameQueryService = yield* GameQueryService;
            const view = yield* gameQueryService.getGameState(
              gameId(1),
              playerId(2),
            );

            expect(Option.isSome(view)).toBe(true);
            const gameView = Option.getOrThrow(view);
            expect(gameView._tag).toBe('SelectingCardsAsGuesser');

            if (gameView._tag === 'SelectingCardsAsGuesser') {
              expect(gameView.clue).toBe('My clue');
              expect(gameView.hasSelectedCard).toBe(false);
              expect(gameView.action.type).toBe('select-card');
              expect(gameView.action.disabled).toBe(false);
            }
          }).pipe(Effect.provide(makeTestLayer()));
        },
      );

      it.effect(
        'returns SelectingCardsAsGuesser with hasSelectedCard=true when player has selected',
        () => {
          return Effect.gen(function* () {
            const gameDriver = yield* GameDriver;
            yield* gameDriver.given.existingGame(
              gameDriver,
              new GameBuilder(gameId(1))
                .hostedBy(playerId(1))
                .withDeckCards({
                  deckId: 'id-deck-1',
                  cards: generateCards(32),
                })
                .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
                .started()
                .withSubmittedClueOnCardIndex('My clue', 0)
                .withSelectedCards([{ playerId: playerId(2), cardIndex: 0 }]),
            );

            const gameQueryService = yield* GameQueryService;
            const view = yield* gameQueryService.getGameState(
              gameId(1),
              playerId(2),
            );

            expect(Option.isSome(view)).toBe(true);
            const gameView = Option.getOrThrow(view);
            expect(gameView._tag).toBe('SelectingCardsAsGuesser');

            if (gameView._tag === 'SelectingCardsAsGuesser') {
              expect(gameView.hasSelectedCard).toBe(true);
              expect(gameView.action.disabled).toBe(true);
            }
          }).pipe(Effect.provide(makeTestLayer()));
        },
      );

      it.effect(
        'returns VotingAsStoryteller for storyteller in voting phase',
        () => {
          return Effect.gen(function* () {
            const gameDriver = yield* GameDriver;
            yield* gameDriver.given.existingGame(
              gameDriver,
              new GameBuilder(gameId(1))
                .hostedBy(playerId(1))
                .withDeckCards({
                  deckId: 'id-deck-1',
                  cards: generateCards(32),
                })
                .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
                .started()
                .withSubmittedClueOnCardIndex('My clue', 0)
                .withSelectedCards([
                  { playerId: playerId(2), cardIndex: 0 },
                  { playerId: playerId(3), cardIndex: 0 },
                  { playerId: playerId(4), cardIndex: 0 },
                ]),
            );

            const gameQueryService = yield* GameQueryService;
            const view = yield* gameQueryService.getGameState(
              gameId(1),
              playerId(1),
            );

            expect(Option.isSome(view)).toBe(true);
            const gameView = Option.getOrThrow(view);
            expect(gameView._tag).toBe('VotingAsStoryteller');

            if (gameView._tag === 'VotingAsStoryteller') {
              expect(gameView.clue).toBe('My clue');
              expect(gameView.boardCards.length).toBe(4);
            }
          }).pipe(Effect.provide(makeTestLayer()));
        },
      );

      it.effect('returns VotingAsGuesser for guesser in voting phase', () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;
          yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withDeckCards({
                deckId: 'id-deck-1',
                cards: generateCards(32),
              })
              .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
              .started()
              .withSubmittedClueOnCardIndex('My clue', 0)
              .withSelectedCards([
                { playerId: playerId(2), cardIndex: 0 },
                { playerId: playerId(3), cardIndex: 0 },
                { playerId: playerId(4), cardIndex: 0 },
              ]),
          );

          const gameQueryService = yield* GameQueryService;
          const view = yield* gameQueryService.getGameState(
            gameId(1),
            playerId(2),
          );

          expect(Option.isSome(view)).toBe(true);
          const gameView = Option.getOrThrow(view);
          expect(gameView._tag).toBe('VotingAsGuesser');

          if (gameView._tag === 'VotingAsGuesser') {
            expect(gameView.clue).toBe('My clue');
            expect(gameView.hasVoted).toBe(false);
            expect(gameView.action.type).toBe('vote');
            expect(gameView.action.disabled).toBe(false);
            expect(gameView.boardCards.length).toBe(4);
          }
        }).pipe(Effect.provide(makeTestLayer()));
      });

      it.effect(
        'returns VotingAsGuesser with hasVoted=true when player has voted',
        () => {
          return Effect.gen(function* () {
            const gameDriver = yield* GameDriver;
            yield* gameDriver.given.existingGame(
              gameDriver,
              new GameBuilder(gameId(1))
                .hostedBy(playerId(1))
                .withDeckCards({
                  deckId: 'id-deck-1',
                  cards: generateCards(32),
                })
                .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
                .started()
                .withSubmittedClueOnCardIndex('My clue', 0)
                .withSelectedCards([
                  { playerId: playerId(2), cardIndex: 0 },
                  { playerId: playerId(3), cardIndex: 0 },
                  { playerId: playerId(4), cardIndex: 0 },
                ])
                .withVotedCards([
                  { playerId: playerId(2), cardSelectedByPlayer: playerId(1) },
                ]),
            );

            const gameQueryService = yield* GameQueryService;
            const view = yield* gameQueryService.getGameState(
              gameId(1),
              playerId(2),
            );

            expect(Option.isSome(view)).toBe(true);
            const gameView = Option.getOrThrow(view);
            expect(gameView._tag).toBe('VotingAsGuesser');

            if (gameView._tag === 'VotingAsGuesser') {
              expect(gameView.hasVoted).toBe(true);
              expect(gameView.action.disabled).toBe(true);
            }
          }).pipe(Effect.provide(makeTestLayer()));
        },
      );

      it.effect('returns Scoring view in scoring phase', () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;
          yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withDeckCards({
                deckId: 'id-deck-1',
                cards: generateCards(32),
              })
              .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
              .started()
              .withSubmittedClueOnCardIndex('My clue', 0)
              .withSelectedCards([
                { playerId: playerId(2), cardIndex: 0 },
                { playerId: playerId(3), cardIndex: 0 },
                { playerId: playerId(4), cardIndex: 0 },
              ])
              .withVotedCards([
                { playerId: playerId(2), cardSelectedByPlayer: playerId(1) },
                { playerId: playerId(3), cardSelectedByPlayer: playerId(2) },
                { playerId: playerId(4), cardSelectedByPlayer: playerId(1) },
              ])
              .withScores([
                { playerId: playerId(1), score: 0 },
                { playerId: playerId(2), score: 0 },
                { playerId: playerId(3), score: 0 },
                { playerId: playerId(4), score: 0 },
              ]),
          );

          const gameQueryService = yield* GameQueryService;
          const view = yield* gameQueryService.getGameState(
            gameId(1),
            playerId(1),
          );

          expect(Option.isSome(view)).toBe(true);
          const gameView = Option.getOrThrow(view);
          expect(gameView._tag).toBe('Scoring');

          if (gameView._tag === 'Scoring') {
            expect(gameView.clue).toBe('My clue');
            expect(gameView.storytellerCardId).toBe('card-1');
            expect(gameView.boardCards.length).toBe(4);
            expect(gameView.votes).toBeDefined();
            expect(gameView.pointsEarned).toBeDefined();
            expect(gameView.action.type).toBe('ready-for-next-turn');
          }
        }).pipe(Effect.provide(makeTestLayer()));
      });

      it.effect('returns Ended view when game is ended', () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;
          yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withEndCondition({
                type: 'LimitOfPoints',
                limit: 10,
              })
              .withDeckCards({
                deckId: 'id-deck-1',
                cards: generateCards(32),
              })
              .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
              .withScores([
                { playerId: playerId(1), score: 10 },
                { playerId: playerId(2), score: 3 },
                { playerId: playerId(3), score: 5 },
                { playerId: playerId(4), score: 7 },
              ])
              .inScoringPhaseSince(new Date())
              .withPlayersReadyForNextTurn([
                playerId(1),
                playerId(2),
                playerId(3),
                playerId(4),
              ]),
          );

          const gameQueryService = yield* GameQueryService;
          const view = yield* gameQueryService.getGameState(
            gameId(1),
            playerId(1),
          );

          expect(Option.isSome(view)).toBe(true);
          const gameView = Option.getOrThrow(view);
          expect(gameView._tag).toBe('Ended');

          if (gameView._tag === 'Ended') {
            expect(gameView.rankings.length).toBe(4);
            expect(gameView.rankings[0].player.id).toBe(playerId(1));
            expect(gameView.rankings[0].score).toBe(10);
            expect(gameView.rankings[0].rank).toBe(1);
            expect(gameView.action.type).toBe('back-to-home');
          }
        }).pipe(Effect.provide(makeTestLayer()));
      });
    });

    describe('Player name resolution', () => {
      it.effect('uses player id as fallback when player not found', () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;
          yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withDeckCards({
                deckId: 'id-deck-1',
                cards: generateCards(32),
              })
              .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
              .started(),
          );

          const gameQueryService = yield* GameQueryService;
          const view = yield* gameQueryService.getGameState(
            gameId(1),
            playerId(1),
          );

          expect(Option.isSome(view)).toBe(true);
          const gameView = Option.getOrThrow(view);

          // Without players in PlayerRepository, names default to "Joueur inconnu"
          if (gameView._tag !== 'Ended') {
            expect(gameView.currentPlayer.name).toBe('Joueur inconnu');
            expect(gameView.storyteller.name).toBe('Joueur inconnu');
          }
        }).pipe(Effect.provide(makeTestLayer()));
      });
    });

    describe('Not started game handling', () => {
      it.effect('returns None for not started game', () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;
          yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withDeckCards({
                deckId: 'id-deck-1',
                cards: generateCards(32),
              })
              .withPlayers(playerId(1), playerId(2), playerId(3)),
          );

          const gameQueryService = yield* GameQueryService;
          const view = yield* gameQueryService.getGameState(
            gameId(1),
            playerId(1),
          );

          expect(Option.isNone(view)).toBe(true);
        }).pipe(Effect.provide(makeTestLayer()));
      });
    });

    describe('Non-existent game handling', () => {
      it.effect('returns None for non-existent game', () => {
        return Effect.gen(function* () {
          const gameQueryService = yield* GameQueryService;
          const view = yield* gameQueryService.getGameState(
            'non-existent-game',
            playerId(1),
          );

          expect(Option.isNone(view)).toBe(true);
        }).pipe(Effect.provide(makeTestLayer()));
      });
    });

    describe('Player status tracking', () => {
      it.effect(
        'shows correct player statuses during selecting-cards phase',
        () => {
          return Effect.gen(function* () {
            const gameDriver = yield* GameDriver;
            yield* gameDriver.given.existingGame(
              gameDriver,
              new GameBuilder(gameId(1))
                .hostedBy(playerId(1))
                .withDeckCards({
                  deckId: 'id-deck-1',
                  cards: generateCards(32),
                })
                .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
                .started()
                .withSubmittedClueOnCardIndex('My clue', 0)
                .withSelectedCards([
                  { playerId: playerId(2), cardIndex: 0 },
                  // player 3 and 4 haven't selected yet
                ]),
            );

            const gameQueryService = yield* GameQueryService;
            const view = yield* gameQueryService.getGameState(
              gameId(1),
              playerId(2),
            );

            expect(Option.isSome(view)).toBe(true);
            const gameView = Option.getOrThrow(view);

            if (gameView._tag !== 'Ended') {
              const statuses = gameView.playersStatus;
              const storytellerStatus = statuses.find(
                (s) => s.player.id === playerId(1),
              );
              const player2Status = statuses.find(
                (s) => s.player.id === playerId(2),
              );
              const player3Status = statuses.find(
                (s) => s.player.id === playerId(3),
              );
              const player4Status = statuses.find(
                (s) => s.player.id === playerId(4),
              );

              expect(storytellerStatus?.status).toBe('ready');
              expect(player2Status?.status).toBe('ready');
              expect(player3Status?.status).toBe('not-ready');
              expect(player4Status?.status).toBe('not-ready');
            }
          }).pipe(Effect.provide(makeTestLayer()));
        },
      );
    });
  });
};

// Helper to generate card IDs
function generateCards(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `card-${i + 1}`);
}
