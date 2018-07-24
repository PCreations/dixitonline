import { EntityId } from '../../../EntityId';
import { Turn } from './Turn';
import { Player } from './Player';
import { DrawPile } from './DrawPile';

export type Game = {
  id: EntityId;
  turn: Turn;
  players: [Player];
  drawPile: [DrawPile];
};
