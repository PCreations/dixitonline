import faker from 'faker';

export const buildTestCard = () => {
  const defaultProperties = {
    id: faker.random.uuid(),
    url: faker.image.imageUrl(),
  };
  const overrides = {};
  return {
    withId(id) {
      overrides.id = id;
      return this;
    },
    build() {
      return {
        ...defaultProperties,
        ...overrides,
      };
    },
  };
};
