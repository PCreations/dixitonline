import * as firebase from '@firebase/testing';
import { makeDeckRepository, makeNullDeckRepository } from '../deck-repository';

let firebaseApp;

describe.skip('deck repository', () => {
  beforeEach(() => {
    firebaseApp = firebase.initializeTestApp({
      projectId: `${Math.floor(Math.random() * new Date())}`,
    });
    return firebaseApp
      .firestore()
      .collection('decks')
      .doc('default')
      .set({
        name: 'default',
        cards: ['01.png', '02.png', '03.png'],
      });
  });
  afterEach(() => {
    return Promise.all(firebase.apps().map(app => app.delete()));
  });
  it('can retrieve the default deck', async () => {
    // arrange
    const deckRepository = makeDeckRepository({ firestore: firebaseApp.firestore() });
    const expectedDeck = {
      name: 'default',
      cards: ['01.png', '02.png', '03.png'],
    };

    // act
    const deck = await deckRepository.getDefaultDeck();

    // assert
    expect(deck).toEqual(expectedDeck);
  });
});
describe('null deck repository', () => {
  it('can retrieved provided default deck', async () => {
    // arrange
    const deckRepository = makeNullDeckRepository({ defaultDeckCards: ['01.png', '02.png', '03.png'] });
    const expectedDeck = {
      name: 'default',
      cards: ['01.png', '02.png', '03.png'],
    };

    // act
    const deck = await deckRepository.getDefaultDeck();

    // assert
    expect(deck).toEqual(expectedDeck);
  });
});
