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
  alias?: string;
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
    ...(typeof app.alias === 'string' ? { alias: app.alias } :
      typeof app.nickname === 'string' ? { alias: app.nickname } : {}),
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

function parseAppAliases(value: string | null): Record<string, string> {
  if (!value) return {};
  try {
    const saved: unknown = JSON.parse(value);
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
    return Object.fromEntries(Object.entries(saved).filter(([packageName, alias]) =>
      packageName.length > 0 && typeof alias === 'string' && alias.trim().length > 0
    ).map(([packageName, alias]) => [packageName, (alias as string).trim()]));
  } catch (error) {
    console.error('Failed to parse app aliases:', error);
    return {};
  }
}

function applyAppAliases(app: HomeApp, aliases: Record<string, string>): HomeApp {
  const alias = aliases[app.packageName];
  return { ...app, ...(alias ? { alias } : { alias: undefined }) };
}

interface FontSizeContextType {
  fontSize: number;
  setFontSize: (size: number) => void;
  numHomeApps: number;
  setNumHomeApps: (num: number) => void;
  homeApps: HomeApp[];
  appAliases: Record<string, string>;
  setAppAlias: (packageName: string, alias: string) => void;
  setHomeApp: (index: number, app: HomeApp | null) => void;
  leftSwipeApp: HomeApp;
  rightSwipeApp: HomeApp;
  downSwipeApp: HomeApp;
  setLeftSwipeApp: (app: HomeApp) => void;
  setRightSwipeApp: (app: HomeApp) => void;
  setDownSwipeApp: (app: HomeApp) => void;
  showTime: boolean;
  setShowTime: (show: boolean) => void;
  showDate: boolean;
  setShowDate: (show: boolean) => void;
  chineseDate: boolean;
  setChineseDate: (chinese: boolean) => void;
  showNextAppointment: boolean;
  setShowNextAppointment: (show: boolean) => void;
  calendarFilterKeywords: string;
  setCalendarFilterKeywords: (keywords: string) => void;
}

const FontSizeContext = createContext<FontSizeContextType>({
  fontSize: 18,
  setFontSize: () => {},
  numHomeApps: 0,
  setNumHomeApps: () => {},
  homeApps: [],
  appAliases: {},
  setAppAlias: () => {},
  setHomeApp: () => {},
  leftSwipeApp: { packageName: '', originalName: 'select' },
  rightSwipeApp: { packageName: '', originalName: 'select' },
  downSwipeApp: { packageName: '', originalName: 'select' },
  setLeftSwipeApp: () => {},
  setRightSwipeApp: () => {},
  setDownSwipeApp: () => {},
  showTime: false,
  setShowTime: () => {},
  showDate: false,
  setShowDate: () => {},
  chineseDate: false,
  setChineseDate: () => {},
  showNextAppointment: false,
  setShowNextAppointment: () => {},
  calendarFilterKeywords: '',
  setCalendarFilterKeywords: () => {},
});

export const useFontSize = () => useContext(FontSizeContext);

function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState(18);
  const [numHomeApps, setNumHomeAppsState] = useState(0);
  const [homeApps, setHomeAppsState] = useState<HomeApp[]>([]);
  const [appAliases, setAppAliasesState] = useState<Record<string, string>>({});
  const setAppAlias = async (packageName: string, value: string) => {
    if (!packageName) return;
    const aliases = { ...appAliases };
    const alias = value.trim();
    if (alias) aliases[packageName] = alias;
    else delete aliases[packageName];
    try {
      await AsyncStorage.setItem('launcher_app_aliases', JSON.stringify(aliases));
      setAppAliasesState(aliases);
      setHomeAppsState(homeApps.map(app => applyAppAliases(app, aliases)));
      setLeftSwipeAppState(applyAppAliases(leftSwipeApp, aliases));
      setRightSwipeAppState(applyAppAliases(rightSwipeApp, aliases));
      setDownSwipeAppState(applyAppAliases(downSwipeApp, aliases));
    } catch (error) {
      console.error('Failed to save app alias:', error);
    }
  };
  const [leftSwipeApp, setLeftSwipeAppState] = useState<HomeApp>({ packageName: '', originalName: 'select' });
  const [rightSwipeApp, setRightSwipeAppState] = useState<HomeApp>({ packageName: '', originalName: 'select' });
  const [downSwipeApp, setDownSwipeAppState] = useState<HomeApp>({ packageName: '', originalName: 'select' });
  const [showTime, setShowTimeState] = useState(false);
  const [showDate, setShowDateState] = useState(false);
  const [chineseDate, setChineseDateState] = useState(false);
  const [showNextAppointment, setShowNextAppointmentState] = useState(false);
  const [calendarFilterKeywords, setCalendarFilterKeywordsState] = useState('');
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
      const savedValues = await AsyncStorage.multiGet([
        'launcher_font_size',
        'launcher_num_home_apps',
        'launcher_home_apps',
        'launcher_left_swipe_app',
        'launcher_right_swipe_app',
        'launcher_down_swipe_app',
        'launcher_show_time',
        'launcher_show_date',
        'launcher_chinese_date',
        'launcher_show_next_appointment',
        'launcher_calendar_filter_keywords',
        'launcher_app_nicknames',
        'launcher_app_aliases',
      ]);
      const [
        savedFontSize,
        savedNumHomeApps,
        savedHomeApps,
        savedLeftSwipeApp,
        savedRightSwipeApp,
        savedDownSwipeApp,
        savedShowTime,
        savedShowDate,
        savedChineseDate,
        savedNextAppointment,
        savedCalendarFilterKeywords,
        savedAppNicknames,
        savedAppAliases,
      ] = savedValues.map(([, value]) => value);

      const savedCount = parseSavedNumber(savedNumHomeApps, 0, 0, 10);
      setFontSizeState(parseSavedNumber(savedFontSize, 18, 12, 36));
      setNumHomeAppsState(savedCount);
      const loadedHomeApps = parseSavedHomeApps(savedHomeApps, savedCount);
      const loadedLeftSwipeApp = parseSavedSwipeApp(savedLeftSwipeApp);
      const loadedRightSwipeApp = parseSavedSwipeApp(savedRightSwipeApp);
      const loadedDownSwipeApp = parseSavedSwipeApp(savedDownSwipeApp);
      const aliases = { ...parseAppAliases(savedAppNicknames), ...parseAppAliases(savedAppAliases) };
      for (const app of [...loadedHomeApps, loadedLeftSwipeApp, loadedRightSwipeApp, loadedDownSwipeApp]) {
        if (!aliases[app.packageName] && app.alias?.trim()) aliases[app.packageName] = app.alias.trim();
      }
      setAppAliasesState(aliases);
      setHomeAppsState(loadedHomeApps.map(app => applyAppAliases(app, aliases)));
      setLeftSwipeAppState(applyAppAliases(loadedLeftSwipeApp, aliases));
      setRightSwipeAppState(applyAppAliases(loadedRightSwipeApp, aliases));
      setDownSwipeAppState(applyAppAliases(loadedDownSwipeApp, aliases));
      if (Object.keys(aliases).length) {
        await AsyncStorage.setItem('launcher_app_aliases', JSON.stringify(aliases));
      }
      setShowTimeState(savedShowTime === 'true');
      setShowDateState(savedShowDate === 'true');
      setChineseDateState(savedChineseDate === 'true');
      setShowNextAppointmentState(savedNextAppointment === 'true');
      setCalendarFilterKeywordsState(savedCalendarFilterKeywords?.split(',').map(keyword => keyword.trim()).filter(Boolean).join(', ') ?? '');

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
      if (safeNum > numHomeApps) {
        const newHomeApps = [...homeApps];
        newHomeApps.splice(
          Math.max(0, numHomeApps - 1),
          0,
          ...Array.from({ length: safeNum - numHomeApps }, () => ({ ...emptyHomeApp }))
        );
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
      const newAliases = { ...appAliases };
      const parsedApp = app && parseHomeApp(app);
      if (parsedApp?.packageName && typeof app?.alias === 'string') {
        const alias = app.alias.trim();
        if (alias) newAliases[parsedApp.packageName] = alias;
        else delete newAliases[parsedApp.packageName];
      }
      const newHomeApps = homeApps.map(saved => applyAppAliases(saved, newAliases));
      newHomeApps[index] = parsedApp ? applyAppAliases(parsedApp, newAliases) : { ...emptyHomeApp };
      const newLeftSwipeApp = applyAppAliases(leftSwipeApp, newAliases);
      const newRightSwipeApp = applyAppAliases(rightSwipeApp, newAliases);
      const newDownSwipeApp = applyAppAliases(downSwipeApp, newAliases);
      await AsyncStorage.multiSet([
        ['launcher_home_apps', JSON.stringify(newHomeApps)],
        ['launcher_app_aliases', JSON.stringify(newAliases)],
        ['launcher_left_swipe_app', JSON.stringify(newLeftSwipeApp)],
        ['launcher_right_swipe_app', JSON.stringify(newRightSwipeApp)],
        ['launcher_down_swipe_app', JSON.stringify(newDownSwipeApp)],
      ]);
      setHomeAppsState(newHomeApps);
      setAppAliasesState(newAliases);
      setLeftSwipeAppState(newLeftSwipeApp);
      setRightSwipeAppState(newRightSwipeApp);
      setDownSwipeAppState(newDownSwipeApp);
    } catch (error) {
      console.error('Failed to save home app:', error);
    }
  };

  const setLeftSwipeApp = async (app: HomeApp) => {
    try {
      const savedApp = applyAppAliases(parseHomeApp(app) ?? { ...emptyHomeApp }, appAliases);
      await AsyncStorage.setItem('launcher_left_swipe_app', JSON.stringify(savedApp));
      setLeftSwipeAppState(savedApp);
    } catch (error) {
      console.error('Failed to save left swipe app:', error);
    }
  };

  const setRightSwipeApp = async (app: HomeApp) => {
    try {
      const savedApp = applyAppAliases(parseHomeApp(app) ?? { ...emptyHomeApp }, appAliases);
      await AsyncStorage.setItem('launcher_right_swipe_app', JSON.stringify(savedApp));
      setRightSwipeAppState(savedApp);
    } catch (error) {
      console.error('Failed to save right swipe app:', error);
    }
  };

  const setDownSwipeApp = async (app: HomeApp) => {
    try {
      const savedApp = applyAppAliases(parseHomeApp(app) ?? { ...emptyHomeApp }, appAliases);
      await AsyncStorage.setItem('launcher_down_swipe_app', JSON.stringify(savedApp));
      setDownSwipeAppState(savedApp);
    } catch (error) {
      console.error('Failed to save down swipe app:', error);
    }
  };

  const saveDisplayOption = async (key: string, value: boolean, update: (value: boolean) => void) => {
    try {
      await AsyncStorage.setItem(key, String(value));
      update(value);
    } catch (error) {
      console.error('Failed to save home display option:', error);
    }
  };

  const setCalendarFilterKeywords = async (keywords: string) => {
    const normalized = keywords.split(',').map(keyword => keyword.trim()).filter(Boolean).join(', ');
    try {
      await AsyncStorage.setItem('launcher_calendar_filter_keywords', normalized);
      setCalendarFilterKeywordsState(normalized);
    } catch (error) {
      console.error('Failed to save calendar filter keywords:', error);
    }
  };

  return (
    <FontSizeContext.Provider value={{
      fontSize,
      setFontSize,
      numHomeApps,
      setNumHomeApps,
      homeApps,
      appAliases,
      setAppAlias,
      setHomeApp,
      leftSwipeApp,
      rightSwipeApp,
      downSwipeApp,
      setLeftSwipeApp,
      setRightSwipeApp,
      setDownSwipeApp,
      showTime,
      setShowTime: (value) => saveDisplayOption('launcher_show_time', value, setShowTimeState),
      showDate,
      setShowDate: (value) => saveDisplayOption('launcher_show_date', value, setShowDateState),
      chineseDate,
      setChineseDate: (value) => saveDisplayOption('launcher_chinese_date', value, setChineseDateState),
      showNextAppointment,
      setShowNextAppointment: (value) => saveDisplayOption('launcher_show_next_appointment', value, setShowNextAppointmentState),
      calendarFilterKeywords,
      setCalendarFilterKeywords,
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
