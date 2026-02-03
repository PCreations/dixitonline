// Analytics Provider Abstraction
export { AnalyticsProvider, type AnalyticsEvent } from './analytics-provider.js';

// Provider Implementations
export { FirebaseAnalyticsProvider } from './infra/firebase-analytics-provider.js';
export { ConsoleAnalyticsProvider } from './infra/console-analytics-provider.js';
export { NoopAnalyticsProvider } from './infra/noop-analytics-provider.js';

// Consumer
export {
  AnalyticsConsumer,
  AnalyticsConsumerLive,
  AnalyticsConsumerTest,
} from './analytics-consumer.js';
