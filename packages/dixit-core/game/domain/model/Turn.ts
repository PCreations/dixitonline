import { Player } from './Player';
import { TurnPhase } from './TurnPhase';
import { EntityId } from '../../../common/domain/model/EntityId';

export type Turn = {
  id: EntityId;
  storyteller: Player;
  players: [Player];
  phase: TurnPhase;
};
