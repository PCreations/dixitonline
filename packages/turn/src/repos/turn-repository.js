import { v1 as uuidv1 } from 'uuid';
import { turnReducer } from '../domain/reducer';

export class TurnNotFoundError extends Error {
  constructor(turnId) {
    super();
    this.message = `Turn ${turnId} not found`;
  }
}

export const makeTurnRepository = ({ uuid = uuidv1, firestore }) => {
  const getTurnDocumentRef = turnId => firestore.collection('turns').doc(turnId);

  const buildTurnFromTurnDoc = turnId => turnDoc => {
    if (turnDoc.empty) {
      throw new TurnNotFoundError(turnId);
    }
    const events = Object.entries(turnDoc.data());
    events.sort(([timestampA], [timestampB]) => parseInt(timestampA, 10) - parseInt(timestampB, 10));
    const history = events.flatMap(([, eventData]) => JSON.parse(eventData));
    return history.reduce(turnReducer, undefined);
  };

  const buildEventMapToSave = events =>
    events.reduce(
      (eventMap, event, index) => ({
        ...eventMap,
        [+new Date() + index]: JSON.stringify(event),
      }),
      {}
    );

  return {
    inTransaction(doInTransaction) {
      return firestore.runTransaction(transaction =>
        doInTransaction({
          async getTurnById(turnId) {
            const buildTurn = buildTurnFromTurnDoc(turnId);
            const turnDoc = await transaction.get(getTurnDocumentRef(turnId));
            return buildTurn(turnDoc);
          },
          saveTurn(turnId, events = []) {
            const eventsToSave = buildEventMapToSave(events);
            return transaction.set(getTurnDocumentRef(turnId), eventsToSave, { merge: true });
          },
        })
      );
    },
    getNextTurnId() {
      return uuid();
    },
    saveTurn(turnId, events = []) {
      const turnEventsRef = firestore.collection('turns').doc(turnId);
      const eventsToSave = buildEventMapToSave(events);
      return turnEventsRef.set(eventsToSave, { merge: true });
    },
    async getTurnById(turnId) {
      return firestore
        .collection('turns')
        .doc(turnId)
        .get()
        .then(buildTurnFromTurnDoc(turnId));
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
    runTransaction(callback) {
      return callback({
        get(doc) {
          return doc.get();
        },
        set(doc, eventsToSave) {
          return doc.set(eventsToSave);
        },
      });
    },
    collection() {
      return {
        doc(turnId) {
          return {
            async get() {
              return {
                empty: typeof history[turnId] === 'undefined',
                data() {
                  return history[turnId];
                },
              };
            },
            set(eventsToSave) {
              history[turnId] = {
                ...(history[turnId] || {}),
                ...eventsToSave,
              };
            },
          };
        },
      };
    },
  };
};
