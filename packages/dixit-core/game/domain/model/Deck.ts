import { Set } from 'immutable';
import { Card } from './Card';

export type Deck = {
  cards: Set<Card>;
};
