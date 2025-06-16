import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useFontSize } from './_layout';

// Lazy load components
const AppSelector = React.lazy(() => import('../components/AppSelector'));
const SearchView = React.lazy(() => import('../components/SearchView'));

// Lazy load the app launcher module
let AppLauncherWrapper: any = null;
const getAppLauncherWrapper = async () => {
  if (!AppLauncherWrapper) {
    const module = await import('../modules/app-launcher');
    AppLauncherWrapper = module.default;
  }
  return AppLauncherWrapper;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Current launcher package name
const LAUNCHER_PACKAGE_NAME = 'baby.waza.luncher';

// Filter function to hide launcher from app list
const filterOutLauncher = (apps: any[]) => {
  return apps.filter(app => app.packageName !== LAUNCHER_PACKAGE_NAME);
};

// Mock data for development/testing
const mockApps = [
  { name: 'Settings', packageName: 'com.android.settings' },
  { name: 'Calculator', packageName: 'com.android.calculator2' },
  { name: 'Camera', packageName: 'com.android.camera' },
  { name: 'Gallery', packageName: 'com.android.gallery3d' },
  { name: 'Clock', packageName: 'com.android.deskclock' },
  { name: 'Phone', packageName: 'com.android.phone' },
  { name: 'Messages', packageName: 'com.android.messaging' },
  { name: 'Contacts', packageName: 'com.android.contacts' },
];

function LauncherHome() {
  const router = useRouter();
  const { fontSize, numHomeApps, homeApps, setHomeApp, leftSwipeApp, rightSwipeApp, setLeftSwipeApp, setRightSwipeApp } = useFontSize();
  const [apps, setApps] = useState<any[]>([]);
  const [filteredApps, setFilteredApps] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [appSelectorVisible, setAppSelectorVisible] = useState(false);
  const [selectedHomeAppIndex, setSelectedHomeAppIndex] = useState<number | null>(null);
  const [selectedSwipeType, setSelectedSwipeType] = useState<'left' | 'right' | null>(null);
  const searchInputRef = useRef<TextInput>(null);
  const appsLoadedRef = useRef(false);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT + 100)).current;

  // Load apps immediately on app start
  const loadApps = useCallback(async () => {
    if (appsLoadedRef.current) {
      console.log('Apps already loaded, skipping...');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Loading installed apps...');

      const wrapper = await getAppLauncherWrapper();

      // First, get cached apps for immediate display
      console.log('📱 Checking cache...');
      let cachedApps = await wrapper.getCachedApps();
      console.log('📱 Cache result:', cachedApps.length, 'apps');

      if (cachedApps.length > 0) {
        console.log('✅ Using cached apps for immediate display:', cachedApps.length);
        console.log('📱 First few apps:', cachedApps.slice(0, 3).map((app: any) => app.name));
                // Deduplicate apps by packageName to prevent duplicate keys and hide launcher
        const deduplicatedCached = cachedApps.filter((app: any, index: number, self: any[]) =>
          index === self.findIndex((a: any) => a.packageName === app.packageName)
        );
        const filteredCached = filterOutLauncher(deduplicatedCached);
        setApps(filteredCached);
        setFilteredApps(filteredCached);
        appsLoadedRef.current = true;
        setLoading(false);

        // Refresh in background to update cache
        console.log('🔄 Starting background refresh...');
        wrapper.refreshInstalledApps().then((refreshedApps: any[]) => {
          if (refreshedApps.length > 0) {
            console.log('✅ Background refresh completed:', refreshedApps.length);
            console.log('📱 Updated apps:', refreshedApps.slice(0, 3).map(app => app.name));
                        // Deduplicate refreshed apps too and hide launcher
            const deduplicatedRefreshed = refreshedApps.filter((app: any, index: number, self: any[]) =>
              index === self.findIndex((a: any) => a.packageName === app.packageName)
            );
            const filteredRefreshed = filterOutLauncher(deduplicatedRefreshed);
            setApps(filteredRefreshed);
            setFilteredApps(filteredRefreshed);
          }
        }).catch((error: any) => {
          console.warn('❌ Background refresh failed:', error);
        });
      } else {
        // No cache available, load from native
        console.log('❌ No cache available, loading from native...');
        const freshApps = await wrapper.getInstalledApps();
        console.log('📱 Fresh apps loaded:', freshApps.length);
        const sortedApps = freshApps.length > 8 ? freshApps : mockApps;
        console.log('📱 Using apps:', sortedApps.length, 'total');
        console.log('📱 First few apps:', sortedApps.slice(0, 3).map((app: any) => app.name));

                // Deduplicate fresh apps as well and hide launcher
        const deduplicatedSorted = sortedApps.filter((app: any, index: number, self: any[]) =>
          index === self.findIndex((a: any) => a.packageName === app.packageName)
        );
        const filteredSorted = filterOutLauncher(deduplicatedSorted);
        setApps(filteredSorted);
        setFilteredApps(filteredSorted);
        appsLoadedRef.current = true;
        console.log('✅ Apps loaded successfully, total:', sortedApps.length);
      }
    } catch (error) {
      console.error('❌ Error loading apps:', error);
      // Fallback to mock data
      const sortedApps = mockApps.sort((a, b) => a.name.localeCompare(b.name));
      console.log('📱 Using fallback mock data:', sortedApps.length);
            // Deduplicate fallback mock apps and hide launcher
      const deduplicatedMockApps = sortedApps.filter((app: any, index: number, self: any[]) =>
        index === self.findIndex((a: any) => a.packageName === app.packageName)
      );
      const filteredMockApps = filterOutLauncher(deduplicatedMockApps);
      setApps(filteredMockApps);
      setFilteredApps(filteredMockApps);
      appsLoadedRef.current = true;
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  }, []);

  // Load apps on component mount
  useEffect(() => {
    loadApps();
  }, [loadApps]);

    useEffect(() => {
    console.log('🔍 Search effect triggered:', {
      searchQuery: searchQuery.trim(),
      appsCount: apps.length,
      appsLoaded: appsLoadedRef.current
    });

    if (searchQuery.trim() === '') {
      console.log('🔍 No search query, showing all apps:', apps.length);
      setFilteredApps(apps);
    } else {
      const filtered = apps.filter((app: any) =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('🔍 Filtered apps:', filtered.length, 'from', apps.length);
      setFilteredApps(filtered);
    }
  }, [searchQuery, apps]);

  // Debug effect to track when SearchView should receive data
  useEffect(() => {
    console.log('🎯 Component state update:', {
      filteredAppsCount: filteredApps.length,
      appsCount: apps.length,
      loading,
      isDrawerOpen,
      appsLoaded: appsLoadedRef.current,
      searchQuery: searchQuery.trim(),
      sampleApps: filteredApps.slice(0, 2).map((app: any) => app.name)
    });
  }, [filteredApps, apps, loading, isDrawerOpen, searchQuery]);

    // Auto-launch when there's only one search result
  useEffect(() => {
    if (searchQuery.trim() && filteredApps.length === 1 && !loading) {
      launchApp(filteredApps[0].packageName);
    }
  }, [filteredApps, searchQuery, loading]);

  // Handle Android back button - always stay on home screen
  useEffect(() => {
    const backAction = () => {
      if (isDrawerOpen) {
        closeDrawer();
      }
      // Always return true to prevent default behavior (going to previous screen/exiting app)
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isDrawerOpen]);

  const launchApp = async (packageName: string) => {
    try {
      console.log('Attempting to launch app:', packageName);
      const wrapper = await getAppLauncherWrapper();
      await wrapper.launchApp(packageName);
      console.log('App launched successfully:', packageName);
      closeDrawer();
    } catch (error) {
      console.error('Failed to launch app:', packageName, error);
    }
  };

    const openDrawer = () => {
    setIsDrawerOpen(true);
    // Load apps if not already loaded
    loadApps();

    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      // Focus the search input immediately after animation
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    });
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSearchQuery(''); // Clear search when closing
    Animated.spring(translateY, {
      toValue: SCREEN_HEIGHT + 100,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const toggleDrawer = () => {
    if (isDrawerOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  };



  const handleLongPress = () => {
    router.push('./config');
  };

  const handleHomeAppPress = async (app: any, index?: number) => {
    if (app.packageName) {
      try {
        console.log('Attempting to launch home app:', app.packageName, app.originalName);
        const wrapper = await getAppLauncherWrapper();
        await wrapper.launchApp(app.packageName);
        console.log('Home app launched successfully:', app.packageName);
      } catch (error) {
        console.error('Failed to launch home app:', app.packageName, error);
        console.error('Error details:', JSON.stringify(error, null, 2));
      }
    } else {
      // No app assigned - open AppSelector for easy assignment
      console.log('No app assigned, opening AppSelector for slot:', index);
      if (typeof index === 'number') {
        setSelectedHomeAppIndex(index);
        setAppSelectorVisible(true);
      }
    }
  };

  const handleHomeAppLongPress = (index: number) => {
    setSelectedHomeAppIndex(index);
    setAppSelectorVisible(true);
  };

  const handleAppSelect = (app: { packageName: string; originalName: string; nickname?: string }) => {
    if (selectedHomeAppIndex !== null) {
      setHomeApp(selectedHomeAppIndex, app);
    } else if (selectedSwipeType) {
      // Handle swipe app assignment
      if (selectedSwipeType === 'left') {
        setLeftSwipeApp(app);
      } else if (selectedSwipeType === 'right') {
        setRightSwipeApp(app);
      }
    }
    setAppSelectorVisible(false);
    setSelectedHomeAppIndex(null);
    setSelectedSwipeType(null);
  };

  const renderHomeAppItem = (app: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.homeAppItem}
      onPress={() => handleHomeAppPress(app, index)}
      onLongPress={() => handleHomeAppLongPress(index)}
      activeOpacity={0.6}
    >
      <Text style={[styles.homeAppName, { fontSize }]}>
        {app.nickname || app.originalName}
      </Text>
    </TouchableOpacity>
  );

  const handleSwipeGesture = (event: any) => {
    const { translationX, translationY, velocityX, velocityY, state } = event.nativeEvent;

    if (state === State.END) {
      // Only handle swipes if drawer is closed
      if (!isDrawerOpen) {
        // Vertical swipe up (negative translationY) to open drawer
        if (translationY < -50 || velocityY < -500) {
          console.log('Swipe up detected, opening drawer');
          openDrawer();
        }
        // Right swipe (positive translation)
        else if (translationX > 50 || velocityX > 500) {
          if (rightSwipeApp.packageName) {
            console.log('Right swipe detected, launching:', rightSwipeApp.originalName);
            handleHomeAppPress(rightSwipeApp);
          } else {
            console.log('Right swipe detected, no app assigned - opening AppSelector');
            setSelectedSwipeType('right');
            setAppSelectorVisible(true);
          }
        }
        // Left swipe (negative translation)
        else if (translationX < -50 || velocityX < -500) {
          if (leftSwipeApp.packageName) {
            console.log('Left swipe detected, launching:', leftSwipeApp.originalName);
            handleHomeAppPress(leftSwipeApp);
          } else {
            console.log('Left swipe detected, no app assigned - opening AppSelector');
            setSelectedSwipeType('left');
            setAppSelectorVisible(true);
          }
        }
      }
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

        {/* Main Black Screen with Swipe Detection */}
        <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
          <Animated.View style={styles.mainScreen}>
            <TouchableOpacity
              style={styles.touchArea}
              onPress={toggleDrawer}
              onLongPress={handleLongPress}
              delayLongPress={800}
              activeOpacity={1}
            >
              {numHomeApps > 0 && (
                <View style={styles.homeAppsContainer}>
                  {homeApps.slice(0, numHomeApps).map((app, index) => renderHomeAppItem(app, index))}
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>

        {/* App Drawer Overlay */}
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateY }],
            },
          ]}
          pointerEvents={isDrawerOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity onPress={closeDrawer}>
            <View style={styles.drawerHandle} />
          </TouchableOpacity>

          <React.Suspense fallback={<View />}>
            <SearchView
              ref={searchInputRef}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              filteredApps={filteredApps}
              onAppPress={launchApp}
              loading={loading}
              fontSize={fontSize}
              isOpen={isDrawerOpen}
            />
          </React.Suspense>
        </Animated.View>

        {/* App Selector Modal */}
        <React.Suspense fallback={<View />}>
          <AppSelector
            visible={appSelectorVisible}
            onClose={() => {
              setAppSelectorVisible(false);
              setSelectedHomeAppIndex(null);
              setSelectedSwipeType(null);
            }}
            onSelectApp={handleAppSelect}
            currentApp={
              selectedHomeAppIndex !== null && homeApps[selectedHomeAppIndex]
                ? homeApps[selectedHomeAppIndex]
                : selectedSwipeType === 'left'
                ? leftSwipeApp
                : selectedSwipeType === 'right'
                ? rightSwipeApp
                : undefined
            }
            hideNickname={selectedSwipeType !== null}
          />
        </React.Suspense>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

export default LauncherHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mainScreen: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },

  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },

  homeAppItem: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  homeAppName: {
    color: '#fff',
    fontWeight: '300',
  },
  homeAppsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  touchArea: {
    flex: 1,
    justifyContent: 'center',
  },
});
