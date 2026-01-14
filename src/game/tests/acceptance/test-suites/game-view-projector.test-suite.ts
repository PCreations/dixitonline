import { describe, expect, it } from '@effect/vitest';
import { Effect } from 'effect';
import {
  isEndedGameSnapshot,
  isNotStartedGameSnapshot,
  type StartedGameSnapshot,
} from '../../../game.entity.js';
import {
  APlayerVotedOnYourCard,
  AtLeastOnePlayerFoundTheStorytellerCard,
  YouFoundTheStorytellerCard,
} from '../../../game-rules.js';
import { GameViewProjector } from '../../../game-view-projector.js';
import { PlayerId } from '../../../player.entity.js';
import { GameBuilder } from '../../game.builder.js';
import { GameDriver, type GameDriverLayer } from '../../game.driver.js';
import { defaultIdFactory, type IdFactory } from './create-game.test-suite.js';

export const gameViewProjectorTestSuite = (
  makeGameDriverTestLayer: () => GameDriverLayer,
  idFactory: IdFactory = defaultIdFactory,
) => {
  const { gameId, playerId } = idFactory;

  describe('Game View Projector', () => {
    it.effect('Example: storytelling phase', () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;
        const { game } = yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder(gameId(1))
            .hostedBy(playerId(1))
            .withDeckCards({
              deckId: 'id-deck-1',
              cards: [
                'card-1',
                'card-2',
                'card-3',
                'card-4',
                'card-5',
                'card-6',
                'card-7',
                'card-8',
                'card-9',
                'card-10',
                'card-11',
                'card-12',
                'card-13',
                'card-14',
                'card-15',
                'card-16',
                'card-17',
                'card-18',
                'card-19',
                'card-20',
                'card-21',
                'card-22',
                'card-23',
                'card-24',
                'card-25',
                'card-26',
                'card-27',
                'card-28',
                'card-29',
                'card-30',
                'card-31',
                'card-32',
              ],
            })
            .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
            .started(),
        );
        const gameViewProjector = yield* GameViewProjector;

        const views = yield* gameViewProjector.project(
          game as StartedGameSnapshot,
        );
        const player1view = views[playerId(1)];
        const player2view = views[playerId(2)];
        const player3view = views[playerId(3)];
        const player4view = views[playerId(4)];

        expect(player1view).toEqual({
          gameId: gameId(1),
          id: playerId(1),
          name: playerId(1),
          storyteller: playerId(1),
          phase: 'storytelling',
          playerStatus: {
            [playerId(1)]: 'not-ready',
            [playerId(2)]: 'ready',
            [playerId(3)]: 'ready',
            [playerId(4)]: 'ready',
          },
          score: 0,
          cards: [
            { id: 'card-1', url: 'https://example.com/card-1' },
            { id: 'card-2', url: 'https://example.com/card-2' },
            { id: 'card-3', url: 'https://example.com/card-3' },
            { id: 'card-4', url: 'https://example.com/card-4' },
            { id: 'card-5', url: 'https://example.com/card-5' },
            { id: 'card-6', url: 'https://example.com/card-6' },
          ],
        });
        expect(player2view).toEqual({
          gameId: gameId(1),
          id: playerId(2),
          name: playerId(2),
          storyteller: playerId(1),
          phase: 'storytelling',
          score: 0,
          playerStatus: {
            [playerId(1)]: 'not-ready',
            [playerId(2)]: 'ready',
            [playerId(3)]: 'ready',
            [playerId(4)]: 'ready',
          },
          cards: [
            { id: 'card-7', url: 'https://example.com/card-7' },
            { id: 'card-8', url: 'https://example.com/card-8' },
            { id: 'card-9', url: 'https://example.com/card-9' },
            { id: 'card-10', url: 'https://example.com/card-10' },
            { id: 'card-11', url: 'https://example.com/card-11' },
            { id: 'card-12', url: 'https://example.com/card-12' },
          ],
        });
        expect(player3view).toEqual({
          gameId: gameId(1),
          id: playerId(3),
          name: playerId(3),
          storyteller: playerId(1),
          phase: 'storytelling',
          score: 0,
          playerStatus: {
            [playerId(1)]: 'not-ready',
            [playerId(2)]: 'ready',
            [playerId(3)]: 'ready',
            [playerId(4)]: 'ready',
          },
          cards: [
            { id: 'card-13', url: 'https://example.com/card-13' },
            { id: 'card-14', url: 'https://example.com/card-14' },
            { id: 'card-15', url: 'https://example.com/card-15' },
            { id: 'card-16', url: 'https://example.com/card-16' },
            { id: 'card-17', url: 'https://example.com/card-17' },
            { id: 'card-18', url: 'https://example.com/card-18' },
          ],
        });
        expect(player4view).toEqual({
          gameId: gameId(1),
          id: playerId(4),
          name: playerId(4),
          storyteller: playerId(1),
          phase: 'storytelling',
          score: 0,
          playerStatus: {
            [playerId(1)]: 'not-ready',
            [playerId(2)]: 'ready',
            [playerId(3)]: 'ready',
            [playerId(4)]: 'ready',
          },
          cards: [
            { id: 'card-19', url: 'https://example.com/card-19' },
            { id: 'card-20', url: 'https://example.com/card-20' },
            { id: 'card-21', url: 'https://example.com/card-21' },
            { id: 'card-22', url: 'https://example.com/card-22' },
            { id: 'card-23', url: 'https://example.com/card-23' },
            { id: 'card-24', url: 'https://example.com/card-24' },
          ],
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });

    it.effect(
      'Example: selecting cards phase, more than 3 players-game',
      () => {
        return Effect.gen(function* () {
          const gameDriver = yield* GameDriver;
          const { game } = yield* gameDriver.given.existingGame(
            gameDriver,
            new GameBuilder(gameId(1))
              .hostedBy(playerId(1))
              .withDeckCards({
                deckId: 'id-deck-1',
                cards: [
                  'card-1',
                  'card-2',
                  'card-3',
                  'card-4',
                  'card-5',
                  'card-6',
                  'card-7',
                  'card-8',
                  'card-9',
                  'card-10',
                  'card-11',
                  'card-12',
                  'card-13',
                  'card-14',
                  'card-15',
                  'card-16',
                  'card-17',
                  'card-18',
                  'card-19',
                  'card-20',
                  'card-21',
                  'card-22',
                  'card-23',
                  'card-24',
                  'card-25',
                  'card-26',
                  'card-27',
                  'card-28',
                  'card-29',
                  'card-30',
                  'card-31',
                  'card-32',
                ],
              })
              .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
              .started()
              .withSubmittedClueOnCardIndex('A clue', 0)
              .withSelectedCards([
                { playerId: playerId(2), cardIndex: 0 },
                { playerId: playerId(3), cardIndex: 0 },
              ]),
          );
          const gameViewProjector = yield* GameViewProjector;

          const views = yield* gameViewProjector.project(
            game as StartedGameSnapshot,
          );
          const player1view = views[playerId(1)];
          const player2view = views[playerId(2)];
          const player3view = views[playerId(3)];
          const player4view = views[playerId(4)];

          expect(player1view).toEqual({
            gameId: gameId(1),
            id: playerId(1),
            name: playerId(1),
            storyteller: playerId(1),
            phase: 'selecting-cards',
            playerStatus: {
              [playerId(1)]: 'ready',
              [playerId(2)]: 'ready',
              [playerId(3)]: 'ready',
              [playerId(4)]: 'not-ready',
            },
            score: 0,
            cards: [
              { id: 'card-2', url: 'https://example.com/card-2' },
              { id: 'card-3', url: 'https://example.com/card-3' },
              { id: 'card-4', url: 'https://example.com/card-4' },
              { id: 'card-5', url: 'https://example.com/card-5' },
              { id: 'card-6', url: 'https://example.com/card-6' },
            ],
          });
          expect(player2view).toEqual({
            gameId: gameId(1),
            id: playerId(2),
            name: playerId(2),
            storyteller: playerId(1),
            phase: 'selecting-cards',
            score: 0,
            playerStatus: {
              [playerId(1)]: 'ready',
              [playerId(2)]: 'ready',
              [playerId(3)]: 'ready',
              [playerId(4)]: 'not-ready',
            },
            cards: [
              { id: 'card-8', url: 'https://example.com/card-8' },
              { id: 'card-9', url: 'https://example.com/card-9' },
              { id: 'card-10', url: 'https://example.com/card-10' },
              { id: 'card-11', url: 'https://example.com/card-11' },
              { id: 'card-12', url: 'https://example.com/card-12' },
            ],
          });
          expect(player3view).toEqual({
            gameId: gameId(1),
            id: playerId(3),
            name: playerId(3),
            storyteller: playerId(1),
            phase: 'selecting-cards',
            score: 0,
            playerStatus: {
              [playerId(1)]: 'ready',
              [playerId(2)]: 'ready',
              [playerId(3)]: 'ready',
              [playerId(4)]: 'not-ready',
            },
            cards: [
              { id: 'card-14', url: 'https://example.com/card-14' },
              { id: 'card-15', url: 'https://example.com/card-15' },
              { id: 'card-16', url: 'https://example.com/card-16' },
              { id: 'card-17', url: 'https://example.com/card-17' },
              { id: 'card-18', url: 'https://example.com/card-18' },
            ],
          });
          expect(player4view).toEqual({
            gameId: gameId(1),
            id: playerId(4),
            name: playerId(4),
            storyteller: playerId(1),
            phase: 'selecting-cards',
            score: 0,
            playerStatus: {
              [playerId(1)]: 'ready',
              [playerId(2)]: 'ready',
              [playerId(3)]: 'ready',
              [playerId(4)]: 'not-ready',
            },
            cards: [
              { id: 'card-19', url: 'https://example.com/card-19' },
              { id: 'card-20', url: 'https://example.com/card-20' },
              { id: 'card-21', url: 'https://example.com/card-21' },
              { id: 'card-22', url: 'https://example.com/card-22' },
              { id: 'card-23', url: 'https://example.com/card-23' },
              { id: 'card-24', url: 'https://example.com/card-24' },
            ],
          });
        }).pipe(Effect.provide(makeGameDriverTestLayer()));
      },
    );

    it.effect('Example: voting cards phase', () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        const { game } = yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder(gameId(1))
            .hostedBy(playerId(1))
            .withDeckCards({
              deckId: 'id-deck-1',
              cards: [
                'card-1',
                'card-2',
                'card-3',
                'card-4',
                'card-5',
                'card-6',
                'card-7',
                'card-8',
                'card-9',
                'card-10',
                'card-11',
                'card-12',
                'card-13',
                'card-14',
                'card-15',
                'card-16',
                'card-17',
                'card-18',
                'card-19',
                'card-20',
                'card-21',
                'card-22',
                'card-23',
                'card-24',
                'card-25',
                'card-26',
                'card-27',
                'card-28',
                'card-29',
                'card-30',
                'card-31',
                'card-32',
              ],
            })
            .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
            .started()
            .withSubmittedClueOnCardIndex('A clue', 0)
            .withSelectedCards([
              { playerId: playerId(2), cardIndex: 0 },
              { playerId: playerId(3), cardIndex: 0 },
              { playerId: playerId(4), cardIndex: 0 },
            ])
            .withVotedCards([
              { playerId: playerId(2), cardSelectedByPlayer: playerId(1) },
            ]),
        );
        const gameViewProjector = yield* GameViewProjector;

        const views = yield* gameViewProjector.project(
          game as StartedGameSnapshot,
        );
        const player1view = views[playerId(1)];
        const player2view = views[playerId(2)];
        const player3view = views[playerId(3)];
        const player4view = views[playerId(4)];

        expect(player1view).toEqual({
          gameId: gameId(1),
          id: playerId(1),
          name: playerId(1),
          storyteller: playerId(1),
          phase: 'voting',
          playerStatus: {
            [playerId(1)]: 'ready',
            [playerId(2)]: 'ready',
            [playerId(3)]: 'not-ready',
            [playerId(4)]: 'not-ready',
          },
          score: 0,
          boardCards: [
            { id: 'card-7', url: 'https://example.com/card-7' },
            { id: 'card-13', url: 'https://example.com/card-13' },
            { id: 'card-19', url: 'https://example.com/card-19' },
            { id: 'card-1', url: 'https://example.com/card-1' },
          ],
          cards: [
            { id: 'card-2', url: 'https://example.com/card-2' },
            { id: 'card-3', url: 'https://example.com/card-3' },
            { id: 'card-4', url: 'https://example.com/card-4' },
            { id: 'card-5', url: 'https://example.com/card-5' },
            { id: 'card-6', url: 'https://example.com/card-6' },
          ],
        });
        expect(player2view).toEqual({
          gameId: gameId(1),
          id: playerId(2),
          name: playerId(2),
          storyteller: playerId(1),
          phase: 'voting',
          score: 0,
          playerStatus: {
            [playerId(1)]: 'ready',
            [playerId(2)]: 'ready',
            [playerId(3)]: 'not-ready',
            [playerId(4)]: 'not-ready',
          },
          boardCards: [
            { id: 'card-7', url: 'https://example.com/card-7' },
            { id: 'card-13', url: 'https://example.com/card-13' },
            { id: 'card-19', url: 'https://example.com/card-19' },
            { id: 'card-1', url: 'https://example.com/card-1' },
          ],
          cards: [
            { id: 'card-8', url: 'https://example.com/card-8' },
            { id: 'card-9', url: 'https://example.com/card-9' },
            { id: 'card-10', url: 'https://example.com/card-10' },
            { id: 'card-11', url: 'https://example.com/card-11' },
            { id: 'card-12', url: 'https://example.com/card-12' },
          ],
        });
        expect(player3view).toEqual({
          gameId: gameId(1),
          id: playerId(3),
          name: playerId(3),
          storyteller: playerId(1),
          phase: 'voting',
          score: 0,
          playerStatus: {
            [playerId(1)]: 'ready',
            [playerId(2)]: 'ready',
            [playerId(3)]: 'not-ready',
            [playerId(4)]: 'not-ready',
          },
          boardCards: [
            { id: 'card-7', url: 'https://example.com/card-7' },
            { id: 'card-13', url: 'https://example.com/card-13' },
            { id: 'card-19', url: 'https://example.com/card-19' },
            { id: 'card-1', url: 'https://example.com/card-1' },
          ],
          cards: [
            { id: 'card-14', url: 'https://example.com/card-14' },
            { id: 'card-15', url: 'https://example.com/card-15' },
            { id: 'card-16', url: 'https://example.com/card-16' },
            { id: 'card-17', url: 'https://example.com/card-17' },
            { id: 'card-18', url: 'https://example.com/card-18' },
          ],
        });
        expect(player4view).toEqual({
          gameId: gameId(1),
          id: playerId(4),
          name: playerId(4),
          storyteller: playerId(1),
          phase: 'voting',
          score: 0,
          playerStatus: {
            [playerId(1)]: 'ready',
            [playerId(2)]: 'ready',
            [playerId(3)]: 'not-ready',
            [playerId(4)]: 'not-ready',
          },
          boardCards: [
            { id: 'card-7', url: 'https://example.com/card-7' },
            { id: 'card-13', url: 'https://example.com/card-13' },
            { id: 'card-19', url: 'https://example.com/card-19' },
            { id: 'card-1', url: 'https://example.com/card-1' },
          ],
          cards: [
            { id: 'card-20', url: 'https://example.com/card-20' },
            { id: 'card-21', url: 'https://example.com/card-21' },
            { id: 'card-22', url: 'https://example.com/card-22' },
            { id: 'card-23', url: 'https://example.com/card-23' },
            { id: 'card-24', url: 'https://example.com/card-24' },
          ],
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });

    it.effect('Example: scoring cards phase', () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;

        const { game } = yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder(gameId(1))
            .hostedBy(playerId(1))
            .withDeckCards({
              deckId: 'id-deck-1',
              cards: [
                'card-1',
                'card-2',
                'card-3',
                'card-4',
                'card-5',
                'card-6',
                'card-7',
                'card-8',
                'card-9',
                'card-10',
                'card-11',
                'card-12',
                'card-13',
                'card-14',
                'card-15',
                'card-16',
                'card-17',
                'card-18',
                'card-19',
                'card-20',
                'card-21',
                'card-22',
                'card-23',
                'card-24',
                'card-25',
                'card-26',
                'card-27',
                'card-28',
                'card-29',
                'card-30',
                'card-31',
                'card-32',
              ],
            })
            .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
            .started()
            .withSubmittedClueOnCardIndex('A clue', 0)
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
            ])
            .withPlayersReadyForNextTurn([playerId(2)]),
        );
        const gameViewProjector = yield* GameViewProjector;

        const views = yield* gameViewProjector.project(
          game as StartedGameSnapshot,
        );
        const player1view = views[playerId(1)];
        const player2view = views[playerId(2)];
        const player3view = views[playerId(3)];
        const player4view = views[playerId(4)];

        expect(player1view).toEqual({
          gameId: gameId(1),
          id: playerId(1),
          name: playerId(1),
          storyteller: playerId(1),
          phase: 'scoring',
          playerStatus: {
            [playerId(1)]: 'not-ready',
            [playerId(2)]: 'ready',
            [playerId(3)]: 'not-ready',
            [playerId(4)]: 'not-ready',
          },
          score: 3,
          points: [
            {
              points: 3,
              reason: AtLeastOnePlayerFoundTheStorytellerCard(),
            },
          ],
          votes: {
            'card-1': [playerId(2), playerId(4)],
            'card-7': [playerId(3)],
            'card-13': [],
            'card-19': [],
          },
          boardCards: [
            { id: 'card-7', url: 'https://example.com/card-7' },
            { id: 'card-13', url: 'https://example.com/card-13' },
            { id: 'card-19', url: 'https://example.com/card-19' },
            { id: 'card-1', url: 'https://example.com/card-1' },
          ],
          cards: [
            { id: 'card-2', url: 'https://example.com/card-2' },
            { id: 'card-3', url: 'https://example.com/card-3' },
            { id: 'card-4', url: 'https://example.com/card-4' },
            { id: 'card-5', url: 'https://example.com/card-5' },
            { id: 'card-6', url: 'https://example.com/card-6' },
          ],
        });
        expect(player2view).toEqual({
          gameId: gameId(1),
          id: playerId(2),
          name: playerId(2),
          storyteller: playerId(1),
          phase: 'scoring',
          score: 4,
          points: [
            {
              points: 3,
              reason: YouFoundTheStorytellerCard(),
            },
            {
              points: 1,
              reason: APlayerVotedOnYourCard({
                playerId: PlayerId(playerId(3)),
              }),
            },
          ],
          playerStatus: {
            [playerId(1)]: 'not-ready',
            [playerId(2)]: 'ready',
            [playerId(3)]: 'not-ready',
            [playerId(4)]: 'not-ready',
          },
          votes: {
            'card-1': [playerId(2), playerId(4)],
            'card-7': [playerId(3)],
            'card-13': [],
            'card-19': [],
          },
          boardCards: [
            { id: 'card-7', url: 'https://example.com/card-7' },
            { id: 'card-13', url: 'https://example.com/card-13' },
            { id: 'card-19', url: 'https://example.com/card-19' },
            { id: 'card-1', url: 'https://example.com/card-1' },
          ],
          cards: [
            { id: 'card-8', url: 'https://example.com/card-8' },
            { id: 'card-9', url: 'https://example.com/card-9' },
            { id: 'card-10', url: 'https://example.com/card-10' },
            { id: 'card-11', url: 'https://example.com/card-11' },
            { id: 'card-12', url: 'https://example.com/card-12' },
          ],
        });
        expect(player3view).toEqual({
          gameId: gameId(1),
          id: playerId(3),
          name: playerId(3),
          storyteller: playerId(1),
          phase: 'scoring',
          score: 0,
          points: [],
          playerStatus: {
            [playerId(1)]: 'not-ready',
            [playerId(2)]: 'ready',
            [playerId(3)]: 'not-ready',
            [playerId(4)]: 'not-ready',
          },
          votes: {
            'card-1': [playerId(2), playerId(4)],
            'card-7': [playerId(3)],
            'card-13': [],
            'card-19': [],
          },
          boardCards: [
            { id: 'card-7', url: 'https://example.com/card-7' },
            { id: 'card-13', url: 'https://example.com/card-13' },
            { id: 'card-19', url: 'https://example.com/card-19' },
            { id: 'card-1', url: 'https://example.com/card-1' },
          ],
          cards: [
            { id: 'card-14', url: 'https://example.com/card-14' },
            { id: 'card-15', url: 'https://example.com/card-15' },
            { id: 'card-16', url: 'https://example.com/card-16' },
            { id: 'card-17', url: 'https://example.com/card-17' },
            { id: 'card-18', url: 'https://example.com/card-18' },
          ],
        });
        expect(player4view).toEqual({
          gameId: gameId(1),
          id: playerId(4),
          name: playerId(4),
          storyteller: playerId(1),
          phase: 'scoring',
          score: 3,
          points: [
            {
              points: 3,
              reason: YouFoundTheStorytellerCard(),
            },
          ],
          playerStatus: {
            [playerId(1)]: 'not-ready',
            [playerId(2)]: 'ready',
            [playerId(3)]: 'not-ready',
            [playerId(4)]: 'not-ready',
          },
          votes: {
            'card-1': [playerId(2), playerId(4)],
            'card-7': [playerId(3)],
            'card-13': [],
            'card-19': [],
          },
          boardCards: [
            { id: 'card-7', url: 'https://example.com/card-7' },
            { id: 'card-13', url: 'https://example.com/card-13' },
            { id: 'card-19', url: 'https://example.com/card-19' },
            { id: 'card-1', url: 'https://example.com/card-1' },
          ],
          cards: [
            { id: 'card-20', url: 'https://example.com/card-20' },
            { id: 'card-21', url: 'https://example.com/card-21' },
            { id: 'card-22', url: 'https://example.com/card-22' },
            { id: 'card-23', url: 'https://example.com/card-23' },
            { id: 'card-24', url: 'https://example.com/card-24' },
          ],
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });

    it.effect('Example: ended game', () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;
        const { game } = yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder(gameId(1))
            .hostedBy(playerId(1))
            .withEndCondition({
              type: 'LimitOfPoints',
              limit: 10,
            })
            .withPlayers(playerId(1), playerId(2), playerId(3), playerId(4))
            .withScores([
              { playerId: playerId(1), score: 10 },
              { playerId: playerId(2), score: 3 },
              { playerId: playerId(3), score: 4 },
              { playerId: playerId(4), score: 5 },
            ])
            .inScoringPhaseSince(new Date())
            .withPlayersReadyForNextTurn([
              playerId(1),
              playerId(2),
              playerId(3),
              playerId(4),
            ]),
        );
        if (!isEndedGameSnapshot(game)) {
          throw new Error('Game is not ended');
        }

        const gameViewProjector = yield* GameViewProjector;

        const views = yield* gameViewProjector.project(game);
        const player1view = views[playerId(1)];
        const player2view = views[playerId(2)];
        const player3view = views[playerId(3)];
        const player4view = views[playerId(4)];

        expect(player1view).toEqual({
          gameId: gameId(1),
          id: playerId(1),
          name: playerId(1),
          phase: 'ended',
          score: 10,
        });
        expect(player2view).toEqual({
          gameId: gameId(1),
          id: playerId(2),
          name: playerId(2),
          phase: 'ended',
          score: 5,
        });
        expect(player3view).toEqual({
          gameId: gameId(1),
          id: playerId(3),
          name: playerId(3),
          phase: 'ended',
          score: 6,
        });
        expect(player4view).toEqual({
          gameId: gameId(1),
          id: playerId(4),
          name: playerId(4),
          phase: 'ended',
          score: 7,
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });

    it.effect('Example: lobby phase with 2 players (cannot start)', () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;
        const { game } = yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder(gameId(1))
            .hostedBy(playerId(1))
            .withPlayers(playerId(1), playerId(2)),
        );

        if (!isNotStartedGameSnapshot(game)) {
          throw new Error('Game should not be started');
        }

        const gameViewProjector = yield* GameViewProjector;
        const views = yield* gameViewProjector.projectLobby(game);
        const player1view = views[playerId(1)];
        const player2view = views[playerId(2)];

        expect(player1view).toEqual({
          gameId: gameId(1),
          id: playerId(1),
          name: playerId(1),
          phase: 'lobby',
          hostId: playerId(1),
          players: [playerId(1), playerId(2)],
          isHost: true,
          canStart: false,
          actions: [
            {
              type: 'start-game',
              url: `/game/${gameId(1)}/start`,
              method: 'POST',
              label: 'Lancer la partie',
              disabled: true,
            },
            {
              type: 'copy-invite',
              url: `/game/${gameId(1)}/join`,
              method: 'GET',
              label: 'Copier le lien',
              disabled: false,
            },
          ],
        });

        expect(player2view).toEqual({
          gameId: gameId(1),
          id: playerId(2),
          name: playerId(2),
          phase: 'lobby',
          hostId: playerId(1),
          players: [playerId(1), playerId(2)],
          isHost: false,
          canStart: false,
          actions: [
            {
              type: 'copy-invite',
              url: `/game/${gameId(1)}/join`,
              method: 'GET',
              label: 'Copier le lien',
              disabled: false,
            },
          ],
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });

    it.effect('Example: lobby phase with 3 players (can start)', () => {
      return Effect.gen(function* () {
        const gameDriver = yield* GameDriver;
        const { game } = yield* gameDriver.given.existingGame(
          gameDriver,
          new GameBuilder(gameId(1))
            .hostedBy(playerId(1))
            .withPlayers(playerId(1), playerId(2), playerId(3)),
        );

        if (!isNotStartedGameSnapshot(game)) {
          throw new Error('Game should not be started');
        }

        const gameViewProjector = yield* GameViewProjector;
        const views = yield* gameViewProjector.projectLobby(game);
        const player1view = views[playerId(1)];
        const player2view = views[playerId(2)];
        const player3view = views[playerId(3)];

        expect(player1view).toEqual({
          gameId: gameId(1),
          id: playerId(1),
          name: playerId(1),
          phase: 'lobby',
          hostId: playerId(1),
          players: [playerId(1), playerId(2), playerId(3)],
          isHost: true,
          canStart: true,
          actions: [
            {
              type: 'start-game',
              url: `/game/${gameId(1)}/start`,
              method: 'POST',
              label: 'Lancer la partie',
              disabled: false,
            },
            {
              type: 'copy-invite',
              url: `/game/${gameId(1)}/join`,
              method: 'GET',
              label: 'Copier le lien',
              disabled: false,
            },
          ],
        });

        expect(player2view).toEqual({
          gameId: gameId(1),
          id: playerId(2),
          name: playerId(2),
          phase: 'lobby',
          hostId: playerId(1),
          players: [playerId(1), playerId(2), playerId(3)],
          isHost: false,
          canStart: false,
          actions: [
            {
              type: 'copy-invite',
              url: `/game/${gameId(1)}/join`,
              method: 'GET',
              label: 'Copier le lien',
              disabled: false,
            },
          ],
        });

        expect(player3view).toEqual({
          gameId: gameId(1),
          id: playerId(3),
          name: playerId(3),
          phase: 'lobby',
          hostId: playerId(1),
          players: [playerId(1), playerId(2), playerId(3)],
          isHost: false,
          canStart: false,
          actions: [
            {
              type: 'copy-invite',
              url: `/game/${gameId(1)}/join`,
              method: 'GET',
              label: 'Copier le lien',
              disabled: false,
            },
          ],
        });
      }).pipe(Effect.provide(makeGameDriverTestLayer()));
    });
  });
};
