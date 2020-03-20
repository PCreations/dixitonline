import {
  // makeGraphqlExpressAuthorizationService, TODO : when integrating with front, add a fake user to test with real firebaseAuth
  makeNullGraphqlExpressAuthorizationService,
} from '../graphql-express-authorization-service';

describe('graphql express authorization service', () => {
  it("gets the authenticated user from the input request's authorization bearer token", async () => {
    // arrange
    const authorizationService = makeNullGraphqlExpressAuthorizationService({
      userIdInDecodedToken: 'user1',
      currentUserUsername: 'user 1',
    });
    const request = { headers: { authorization: 'Bearer some token' } };

    // act
    const user = await authorizationService.getCurrentUser(request);

    // assert
    expect(user).toEqual({ id: 'user1', username: 'user 1' });
  });
});
