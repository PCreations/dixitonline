import * as Sentry from '@sentry/node';
import { version } from './package.json';

Sentry.init({
  environment: process.env.NODE_ENV,
  release: version,
  dsn: 'https://980697340f06423f918bf1c3b942845d@o377168.ingest.sentry.io/5198886',
  org: 'pierre-criulanscy-sasu',
});

export const SentryPlugin = {
  requestDidStart() {
    return {
      didEncounterErrors(rc) {
        Sentry.withScope(scope => {
          const { req } = rc.context;
          if (req) {
            scope.addEventProcessor(event => Sentry.Handlers.parseRequest(event, req));
          }

          scope.setTags({
            graphql: rc.operation?.operation ?? 'parse_err',
            graphqlName: rc.operationName ?? rc.request.operationName,
          });

          rc.errors.forEach(error => {
            if (error.path ?? error.name !== 'GraphQLError') {
              scope.setExtras({
                path: error.path,
              });
              Sentry.captureException(error);
            } else {
              scope.setExtras({});
              Sentry.captureMessage(`GraphQLWrongQuery: ${error.message}`);
            }
          });
        });
      },
    };
  },
};
