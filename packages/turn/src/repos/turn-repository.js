import { v1 as uuidv1 } from 'uuid';

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
    saveTurn(turn) {
      const { phase, ...turnData } = turn;
      return firestore
        .collection('turns')
        .doc(turn.id)
        .set({
          ...turnData,
          phase: phase.state,
        });
    },
    async getTurnById(turnId) {
      const doc = await firestore
        .collection('turns')
        .doc(turnId)
        .get();
      if (!doc.exists) {
        throw new TurnNotFoundError(turnId);
      }
      return doc.data();
    },
  };
};

export const makeNullTurnRepository = ({ nextTurnId, initialData = {} } = {}) =>
  makeTurnRepository({ uuid: nullUuid(nextTurnId), firestore: makeNullFirestore({ initialData }) });

const nullUuid = expectedUuid => () => expectedUuid;

const makeNullFirestore = ({ initialData }) => {
  const data = { ...initialData };
  return {
    collection() {
      return {
        doc(turnId) {
          return {
            async get() {
              return {
                data() {
                  return data[turnId];
                },
                exists: typeof data[turnId] !== 'undefined',
              };
            },
            set(turn) {
              data[turnId] = turn;
            },
          };
        },
      };
    },
  };
};
