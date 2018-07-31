import { EntityId, default as createEntityId } from '../../../common/domain/model/EntityId';

export type Card = {
  cardId: EntityId;
  playerId: EntityId;
  imageSrc: string;
};
