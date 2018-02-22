/* eslint-disable */
import { createWorker, handleSubscriptions } from 'apollo-link-webworker';

import schema from './schema'; // your graphql schema
//import context from './context'; // your graphql context
import pubsub from './pubsub'; // a PubSub instance from graphql-subscriptions package for example

createWorker({
  schema,
  context: {},
});

self.onmessage = message =>
  handleSubscriptions({
    self,
    message,
    schema,
    context: {},
    pubsub,
  });
