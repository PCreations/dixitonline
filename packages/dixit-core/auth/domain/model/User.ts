import { EntityId } from '../../../common/domain/model/EntityId';

export type User = {
  id: EntityId;
  username: string;
  email: string;
  password: string;
};
