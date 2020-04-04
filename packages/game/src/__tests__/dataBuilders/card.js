import faker from 'faker';

export const buildTestCard = () => {
  const defaultProperties = {
    id: faker.random.uuid(),
    url: faker.image.imageUrl(),
  };
  const overrides = {};
  return {
    build() {
      return {
        ...defaultProperties,
        ...overrides,
      };
    },
  };
};
