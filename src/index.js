import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from 'react-apollo';

import client from './client';
import SignupForm from './SignupForm';

ReactDOM.render(
  <ApolloProvider client={client}>
    <SignupForm />
  </ApolloProvider>,
  document.getElementById('root'),
);
