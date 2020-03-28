import { makeCard } from '../card';

describe('card', () => {
  it('gets correctly created', () => {
    expect(makeCard({ id: 'c1', url: 'https://cards.url/c1.png' })).toEqual({
      id: 'c1',
      url: 'https://cards.url/c1.png',
    });
  });
});
