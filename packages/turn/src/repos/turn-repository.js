import { v1 as uuidv1 } from 'uuid';
import { turnReducer } from '../domain/reducer';

export class TurnNotFoundError extends Error {
  constructor(turnId) {
    super();
    this.message = `Turn ${turnId} not found`;
  }
}

export const makeTurnRepository = ({ uuid = uuidv1, firestore }) => {
  return {
    getNextTurnId() {
      return uuid();
    },
    saveTurn(turnId, events = []) {
      const turnEventsCollection = firestore
        .collection('turns')
        .doc(turnId)
        .collection('events');
      return Promise.all(
        events.map((event, index) => {
          return new Promise(resolve => {
            setTimeout(
              () =>
                resolve(
                  turnEventsCollection.add({
                    eventData: JSON.stringify(event),
                    timestamp: +new Date(),
                  })
                ),
              index * 10
            );
          });
        })
      );
    },
    async getTurnById(turnId) {
      const history = await firestore
        .collection('turns')
        .doc(turnId)
        .collection('events')
        .orderBy('timestamp', 'asc')
        .get()
        .then(snapshot => {
          if (snapshot.empty) {
            throw new TurnNotFoundError(turnId);
          }
          const events = [];
          snapshot.forEach(eventDoc => {
            const event = JSON.parse(eventDoc.data().eventData);
            events.push(event);
          });
          return events;
        });
      return history.reduce(turnReducer, undefined);
    },
  };
};

export const makeNullTurnRepository = ({ nextTurnId, initialHistory = {} } = {}) =>
  makeTurnRepository({ uuid: nullUuid(nextTurnId), firestore: makeNullFirestore({ initialHistory }) });

const nullUuid = expectedUuid => () => expectedUuid;

const makeNullFirestore = ({ initialHistory = {} } = {}) => {
  const history = Object.entries(initialHistory).reduce(
    (currentHistory, [turnId, events]) => ({
      ...currentHistory,
      [turnId]: events.map(JSON.stringify),
    }),
    {}
  );
  return {
    collection() {
      return {
        doc(turnId) {
          return {
            collection() {
              return {
                orderBy() {
                  return {
                    async get() {
                      return {
                        empty: typeof history[turnId] === 'undefined',
                        forEach(callback) {
                          return history[turnId].forEach(event => {
                            callback({
                              data() {
                                return {
                                  eventData: event,
                                };
                              },
                            });
                          });
                        },
                      };
                    },
                  };
                },
                async add({ eventData }) {
                  history[turnId] = history[turnId] || [];
                  history[turnId].push(eventData);
                },
              };
            },
          };
        },
      };
    },
  };
};
