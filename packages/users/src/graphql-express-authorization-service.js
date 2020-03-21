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

export const makeGraphqlExpressAuthorizationService = ({ firebaseAuth = makeNullFirebaseAuth() } = {}) => ({
  async getCurrentUser({ headers: { authorization } = {} } = {}) {
    const token = authorization.split('Bearer ')[1];
    const { uid } = await firebaseAuth.verifyIdToken(token);
    const currentUser = await firebaseAuth.getUser(uid);

    return {
      id: uid,
      username: currentUser.displayName,
    };
  },
});

export const makeNullGraphqlExpressAuthorizationService = ({ userIdInDecodedToken, currentUserUsername }) =>
  makeGraphqlExpressAuthorizationService({
    firebaseAuth: makeNullFirebaseAuth({ userIdInDecodedToken, currentUserUsername }),
  });
