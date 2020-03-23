import { makeGetContext } from '../get-context';

describe('getContext', () => {
  it('retrieves the current user through the authorization service by passing the request object', async () => {
    // arrange
    const currentUser = {};
    const authorizationService = {
      getCurrentUser: jest.fn(() => currentUser),
    };
    const dispatchDomainEvents = jest.fn();
    const getContext = makeGetContext({ dispatchDomainEvents, authorizationService });

    // act
    const context = await getContext();

    // assert
    expect(context.dispatchDomainEvents).toBe(dispatchDomainEvents);
    expect(context.currentUser).toBe(currentUser);
  });
});
