export default ({ auth: { authStateChange$, createUserAndLogin, currentAuthUser } }) => {
  return {
    signup({ username, password, email }) {
      return createUserAndLogin({ email, password, username });
    },
    authStateChange$,
    currentAuthUser,
  };
};
