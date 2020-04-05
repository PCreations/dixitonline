export const makeUserRepository = ({ firebaseAuth }) => ({
  async getUserById(id) {
    const user = await firebaseAuth.getUser(id);
    return {
      id,
      name: user.displayName || user.email.split('@')[0],
    };
  },
});

export const makeNullUserRepository = ({ users }) => makeUserRepository({ firebaseAuth: makeNullFirebaseAuth(users) });

const makeNullFirebaseAuth = users => ({
  getUser(id) {
    return users[id];
  },
});
