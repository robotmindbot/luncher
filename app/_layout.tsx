import { getSentryConfig } from "@/config/sentry";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from "@sentry/react-native";
import { isRunningInExpoGo } from "expo";
import { Stack, useNavigationContainerRef } from "expo-router";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

// Font Size Context
interface HomeApp {
  packageName: string;
  originalName: string;
  nickname?: string;
}

interface FontSizeContextType {
  fontSize: number;
  setFontSize: (size: number) => void;
  numHomeApps: number;
  setNumHomeApps: (num: number) => void;
  homeApps: HomeApp[];
  setHomeApp: (index: number, app: HomeApp | null) => void;
  leftSwipeApp: HomeApp;
  rightSwipeApp: HomeApp;
  setLeftSwipeApp: (app: HomeApp) => void;
  setRightSwipeApp: (app: HomeApp) => void;
}

const FontSizeContext = createContext<FontSizeContextType>({
  fontSize: 18,
  setFontSize: () => {},
  numHomeApps: 0,
  setNumHomeApps: () => {},
  homeApps: [],
  setHomeApp: () => {},
  leftSwipeApp: { packageName: '', originalName: 'select' },
  rightSwipeApp: { packageName: '', originalName: 'select' },
  setLeftSwipeApp: () => {},
  setRightSwipeApp: () => {},
});

export const useFontSize = () => useContext(FontSizeContext);

function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState(18);
  const [numHomeApps, setNumHomeAppsState] = useState(0);
  const [homeApps, setHomeAppsState] = useState<HomeApp[]>([]);
  const [leftSwipeApp, setLeftSwipeAppState] = useState<HomeApp>({ packageName: '', originalName: 'select' });
  const [rightSwipeApp, setRightSwipeAppState] = useState<HomeApp>({ packageName: '', originalName: 'select' });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedFontSize = await AsyncStorage.getItem('launcher_font_size');
      const savedNumHomeApps = await AsyncStorage.getItem('launcher_num_home_apps');
      const savedHomeApps = await AsyncStorage.getItem('launcher_home_apps');
      const savedLeftSwipeApp = await AsyncStorage.getItem('launcher_left_swipe_app');
      const savedRightSwipeApp = await AsyncStorage.getItem('launcher_right_swipe_app');

      if (savedFontSize) {
        setFontSizeState(parseInt(savedFontSize, 10));
      }
      if (savedNumHomeApps) {
        setNumHomeAppsState(parseInt(savedNumHomeApps, 10));
      }
      if (savedHomeApps) {
        setHomeAppsState(JSON.parse(savedHomeApps));
      }
      if (savedLeftSwipeApp) {
        setLeftSwipeAppState(JSON.parse(savedLeftSwipeApp));
      }
      if (savedRightSwipeApp) {
        setRightSwipeAppState(JSON.parse(savedRightSwipeApp));
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const setFontSize = async (size: number) => {
    try {
      await AsyncStorage.setItem('launcher_font_size', size.toString());
      setFontSizeState(size);
    } catch (error) {
      console.error('Failed to save font size:', error);
    }
  };

  const setNumHomeApps = async (num: number) => {
    try {
      await AsyncStorage.setItem('launcher_num_home_apps', num.toString());
      setNumHomeAppsState(num);

      // Adjust homeApps array size
      const newHomeApps = [...homeApps];
      if (num > newHomeApps.length) {
        // Add empty slots
        while (newHomeApps.length < num) {
          newHomeApps.push({ packageName: '', originalName: 'select' });
        }
      } else {
        // Remove excess slots
        newHomeApps.splice(num);
      }
      setHomeAppsState(newHomeApps);
      await AsyncStorage.setItem('launcher_home_apps', JSON.stringify(newHomeApps));
    } catch (error) {
      console.error('Failed to save num home apps:', error);
    }
  };

  const setHomeApp = async (index: number, app: HomeApp | null) => {
    try {
      const newHomeApps = [...homeApps];
      if (app) {
        newHomeApps[index] = app;
      } else {
        newHomeApps[index] = { packageName: '', originalName: 'select' };
      }
      setHomeAppsState(newHomeApps);
      await AsyncStorage.setItem('launcher_home_apps', JSON.stringify(newHomeApps));
    } catch (error) {
      console.error('Failed to save home app:', error);
    }
  };

  const setLeftSwipeApp = async (app: HomeApp) => {
    try {
      setLeftSwipeAppState(app);
      await AsyncStorage.setItem('launcher_left_swipe_app', JSON.stringify(app));
    } catch (error) {
      console.error('Failed to save left swipe app:', error);
    }
  };

  const setRightSwipeApp = async (app: HomeApp) => {
    try {
      setRightSwipeAppState(app);
      await AsyncStorage.setItem('launcher_right_swipe_app', JSON.stringify(app));
    } catch (error) {
      console.error('Failed to save right swipe app:', error);
    }
  };

  return (
    <FontSizeContext.Provider value={{
      fontSize,
      setFontSize,
      numHomeApps,
      setNumHomeApps,
      homeApps,
      setHomeApp,
      leftSwipeApp,
      rightSwipeApp,
      setLeftSwipeApp,
      setRightSwipeApp,
    }}>
      {children}
    </FontSizeContext.Provider>
  );
}

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
  // Adds more context to errors
  beforeSend: (event) => {
    // You can filter or modify events here
    return event;
  },
});

function RootLayoutNav() {
  const ref = useNavigationContainerRef();

  useEffect(() => {
    if (ref?.current) {
      navigationIntegration.registerNavigationContainer(ref);
    }
  }, [ref]);

  return (
    <FontSizeProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="config" options={{ headerShown: false }} />
      </Stack>
    </FontSizeProvider>
  );
}

export default Sentry.wrap(RootLayoutNav);
