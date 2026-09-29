import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireNativeModule, type EventSubscription } from 'expo-modules-core';
import { PermissionsAndroid, Platform } from 'react-native';

export interface AppInfo {
  name: string;
  packageName: string;
}

interface NativeAppLauncher {
  getInstalledApps(): Promise<AppInfo[]>;
  launchApp(packageName: string): boolean;
  finishKeyboardShowImmediately(): boolean;
  getNextCalendarAppointment(keywords: string[]): Promise<{ eventId: number; title: string; begin: number; end: number; allDay: boolean } | null>;
  openCalendarEvent(eventId: number, begin: number, end: number): boolean;
  uninstallApp(packageName: string): boolean;
  addListener(eventName: 'onHomeIntent', listener: () => void): EventSubscription;
}

const CACHE_KEY = 'launcher_installed_apps';
const CACHE_MAX_AGE = 5 * 60 * 1000;
const LAUNCHER_PACKAGE_NAME = 'baby.robotmind.luncher';
const mockApps: AppInfo[] = [
  { name: 'Settings', packageName: 'com.android.settings' },
  { name: 'Calculator', packageName: 'com.android.calculator2' },
  { name: 'Camera', packageName: 'com.android.camera' },
  { name: 'Gallery', packageName: 'com.android.gallery3d' },
  { name: 'Clock', packageName: 'com.android.deskclock' },
  { name: 'Phone', packageName: 'com.android.phone' },
  { name: 'Messages', packageName: 'com.android.messaging' },
  { name: 'Contacts', packageName: 'com.android.contacts' },
];

let nativeModule: NativeAppLauncher | null = null;
let memoryCache: AppInfo[] | null = null;
let cacheUpdatedAt = 0;

try {
  nativeModule = requireNativeModule('AppLauncher') as NativeAppLauncher;
} catch (error) {
  if (__DEV__) console.warn('AppLauncher native module unavailable:', error);
}

function normalizeApps(value: unknown): AppInfo[] {
  if (!Array.isArray(value)) throw new Error('AppLauncher returned an invalid app list');

  const apps = new Map<string, AppInfo>();
  for (const item of value) {
    if (typeof item?.name !== 'string' || typeof item?.packageName !== 'string' || !item.packageName) continue;
    if (item.packageName !== LAUNCHER_PACKAGE_NAME) {
      apps.set(item.packageName, { name: item.name, packageName: item.packageName });
    }
  }
  return [...apps.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function readCache(): Promise<AppInfo[]> {
  if (memoryCache) return memoryCache;

  let saved: string | null;
  try {
    saved = await AsyncStorage.getItem(CACHE_KEY);
  } catch (error) {
    console.warn('Could not read the app cache:', error);
    return [];
  }
  if (!saved) return [];

  try {
    const cached: unknown = JSON.parse(saved);
    if (Array.isArray(cached)) {
      memoryCache = normalizeApps(cached);
    } else if (cached && typeof cached === 'object') {
      const data = cached as { apps?: unknown; updatedAt?: unknown };
      memoryCache = normalizeApps(data.apps);
      cacheUpdatedAt = typeof data.updatedAt === 'number' ? data.updatedAt : 0;
    } else {
      throw new Error('Expected an app list');
    }
    return memoryCache;
  } catch (error) {
    console.warn('Discarding invalid app cache:', error);
    await AsyncStorage.removeItem(CACHE_KEY);
    return [];
  }
}

async function writeCache(apps: AppInfo[]): Promise<void> {
  memoryCache = apps;
  cacheUpdatedAt = Date.now();
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ apps, updatedAt: cacheUpdatedAt }));
  } catch (error) {
    console.warn('Could not save the app cache:', error);
  }
}

async function refreshInstalledApps(): Promise<AppInfo[]> {
  if (Platform.OS !== 'android') {
    const apps = __DEV__ ? normalizeApps(mockApps) : [];
    await writeCache(apps);
    return apps;
  }
  if (!nativeModule) throw new Error('AppLauncher native module is missing from this Android build');

  const apps = normalizeApps(await nativeModule.getInstalledApps());
  await writeCache(apps);
  return apps;
}

const AppLauncherWrapper = {
  finishKeyboardShowImmediately(): void {
    if (Platform.OS === 'android') nativeModule?.finishKeyboardShowImmediately();
  },

  async requestCalendarPermission(): Promise<boolean> {
    if (Platform.OS !== 'android' || !nativeModule) return false;
    const permission = PermissionsAndroid.PERMISSIONS.READ_CALENDAR;
    if (await PermissionsAndroid.check(permission)) return true;
    return (await PermissionsAndroid.request(permission, {
      title: 'Calendar access',
      message: "Luncher needs calendar access to show today's next appointment on the home screen.",
      buttonPositive: 'Allow',
      buttonNegative: 'Cancel',
    })) === PermissionsAndroid.RESULTS.GRANTED;
  },

  async getNextCalendarAppointment(keywords: string[]) {
    if (Platform.OS !== 'android' || !nativeModule) return null;
    return nativeModule.getNextCalendarAppointment(keywords);
  },

  openCalendarEvent(event: { eventId: number; begin: number; end: number }): boolean {
    return Platform.OS === 'android' && !!nativeModule?.openCalendarEvent(event.eventId, event.begin, event.end);
  },

  uninstallApp(packageName: string): boolean {
    return Platform.OS === 'android' && !!nativeModule?.uninstallApp(packageName);
  },

  addHomeIntentListener(listener: () => void): EventSubscription | undefined {
    return nativeModule?.addListener('onHomeIntent', listener);
  },

  async getInstalledApps(): Promise<AppInfo[]> {
    const cachedApps = await readCache();
    // ponytail: app installs may take up to five minutes to appear; pull-to-refresh bypasses the cache.
    return Date.now() - cacheUpdatedAt < CACHE_MAX_AGE ? cachedApps : refreshInstalledApps();
  },

  refreshInstalledApps,

  async launchApp(packageName: string): Promise<void> {
    if (Platform.OS !== 'android' || !nativeModule) {
      throw new Error('Launching installed apps is supported only in the Android build');
    }
    if (!nativeModule.launchApp(packageName)) {
      throw new Error(`No launch intent found for ${packageName}`);
    }
  },
};

export default AppLauncherWrapper;
