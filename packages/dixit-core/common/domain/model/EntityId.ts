import { v1 as uuid } from 'uuid';

type UUID = string;

export type EntityId = { readonly id: UUID };

export default (): EntityId => {
  const id: UUID = uuid();
  return {
    get id() {
      return id;
    },
  };
};
