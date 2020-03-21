import { makeRequest, makeNullRequest } from '../request';

describe('request', () => {
  it('should get the token from the authorization bearer header', () => {
    // arrange
    const request = makeRequest({ headers: { authorization: 'Bearer some token' } });

    // act
    const token = request.getBearerToken();

    // assert
    expect(token).toBe('some token');
  });
});

describe('null request', () => {
  it('should provide the given token', () => {
    // arrange
    const request = makeNullRequest({ token: 'some token' });

    // act
    const token = request.getBearerToken();

    // assert
    expect(token).toBe('some token');
  });
});
