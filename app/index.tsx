import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    AppState,
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
import { type HomeApp, useFontSize } from './_layout';
import AppLauncherWrapper, { type AppInfo } from '../modules/app-launcher';

// Import components directly (lazy loading doesn't work well in React Native)
import AppSelector from '../components/AppSelector';
import SearchView from '../components/SearchView';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function LauncherHome() {
  const router = useRouter();
  const { fontSize, numHomeApps, homeApps, setHomeApp, leftSwipeApp, rightSwipeApp, setLeftSwipeApp, setRightSwipeApp } = useFontSize();
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [appSelectorVisible, setAppSelectorVisible] = useState(false);
  const [selectedHomeAppIndex, setSelectedHomeAppIndex] = useState<number | null>(null);
  const [selectedSwipeType, setSelectedSwipeType] = useState<'left' | 'right' | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const isMountedRef = useRef(true);

  // Track component mount state to prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT + 100)).current;

  // Keep each shortcut's original slot index so empty slots don't change assignments.
  const visibleHomeApps = useMemo(() => {
    return homeApps.slice(0, numHomeApps)
      .map((app, index) => ({ app, index }))
      .filter(({ app }) => app != null);
  }, [homeApps, numHomeApps]);

  const searchableApps = useMemo(() => apps.map(app => [app.name.toLowerCase(), app] as const), [apps]);
  const filteredApps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return query ? searchableApps.filter(([name]) => name.includes(query)).map(([, app]) => app) : apps;
  }, [apps, searchableApps, searchQuery]);

  const loadApps = useCallback(async (refresh = false) => {
    setLoadError(undefined);
    try {
      const installedApps = refresh
        ? await AppLauncherWrapper.refreshInstalledApps()
        : await AppLauncherWrapper.getInstalledApps();
      if (isMountedRef.current) setApps(installedApps);
    } catch (error) {
      if (!isMountedRef.current) return;
      setApps([]);
      setLoadError('Could not load installed apps. Try again later.');
      console.error('Failed to load installed apps:', error);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  // Handle manual refresh from pull-to-refresh
  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadApps(true);
    } finally {
      setRefreshing(false);
    }
  }, [loadApps]);

  // Define closeDrawer before useEffects that use it
  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSearchQuery('');

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

  useEffect(() => {
    const subscription = AppLauncherWrapper.addHomeIntentListener(closeDrawer);
    return () => subscription?.remove();
  }, [closeDrawer]);

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
    let wasInBackground = false;
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        wasInBackground = true;
      } else if (nextAppState === 'active' && wasInBackground) {
        wasInBackground = false;
        if (isDrawerOpen) closeDrawer();
        void loadApps();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isDrawerOpen, closeDrawer, loadApps]);

  const launchApp = useCallback(async (packageName: string) => {
    try {
      const launch = AppLauncherWrapper.launchApp(packageName);
      closeDrawer();
      await launch;
    } catch (error) {
      console.error('Failed to launch app:', packageName, error);
    }
  }, [closeDrawer]);

  useEffect(() => {
    if (isDrawerOpen && searchQuery.trim() && filteredApps.length === 1 && !loading) {
      void launchApp(filteredApps[0].packageName);
    }
  }, [isDrawerOpen, searchQuery, filteredApps, loading, launchApp]);

  const openDrawer = () => {
    setIsDrawerOpen(true);

    Animated.spring(translateY, {
      toValue: 0,
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

  const handleHomeAppPress = (app: HomeApp | null | undefined, index?: number) => {
    if (app?.packageName) {
      void launchApp(app.packageName);
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

  const renderHomeAppItem = (app: HomeApp | null | undefined, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.homeAppItem}
      onPress={() => handleHomeAppPress(app, index)}
      onLongPress={() => handleHomeAppLongPress(index)}
      activeOpacity={0.6}
    >
      <Text style={[styles.homeAppName, { fontSize }]}>
        {app?.nickname || app?.originalName || 'select'}
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
                  {visibleHomeApps.map(({ app, index }) => renderHomeAppItem(app, index))}
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
            error={loadError}
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
