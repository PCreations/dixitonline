const { share, map, mergeMap, take } = require('rxjs/operators');
const { from, fromEvent } = require('rxjs');
const { EventEmitter } = require('events');
const { InMemoryEventStore } = require('../infrastructure/inMemory/eventStore');
const { InMemoryProjectionStore } = require('../../../readModel/infrastructure/inMemoryProjectionStore');
const { GameCreated } = require('../domain/game/events/gameCreated');
const { PlayerCreated } = require('../domain/player/events/playerCreated');
const { DixitCore } = require('../../../index');
const { createTestCommandDispatcher } = require('./testUtils');

const testDeck = Array(84)
  .fill({})
  .map((_, i) => ({ id: i, img: `card${i}.png` }));

describe('Given two games in the lobby waiting for players', () => {
  describe('And one of this game was created by Julien and Julie being the unique player', () => {
    describe('When Mathilde joins the game created by Julien', () => {
      test('Then the game created by Julien should now have 2 players', async done => {
        const history = [
          PlayerCreated({ playerId: 'mathilde', username: 'Mathilde' }),
          PlayerCreated({ playerId: 'julien', username: 'Julien' }),
          GameCreated({ gameId: 'g1', playerId: 'mathilde', username: 'Mathilde', deck: testDeck }),
          GameCreated({ gameId: 'g2', playerId: 'julien', username: 'Julien', deck: testDeck }),
        ];
        const eventsEmitter = new EventEmitter();
        const dispatchEvents = events => eventsEmitter.emit('events', events);
        const events$ = fromEvent(eventsEmitter, 'events').pipe(
          mergeMap(events => from(events)),
          share(),
        );
        const inMemoryEventStore = InMemoryEventStore({ history, dispatchEvents });
        const inMemoryProjectionStore = InMemoryProjectionStore();
        const [writeModel, _] = await Promise.all([
          DixitCore.WriteModel({
            eventStore: inMemoryEventStore,
            dispatchEvents,
          }),
          DixitCore.ReadModel({
            events$,
            projectionStore: inMemoryProjectionStore,
          }),
        ]);
        inMemoryEventStore.replayHistory();
        const dixit = await DixitCore.Client({
          dispatchCommand: createTestCommandDispatcher({ writeModel }),
          projectionStore: inMemoryProjectionStore,
        });
        dixit.projections.lobby$
          .pipe(
            take(2),
            map((lobby, i) => {
              debugger;
              if (i === 0) {
                expect(lobby.gamesList).toEqual([
                  {
                    id: 'g1',
                    players: [
                      {
                        id: 'mathilde',
                        username: 'Mathilde',
                      },
                    ],
                  },
                  {
                    id: 'g2',
                    players: [
                      {
                        id: 'julien',
                        username: 'Julien',
                      },
                    ],
                  },
                ]);
              } else {
                expect(lobby.gamesList).toEqual([
                  {
                    id: 'g1',
                    players: [
                      {
                        id: 'mathilde',
                        username: 'Mathilde',
                      },
                    ],
                  },
                  {
                    id: 'g2',
                    players: [
                      {
                        id: 'julien',
                        username: 'Julien',
                      },
                      {
                        id: 'mathilde',
                        username: 'Mathilde',
                      },
                    ],
                  },
                ]);
              }
            }),
          )
          .subscribe({
            complete: done,
            error: done.fail.bind(done),
          });

        await dixit.commands.joinGame({ gameId: 'g2', playerId: 'mathilde' });
      });
    });
  });
});
