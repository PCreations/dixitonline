import { EntityId } from '../../../EntityId';

export type User = {
  id: EntityId;
  username: string;
  email: string;
  password: string;
};
