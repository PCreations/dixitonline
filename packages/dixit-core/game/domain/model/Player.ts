import { EntityId } from '../../../common/domain/model/EntityId';
import { Hand } from './Hand';
import { VotingToken } from './VotingToken';

export type Player = {
  userId: EntityId;
  hand: Hand;
  votingToken: VotingToken;
  name: string;
  point: number;
};
