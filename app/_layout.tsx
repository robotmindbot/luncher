import { getSentryConfig } from "@/config/sentry";
import * as Sentry from "@sentry/react-native";
import { isRunningInExpoGo } from "expo";
import { Stack, useNavigationContainerRef } from "expo-router";
import { useEffect } from "react";

// Get Sentry configuration
const sentryConfig = getSentryConfig();

// Construct a new integration instance for navigation tracking
const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

// Initialize Sentry
Sentry.init({
  dsn: sentryConfig.dsn,
  debug: sentryConfig.debug,
  tracesSampleRate: sentryConfig.tracesSampleRate,
  integrations: [
    navigationIntegration,
  ],
  enableNativeFramesTracking: sentryConfig.enableNativeFramesTracking && !isRunningInExpoGo(),
  // Adds more context data to events (IP address, cookies, user, etc.)
  sendDefaultPii: true,
});

function RootLayout() {
  // Capture the NavigationContainer ref and register it with the integration
  const ref = useNavigationContainerRef();

  useEffect(() => {
    if (ref?.current) {
      navigationIntegration.registerNavigationContainer(ref);
    }
  }, [ref]);

  return <Stack />;
}

// Wrap the Root Layout route component with `Sentry.wrap` to capture gesture info and profiling data
export default Sentry.wrap(RootLayout);
