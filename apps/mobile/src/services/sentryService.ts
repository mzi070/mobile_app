import * as Sentry from '@sentry/react-native';

// Replace the placeholder DSN with your real project DSN from sentry.io before
// shipping to production. The DSN is not secret — it is safe to commit.
const SENTRY_DSN = 'https://examplePublicKey@o0.ingest.sentry.io/0';

export function initSentry(): void {
  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
    // Don't send events in development — avoids noise in the Sentry dashboard
    enabled: !__DEV__,
    environment: __DEV__ ? 'development' : 'production',
    // Capture 20 % of sessions for performance tracing in production
    tracesSampleRate: __DEV__ ? 0 : 0.2,
    // Attach JS bundle source maps automatically (works with Hermes + Metro)
    attachStacktrace: true,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30_000,
  });
}
