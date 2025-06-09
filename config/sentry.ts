export interface SentryConfig {
  dsn: string;
  organization: string;
  project: string;
  url: string;
  debug: boolean;
  tracesSampleRate: number;
  enableNativeFramesTracking: boolean;
}

// Sentry Configuration
// Update these values with your actual Sentry project details
export const sentryConfig: SentryConfig = {
  // Replace with your actual Sentry DSN from your project settings
  dsn: "https://4c2a2f65a26c2c9932cbe84d582370de@o4507551667257344.ingest.de.sentry.io/4509448721268816",

  // Replace with your Sentry organization slug
  organization: "your-org-slug",

  // Replace with your Sentry project name
  project: "waza",

  // Sentry URL (use this if you have a self-hosted instance)
  url: "https://sentry.io/",

  // Debug mode - set to false in production
  debug: __DEV__,

  // Traces sample rate (1.0 = 100%, adjust for production)
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,

  // Enable native frames tracking
  enableNativeFramesTracking: true,
};

// Environment-based configuration
export const getSentryConfig = (): SentryConfig => {
  return {
    ...sentryConfig,
    // Override with environment variables if available
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || sentryConfig.dsn,
    organization: process.env.SENTRY_ORG || sentryConfig.organization,
    project: process.env.SENTRY_PROJECT || sentryConfig.project,
    url: process.env.SENTRY_URL || sentryConfig.url,
  };
};