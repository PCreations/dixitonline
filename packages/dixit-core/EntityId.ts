import uuid from 'uuid/v1';

type UUID = string;

export type EntityId = { readonly value: UUID };

export default (): EntityId => {
  const id: UUID = uuid();
  return {
    get value() {
      return id;
    },
  };
};
