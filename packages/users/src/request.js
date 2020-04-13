export const makeRequest = ({ headers } = {}) => ({
  getBearerToken() {
    console.log('headers', headers);
    if (!headers.authorization) return null;
    return headers.authorization.split('Bearer ')[1];
  },
});

export const makeNullRequest = ({ token } = {}) => makeRequest({ headers: { authorization: `Bearer ${token}` } });
