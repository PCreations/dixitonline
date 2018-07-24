import { EntityId } from '../../../EntityId';

export type Card = {
  id: EntityId;
  playerId: EntityId;
  imageSrc: string;
};
