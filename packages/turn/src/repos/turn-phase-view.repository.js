export const makeTurnPhaseViewRepository = ({ firestore }) => {
  const getTurnPhaseViewDocumentRef = ({ turnId, playerId }) =>
    firestore.collection('turn-phase-views').doc(`${turnId}-${playerId}`);

  return {
    async updateTurnPhaseView({ turnId, playerId }, turnPhase) {
      await getTurnPhaseViewDocumentRef({ turnId, playerId }).set(turnPhase);
    },
  };
};

export const makeNullTurnPhaseViewRepository = ({ existingPhaseViews = {} } = {}) =>
  makeTurnPhaseViewRepository({
    firestore: makeNullFirestore({ existingPhaseViews }),
  });

const makeNullFirestore = ({ existingPhaseViews }) => {
  return {
    collection() {
      return {
        doc(id) {
          return {
            set(turnPhase) {
              // eslint-disable-next-line
              existingPhaseViews[id] = turnPhase;
              return Promise.resolve();
            },
          };
        },
      };
    },
  };
};
