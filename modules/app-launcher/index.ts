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

// In-memory cache for faster access during the session
let memoryCache: AppInfo[] | null = null;

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
      // Check in-memory cache first (fastest)
      if (memoryCache && memoryCache.length > 0) {
        console.log('Using in-memory cache:', memoryCache.length, 'apps');
        return memoryCache;
      }

      // Check AsyncStorage cache
      const cachedAppsStr = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedAppsStr) {
        const cachedApps = JSON.parse(cachedAppsStr);
        if (cachedApps && cachedApps.length > 0) {
          // Update in-memory cache
          memoryCache = cachedApps;
          console.log('Using AsyncStorage cache:', cachedApps.length, 'apps');
          return cachedApps;
        }
      }

      console.log('No cache found');
      return [];
    } catch (error) {
      console.error('Failed to get cached apps:', error);

      // If it's a cache corruption error, clear all caches
      if (error instanceof Error && error.message.includes('Row too big')) {
        console.log('Cache corrupted, clearing all caches...');
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
      // Store full apps in memory cache (including icons)
      memoryCache = apps;

      // Store only essential data in AsyncStorage (exclude icons to reduce size)
      const lightweightApps = apps.map(app => ({
        name: app.name,
        packageName: app.packageName
        // Exclude icon to prevent "Row too big" error
      }));

      // Update AsyncStorage cache
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(lightweightApps));

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

      // Clear AsyncStorage cache
      await AsyncStorage.removeItem(CACHE_KEY);

      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  },

  async launchApp(packageName: string): Promise<boolean> {
    if (Platform.OS !== 'android' || !nativeModule) {
      if (__DEV__) console.warn('AppLauncher native module not available, simulating app launch');
      return Promise.resolve(true);
    }

    try {
      const result = await nativeModule.launchApp(packageName);
      if (result === false) {
        throw new Error(`Failed to launch app: ${packageName} - No launch intent found`);
      }
      return result;
    } catch (error) {
      if (__DEV__) console.error('Failed to launch app from native module:', error);
      throw error;
    }
  }
};

export default AppLauncherWrapper;