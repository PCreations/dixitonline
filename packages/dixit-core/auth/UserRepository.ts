import { User, UserId } from './User';

export type UserRepository = {
  eventStore: any; //@TODO
  getById(id: UserId): User;
};
