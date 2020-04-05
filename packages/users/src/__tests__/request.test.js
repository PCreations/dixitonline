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
  it('should return null if there is no authorization header', () => {
    // arrange
    const request = makeRequest({
      headers: {},
    });

    // act
    const token = request.getBearerToken();

    // assert
    expect(token).toBeNull();
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
