import { EntityId } from '../../../common/domain/model/EntityId';
import { Deck } from './Deck';

export type DrawPile = {
  deck: Deck;
  shuffle: () => DrawPile;
};
