import { NativeModules, Platform } from 'react-native';

export interface AppInfo {
  name: string;
  packageName: string;
  icon?: string;
}

export interface AppLauncherModule {
  getInstalledApps(): Promise<AppInfo[]>;
  launchApp(packageName: string): Promise<boolean>;
}

const { AppLauncher } = NativeModules;

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

const AppLauncherWrapper: AppLauncherModule = {
  async getInstalledApps(): Promise<AppInfo[]> {
    if (Platform.OS !== 'android' || !AppLauncher) {
      console.warn('AppLauncher native module not available, using mock data');
      return Promise.resolve(mockApps);
    }

    try {
      return await AppLauncher.getInstalledApps();
    } catch (error) {
      console.error('Failed to get installed apps from native module:', error);
      return mockApps;
    }
  },

  async launchApp(packageName: string): Promise<boolean> {
    if (Platform.OS !== 'android' || !AppLauncher) {
      console.warn('AppLauncher native module not available, simulating app launch');
      return Promise.resolve(true);
    }

    try {
      const result = await AppLauncher.launchApp(packageName);
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