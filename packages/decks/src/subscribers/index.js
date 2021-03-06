import { shuffle as shuffleWithSeed } from 'shuffle-seed';
import { makeAfterGameStartedSubscriber } from './after-game-started';
import { makeGetShuffledDeck } from '../useCases/get-shuffled-deck';

export const initialize = ({ subscribeToDomainEvent, dispatchDomainEvents, deckRepository }) => {
  const shuffle = shuffleWithSeed;
  const getShuffledDeckUseCase = makeGetShuffledDeck({ deckRepository, shuffle, dispatchDomainEvents });

  // initialize subscribers
  makeAfterGameStartedSubscriber({ subscribeToDomainEvent, getShuffledDeck: getShuffledDeckUseCase });
};
