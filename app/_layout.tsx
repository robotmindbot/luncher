import { getSentryConfig } from "@/config/sentry";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from "@sentry/react-native";
import { isRunningInExpoGo } from "expo";
import { Stack, useNavigationContainerRef, useRouter } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import AppLauncherWrapper from '../modules/app-launcher';

// Keep splash screen visible while we load resources
SplashScreen.preventAutoHideAsync().catch(error => console.error('Failed to keep splash screen visible:', error));

// Font Size Context
export interface HomeApp {
  packageName: string;
  originalName: string;
  nickname?: string;
}

const emptyHomeApp: HomeApp = { packageName: '', originalName: 'select' };

function parseSavedNumber(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = value === null ? NaN : Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function parseHomeApp(value: unknown): HomeApp | null {
  if (!value || typeof value !== 'object') return null;
  const app = value as Record<string, unknown>;
  if (typeof app.packageName !== 'string' || typeof app.originalName !== 'string') return null;
  return {
    packageName: app.packageName,
    originalName: app.originalName,
    ...(typeof app.nickname === 'string' ? { nickname: app.nickname } : {}),
  };
}

function parseSavedHomeApps(value: string | null, count: number): HomeApp[] {
  if (!value) return Array.from({ length: count }, () => ({ ...emptyHomeApp }));
  try {
    const saved: unknown = JSON.parse(value);
    if (!Array.isArray(saved)) throw new Error('Expected an array');
    return Array.from({ length: Math.min(10, Math.max(count, saved.length)) }, (_, index) =>
      parseHomeApp(saved[index]) ?? { ...emptyHomeApp }
    );
  } catch (error) {
    console.error('Failed to parse saved home apps:', error);
    return Array.from({ length: count }, () => ({ ...emptyHomeApp }));
  }
}

function parseSavedSwipeApp(value: string | null): HomeApp {
  if (!value) return { ...emptyHomeApp };
  try {
    return parseHomeApp(JSON.parse(value)) ?? { ...emptyHomeApp };
  } catch (error) {
    console.error('Failed to parse saved swipe app:', error);
    return { ...emptyHomeApp };
  }
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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  // Hide splash screen once config is loaded
  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  const loadConfig = async () => {
    try {
      // Batch all AsyncStorage operations for better performance
      const [
        savedFontSize,
        savedNumHomeApps,
        savedHomeApps,
        savedLeftSwipeApp,
        savedRightSwipeApp
      ] = await Promise.all([
        AsyncStorage.getItem('launcher_font_size'),
        AsyncStorage.getItem('launcher_num_home_apps'),
        AsyncStorage.getItem('launcher_home_apps'),
        AsyncStorage.getItem('launcher_left_swipe_app'),
        AsyncStorage.getItem('launcher_right_swipe_app')
      ]);

      const savedCount = parseSavedNumber(savedNumHomeApps, 0, 0, 10);
      setFontSizeState(parseSavedNumber(savedFontSize, 18, 12, 36));
      setNumHomeAppsState(savedCount);
      setHomeAppsState(parseSavedHomeApps(savedHomeApps, savedCount));
      setLeftSwipeAppState(parseSavedSwipeApp(savedLeftSwipeApp));
      setRightSwipeAppState(parseSavedSwipeApp(savedRightSwipeApp));

    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      // Mark app as ready to hide splash screen
      setIsReady(true);
    }
  };

  const setFontSize = async (size: number) => {
    const safeSize = Number.isInteger(size) ? Math.max(12, Math.min(36, size)) : 18;
    try {
      await AsyncStorage.setItem('launcher_font_size', safeSize.toString());
      setFontSizeState(safeSize);
    } catch (error) {
      console.error('Failed to save font size:', error);
    }
  };

  const setNumHomeApps = async (num: number) => {
    const safeNum = Number.isInteger(num) ? Math.max(0, Math.min(10, num)) : 0;
    try {
      await AsyncStorage.setItem('launcher_num_home_apps', safeNum.toString());
      if (safeNum > homeApps.length) {
        const newHomeApps = [...homeApps, ...Array.from(
          { length: safeNum - homeApps.length }, () => ({ ...emptyHomeApp })
        )];
        await AsyncStorage.setItem('launcher_home_apps', JSON.stringify(newHomeApps));
        setHomeAppsState(newHomeApps);
      }
      setNumHomeAppsState(safeNum);
    } catch (error) {
      console.error('Failed to save num home apps:', error);
    }
  };

  const setHomeApp = async (index: number, app: HomeApp | null) => {
    if (!Number.isInteger(index) || index < 0 || index >= 10) return;
    try {
      const newHomeApps = [...homeApps];
      newHomeApps[index] = (app && parseHomeApp(app)) || { ...emptyHomeApp };
      await AsyncStorage.setItem('launcher_home_apps', JSON.stringify(newHomeApps));
      setHomeAppsState(newHomeApps);
    } catch (error) {
      console.error('Failed to save home app:', error);
    }
  };

  const setLeftSwipeApp = async (app: HomeApp) => {
    try {
      const savedApp = parseHomeApp(app) ?? { ...emptyHomeApp };
      await AsyncStorage.setItem('launcher_left_swipe_app', JSON.stringify(savedApp));
      setLeftSwipeAppState(savedApp);
    } catch (error) {
      console.error('Failed to save left swipe app:', error);
    }
  };

  const setRightSwipeApp = async (app: HomeApp) => {
    try {
      const savedApp = parseHomeApp(app) ?? { ...emptyHomeApp };
      await AsyncStorage.setItem('launcher_right_swipe_app', JSON.stringify(savedApp));
      setRightSwipeAppState(savedApp);
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

// Initialize Sentry conditionally and lazily
const initializeSentry = () => {
  // Only initialize Sentry if not in development or if explicitly enabled
  if (!__DEV__ || process.env.EXPO_PUBLIC_ENABLE_SENTRY === 'true') {
    // Construct a new integration instance for navigation tracking
    const navigationIntegration = Sentry.reactNavigationIntegration({
      enableTimeToInitialDisplay: !isRunningInExpoGo(),
    });

    Sentry.init({
      dsn: sentryConfig.dsn,
      debug: sentryConfig.debug,
      tracesSampleRate: sentryConfig.tracesSampleRate,
      integrations: [navigationIntegration],
      enableNativeFramesTracking: sentryConfig.enableNativeFramesTracking && !isRunningInExpoGo(),
      beforeSend: (event) => event,
    });

    return navigationIntegration;
  }
  return null;
};

// Lazy initialize Sentry
const navigationIntegration = initializeSentry();

function RootLayoutNav() {
  const ref = useNavigationContainerRef();
  const router = useRouter();

  useEffect(() => {
    const subscription = AppLauncherWrapper.addHomeIntentListener(() => router.dismissAll());
    return () => subscription?.remove();
  }, [router]);

  useEffect(() => {
    if (ref?.current) {
      navigationIntegration?.registerNavigationContainer(ref);
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
