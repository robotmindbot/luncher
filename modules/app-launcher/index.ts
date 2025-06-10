import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export interface AppInfo {
  name: string;
  packageName: string;
  icon?: string;
}

export interface AppLauncherModule {
  getInstalledApps(): Promise<AppInfo[]>;
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

const AppLauncherWrapper: AppLauncherModule = {
  async getInstalledApps(): Promise<AppInfo[]> {
    if (Platform.OS !== 'android' || !nativeModule) {
      console.warn('AppLauncher native module not available, using mock data');
      return Promise.resolve(mockApps);
    }

    try {
      console.log('Calling native getInstalledApps...');
      return await nativeModule.getInstalledApps();
    } catch (error) {
      console.error('Failed to get installed apps from native module:', error);
      return mockApps;
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