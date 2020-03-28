import { v1 as uuidv1 } from 'uuid';

export const makeTurnRepository = ({ uuid = uuidv1, firestore }) => {
  return {
    getNextTurnId() {
      return uuid();
    },
    saveTurn(turn) {
      return firestore
        .collection('turns')
        .doc(turn.id)
        .set(turn);
    },
    getTurnById(turnId) {
      return firestore
        .collection('turns')
        .doc(turnId)
        .get()
        .then(doc => doc.data());
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
