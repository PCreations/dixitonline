/* global expect */

describe('given the dixitDatabasePort', () => {
  describe('when implementing an adapter', () => {
    test('then a new game can be created and the created game should be received trough a gameObservable$', async(done) => {
      const game = await testDatabase.createGame({ host: 'p1' });
      testDatabase.gameObservable$
        .take(1)
        .do(game => expect(game).toEqual(game))
        .subscribe({
          complete: done,
          error: done.fail.bind(done),
        })
    })
  })
});
