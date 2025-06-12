import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export interface AppInfo {
  name: string;
  packageName: string;
  icon?: string;
}

export interface AppLauncherModule {
  getInstalledApps(): Promise<AppInfo[]>;
  getCachedApps(): Promise<AppInfo[]>;
  refreshInstalledApps(): Promise<AppInfo[]>;
  updateCache(apps: AppInfo[]): Promise<void>;
  clearCache(): Promise<void>;
  launchApp(packageName: string): Promise<boolean>;
}

// Use Expo modules API to get the native module
const AppLauncher = requireNativeModule('AppLauncher');

// Mock data for development/testing
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

let nativeModule: any = null;

try {
  nativeModule = AppLauncher;
} catch (error) {
  console.warn('AppLauncher native module not available:', error);
}

// Cache configuration
const CACHE_KEY = 'launcher_installed_apps';
const CACHE_TIMESTAMP_KEY = 'launcher_apps_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// In-memory cache for faster access during the session
let memoryCache: AppInfo[] | null = null;
let memoryCacheTimestamp: number | null = null;

const AppLauncherWrapper: AppLauncherModule = {
  // Original method - now with caching
  async getInstalledApps(): Promise<AppInfo[]> {
    console.log('getInstalledApps called - checking cache first...');

    // Try to get from cache first
    const cachedApps = await this.getCachedApps();
    if (cachedApps.length > 0) {
      console.log('Using cached apps:', cachedApps.length);
      return cachedApps;
    }

    // If no cache, refresh from native
    console.log('No valid cache found, refreshing from native...');
    return await this.refreshInstalledApps();
  },

  // Get cached apps without calling native module
  async getCachedApps(): Promise<AppInfo[]> {
    try {
      // Check in-memory cache first
      if (memoryCache && memoryCacheTimestamp) {
        const now = Date.now();
        if (now - memoryCacheTimestamp < CACHE_DURATION) {
          console.log('Using in-memory cache');
          return memoryCache;
        } else {
          console.log('In-memory cache expired');
          memoryCache = null;
          memoryCacheTimestamp = null;
        }
      }

      // Check AsyncStorage cache
      const [cachedAppsStr, timestampStr] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEY),
        AsyncStorage.getItem(CACHE_TIMESTAMP_KEY)
      ]);

      if (cachedAppsStr && timestampStr) {
        const timestamp = parseInt(timestampStr, 10);
        const now = Date.now();

        if (now - timestamp < CACHE_DURATION) {
          const cachedApps = JSON.parse(cachedAppsStr);
          // Note: AsyncStorage cache doesn't include icons to avoid size issues
          // Update in-memory cache (will be lightweight until next refresh)
          memoryCache = cachedApps;
          memoryCacheTimestamp = timestamp;
          console.log('Using AsyncStorage cache (without icons)');
          return cachedApps;
        } else {
          console.log('AsyncStorage cache expired');
          // Clear expired cache
          await Promise.all([
            AsyncStorage.removeItem(CACHE_KEY),
            AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY)
          ]);
        }
      }

      return [];
    } catch (error) {
      console.error('Failed to get cached apps:', error);

      // If it's a cache corruption error, clear the cache
      if (error instanceof Error && error.message.includes('Row too big')) {
        console.log('Cache corrupted, clearing...');
        await this.clearCache();
      }

      return [];
    }
  },

  // Refresh apps from native module and update cache
  async refreshInstalledApps(): Promise<AppInfo[]> {
    if (Platform.OS !== 'android' || !nativeModule) {
      console.warn('AppLauncher native module not available, using mock data');
      const sortedMockApps = mockApps.sort((a, b) => a.name.localeCompare(b.name));
      await this.updateCache(sortedMockApps);
      return sortedMockApps;
    }

    try {
      console.log('Calling native getInstalledApps...');
      const apps = await nativeModule.getInstalledApps();
      const sortedApps = apps.sort((a: AppInfo, b: AppInfo) => a.name.localeCompare(b.name));

      // Update cache
      await this.updateCache(sortedApps);

      console.log('Apps refreshed and cached:', sortedApps.length);
      return sortedApps;
    } catch (error) {
      console.error('Failed to get installed apps from native module:', error);
      const sortedMockApps = mockApps.sort((a, b) => a.name.localeCompare(b.name));
      await this.updateCache(sortedMockApps);
      return sortedMockApps;
    }
  },

    // Helper method to update cache
  async updateCache(apps: AppInfo[]): Promise<void> {
    try {
      const timestamp = Date.now();

      // Store full apps in memory cache (including icons)
      memoryCache = apps;
      memoryCacheTimestamp = timestamp;

      // Store only essential data in AsyncStorage (exclude icons to reduce size)
      const lightweightApps = apps.map(app => ({
        name: app.name,
        packageName: app.packageName
        // Exclude icon to prevent "Row too big" error
      }));

      await Promise.all([
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(lightweightApps)),
        AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp.toString())
      ]);

      console.log('Cache updated successfully with', lightweightApps.length, 'apps');
    } catch (error) {
      console.error('Failed to update cache:', error);
    }
  },

  // Clear cache method
  async clearCache(): Promise<void> {
    try {
      // Clear memory cache
      memoryCache = null;
      memoryCacheTimestamp = null;

      // Clear AsyncStorage cache
      await Promise.all([
        AsyncStorage.removeItem(CACHE_KEY),
        AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY)
      ]);

      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  },

  async launchApp(packageName: string): Promise<boolean> {
    if (Platform.OS !== 'android' || !nativeModule) {
      console.warn('AppLauncher native module not available, simulating app launch');
      return Promise.resolve(true);
    }

    try {
      console.log('Calling native launchApp for:', packageName);
      const result = await nativeModule.launchApp(packageName);
      if (result === false) {
        throw new Error(`Failed to launch app: ${packageName} - No launch intent found`);
      }
      return result;
    } catch (error) {
      console.error('Failed to launch app from native module:', error);
      throw error;
    }
  }
};

export default AppLauncherWrapper;