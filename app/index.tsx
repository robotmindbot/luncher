import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    AppState,
    BackHandler,
    Dimensions,
    InteractionManager,
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

// Import components directly (lazy loading doesn't work well in React Native)
import AppSelector from '../components/AppSelector';
import SearchView from '../components/SearchView';

// Lazy load the app launcher module
let AppLauncherWrapper: any = null;
let wrapperPromise: Promise<any> | null = null;

const getAppLauncherWrapper = async () => {
  if (!AppLauncherWrapper) {
    // Use a shared promise to avoid multiple imports
    if (!wrapperPromise) {
      wrapperPromise = import('../modules/app-launcher').then(module => {
        AppLauncherWrapper = module.default;
        return AppLauncherWrapper;
      });
    }
    return await wrapperPromise;
  }
  return AppLauncherWrapper;
};

// Preload the wrapper for instant app launches
getAppLauncherWrapper();

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Current launcher package name
const LAUNCHER_PACKAGE_NAME = 'baby.waza.luncher';

// Filter function to hide launcher from app list
const filterOutLauncher = (apps: any[]) => {
  return apps.filter(app => app.packageName !== LAUNCHER_PACKAGE_NAME);
};

// Deduplicate apps by packageName to prevent duplicate keys
const deduplicateApps = (apps: any[]) => {
  const seen = new Set<string>();
  return apps.filter((app: any) => {
    if (!app?.packageName || seen.has(app.packageName)) return false;
    seen.add(app.packageName);
    return true;
  });
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
  const [refreshing, setRefreshing] = useState(false);
  const [isAppActive, setIsAppActive] = useState(true);
  const searchInputRef = useRef<TextInput>(null);
  const appsLoadedRef = useRef(false);
  const lastActiveTime = useRef(Date.now());
  const isMountedRef = useRef(true);

  // Track component mount state to prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT + 100)).current;

  // Memoize visible home apps for better performance
  const visibleHomeApps = useMemo(() => {
    return homeApps.slice(0, numHomeApps);
  }, [homeApps, numHomeApps]);

  // Load apps immediately on app start - initial load only
  const loadApps = useCallback(async () => {
    if (appsLoadedRef.current) {
      return;
    }

    try {
      setLoading(true);
      if (__DEV__) console.log('🔄 Loading installed apps...');

      const wrapper = await getAppLauncherWrapper();

      // First, get cached apps for immediate display
      let cachedApps = await wrapper.getCachedApps();

      if (cachedApps.length > 0) {
        if (__DEV__) console.log('✅ Using cached apps for immediate display:', cachedApps.length);
        const filteredCached = filterOutLauncher(deduplicateApps(cachedApps));
        setApps(filteredCached);
        setFilteredApps(filteredCached);
        appsLoadedRef.current = true;
        setLoading(false);

        // Refresh in background using InteractionManager for better performance
        InteractionManager.runAfterInteractions(() => {
          wrapper.refreshInstalledApps().then((refreshedApps: any[]) => {
            if (!isMountedRef.current) return; // Prevent state update after unmount
            if (refreshedApps.length > 0) {
              if (__DEV__) console.log('✅ Background refresh completed:', refreshedApps.length);
              const filteredRefreshed = filterOutLauncher(deduplicateApps(refreshedApps));
              setApps(filteredRefreshed);
              setFilteredApps(filteredRefreshed);
            }
          }).catch((error: any) => {
            if (!isMountedRef.current) return;
            if (__DEV__) console.warn('❌ Background refresh failed:', error);
          });
        });
      } else {
        // No cache available, load from native
        const freshApps = await wrapper.getInstalledApps();
        const sortedApps = freshApps.length > 8 ? freshApps : mockApps;
        const filteredSorted = filterOutLauncher(deduplicateApps(sortedApps));
        setApps(filteredSorted);
        setFilteredApps(filteredSorted);
        appsLoadedRef.current = true;
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Error loading apps:', error);
      // Fallback to mock data
      const sortedApps = mockApps.sort((a, b) => a.name.localeCompare(b.name));
      const filteredMockApps = filterOutLauncher(deduplicateApps(sortedApps));
      setApps(filteredMockApps);
      setFilteredApps(filteredMockApps);
      appsLoadedRef.current = true;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh apps list - can be called multiple times
  const refreshApps = useCallback(async () => {
    try {
      const wrapper = await getAppLauncherWrapper();

      // First, show cached apps immediately if available
      const cachedApps = await wrapper.getCachedApps();
      if (cachedApps.length > 0) {
        const filteredCached = filterOutLauncher(deduplicateApps(cachedApps));
        setApps(filteredCached);
        setFilteredApps(filteredCached);
      }

      // Then refresh from native in background using InteractionManager
      InteractionManager.runAfterInteractions(async () => {
        try {
          const refreshedApps = await wrapper.refreshInstalledApps();
          if (!isMountedRef.current) return; // Prevent state update after unmount
          if (refreshedApps.length > 0) {
            const filteredRefreshed = filterOutLauncher(deduplicateApps(refreshedApps));
            setApps(filteredRefreshed);
            setFilteredApps(filteredRefreshed);
          }
        } catch (error) {
          if (!isMountedRef.current) return;
          if (__DEV__) console.error('❌ Error refreshing apps:', error);
        }
      });
    } catch (error) {
      if (__DEV__) console.error('❌ Error refreshing apps:', error);
    }
  }, []);

  // Handle manual refresh from pull-to-refresh
  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshApps();
    setRefreshing(false);
  }, [refreshApps]);

  // Define closeDrawer before useEffects that use it
  const closeDrawer = useCallback(() => {
    // Batch state updates to prevent multiple re-renders
    setIsDrawerOpen(false);

    // Use setTimeout to defer search query clearing to next tick
    // This prevents expensive filtering during the critical home button response
    setTimeout(() => {
      setSearchQuery('');
    }, 0);

    Animated.spring(translateY, {
      toValue: SCREEN_HEIGHT + 100,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [translateY]);

  // Load apps on component mount
  useEffect(() => {
    loadApps();
  }, [loadApps]);

  // Auto-launch when there's only one search result
  useEffect(() => {
    if (searchQuery.trim() && filteredApps.length === 1 && !loading) {
      launchApp(filteredApps[0].packageName);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [isDrawerOpen, closeDrawer]);

  // Handle Home button behavior - close drawer if open
  useEffect(() => {
    let appStateChangeTime = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleAppStateChange = (nextAppState: string) => {
      const currentTime = Date.now();

      if (nextAppState === 'active') {
        // App became active - optimize for fast response
        setIsAppActive(true);
        lastActiveTime.current = currentTime;

        // Only close drawer if it was a quick transition (home button press)
        if (isDrawerOpen && (currentTime - appStateChangeTime) < 5000) {
          // Use setTimeout to ensure smooth transition
          timeoutId = setTimeout(() => {
            if (!isMountedRef.current) return;
            setIsDrawerOpen(false);
            setSearchQuery('');
            Animated.spring(translateY, {
              toValue: SCREEN_HEIGHT + 100,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }).start();
          }, 0);
        }
      } else if (nextAppState === 'background') {
        // App going to background
        setIsAppActive(false);
        appStateChangeTime = currentTime;
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription?.remove();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isDrawerOpen, translateY]);

  const launchApp = async (packageName: string) => {
    try {
      // Close drawer immediately for instant feedback
      closeDrawer();

      // Get wrapper (should be preloaded)
      const wrapper = await getAppLauncherWrapper();

      // Launch app in background - don't await to avoid blocking
      wrapper.launchApp(packageName).catch((error: any) => {
        if (__DEV__) console.error('Failed to launch app:', packageName, error);
      });

    } catch (error) {
      if (__DEV__) console.error('Failed to launch app:', packageName, error);
    }
  };

  const openDrawer = () => {
    setIsDrawerOpen(true);

    // Only refresh apps if the app has been active and enough time has passed
    // or if apps haven't been loaded yet
    const shouldRefresh = !appsLoadedRef.current ||
                         (isAppActive && (Date.now() - lastActiveTime.current) > 30000); // 30 seconds

    if (shouldRefresh) {
      if (appsLoadedRef.current) {
        // Use InteractionManager to defer refresh for better responsiveness
        InteractionManager.runAfterInteractions(() => {
          refreshApps();
        });
      } else {
        // First time loading apps
        loadApps();
      }
    }

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

  // Optimized search filtering with debouncing for better performance
  useEffect(() => {
    // Skip filtering if drawer is closed to avoid unnecessary work
    if (!isDrawerOpen) {
      return;
    }

    if (searchQuery.trim() === '') {
      setFilteredApps(apps);
    } else {
      const filtered = apps.filter((app: any) =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredApps(filtered);
    }
  }, [searchQuery, apps, isDrawerOpen]);

  // Simplified debug effect - only log when drawer is open to reduce noise
  useEffect(() => {
    if (isDrawerOpen && __DEV__) {
      console.log('🎯 Search state:', {
        filteredAppsCount: filteredApps.length,
        appsCount: apps.length,
        searchQuery: searchQuery.trim()
      });
    }
  }, [filteredApps, apps, isDrawerOpen, searchQuery]);

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
    if (app?.packageName) {
      try {
        // Get wrapper (should be preloaded) and launch immediately
        const wrapper = await getAppLauncherWrapper();

        // Launch app without awaiting for instant response
        wrapper.launchApp(app.packageName).catch((error: any) => {
          if (__DEV__) console.error('Failed to launch home app:', app.packageName, error);
        });

      } catch (error) {
        if (__DEV__) console.error('Failed to launch home app:', app?.packageName, error);
      }
    } else {
      // No app assigned - open AppSelector for easy assignment
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
          openDrawer();
        }
        // Right swipe (positive translation)
        else if (translationX > 50 || velocityX > 500) {
          if (rightSwipeApp.packageName) {
            handleHomeAppPress(rightSwipeApp);
          } else {
            setSelectedSwipeType('right');
            setAppSelectorVisible(true);
          }
        }
        // Left swipe (negative translation)
        else if (translationX < -50 || velocityX < -500) {
          if (leftSwipeApp.packageName) {
            handleHomeAppPress(leftSwipeApp);
          } else {
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
                  {visibleHomeApps.map((app, index) => renderHomeAppItem(app, index))}
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

          <SearchView
            ref={searchInputRef}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            filteredApps={filteredApps}
            onAppPress={launchApp}
            loading={loading}
            fontSize={fontSize}
            isOpen={isDrawerOpen}
            onRefresh={handleManualRefresh}
            refreshing={refreshing}
          />
        </Animated.View>

        {/* App Selector Modal */}
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
        />
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
