import { EntityId } from '../../../EntityId';
import { Deck } from './Deck';

export type DrawPile = {
  deck: Deck;
  shuffle: () => DrawPile;
};
