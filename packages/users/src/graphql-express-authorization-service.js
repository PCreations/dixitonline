import { makeNullRequest, makeRequest } from './request';

const makeNullFirebaseAuth = ({ userIdInDecodedToken, currentUserUsername } = {}) => ({
  async verifyIdToken() {
    return { uid: userIdInDecodedToken };
  },
  async getUser() {
    return {
      displayName: currentUserUsername,
    };
  },
});

const makeGetRequestFromContext = () => context => makeRequest(context.req);

export const makeGraphqlExpressAuthorizationService = ({
  firebaseAuth = makeNullFirebaseAuth(),
  getRequestFromContext = makeGetRequestFromContext(),
} = {}) => {
  let idToken;
  return {
    async getCurrentUser(context) {
      const request = getRequestFromContext(context);
      idToken = request.getBearerToken();
      if (!idToken) {
        const req = context.req;
        if (!req.headers['test-user-id'] && !req.headers['test-username']) {
          throw new Error('unauthorized');
        }
        return {
          id: req.headers['test-user-id'],
          username: req.headers['test-username'],
        };
      }
      const { uid } = await firebaseAuth.verifyIdToken(idToken);
      const currentUser = await firebaseAuth.getUser(uid);

      return {
        id: uid,
        username: currentUser.displayName,
      };
    },
    getLastVerifiedIdToken() {
      return idToken;
    },
  };
};

export const makeNullGraphqlExpressAuthorizationService = ({ token, userIdInDecodedToken, currentUserUsername }) =>
  makeGraphqlExpressAuthorizationService({
    firebaseAuth: makeNullFirebaseAuth({ userIdInDecodedToken, currentUserUsername }),
    getRequestFromContext: () => makeNullRequest({ token }),
  });
