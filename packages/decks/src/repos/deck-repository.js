export const makeDeckRepository = ({ firestore } = {}) => {
  return {
    async getDefaultDeck() {
      const doc = await firestore
        .collection('decks')
        .doc('default')
        .get();
      return doc.data();
    },
  };
};

export const makeNullDeckRepository = ({ defaultDeckCards } = {}) =>
  makeDeckRepository({ firestore: makeNullFirestore(defaultDeckCards) });

const makeNullFirestore = (defaultDeckCards = []) => {
  const defaultDeckCardsData = [...defaultDeckCards];
  return {
    collection() {
      return {
        doc() {
          return {
            get() {
              return {
                data() {
                  return {
                    name: 'default',
                    cards: defaultDeckCardsData,
                  };
                },
              };
            },
          };
        },
      };
    },
  };
};
