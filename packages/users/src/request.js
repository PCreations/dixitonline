export const makeRequest = ({ headers } = {}) => ({
  getBearerToken() {
    return headers.authorization.split('Bearer ')[1];
  },
});

export const makeNullRequest = ({ token } = {}) => makeRequest({ headers: { authorization: `Bearer ${token}` } });
