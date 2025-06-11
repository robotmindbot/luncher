import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  FlatList,
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
  const { fontSize, numHomeApps, homeApps, setHomeApp, leftSwipeApp, rightSwipeApp } = useFontSize();
  const [apps, setApps] = useState<any[]>([]);
  const [filteredApps, setFilteredApps] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [appSelectorVisible, setAppSelectorVisible] = useState(false);
  const [selectedHomeAppIndex, setSelectedHomeAppIndex] = useState<number | null>(null);
  const searchInputRef = useRef<TextInput>(null);
  const appsLoadedRef = useRef(false);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT + 100)).current;

  // Defer app loading until the drawer is first opened
  const loadAppsDeferred = useCallback(async () => {
    if (appsLoadedRef.current) return;

    try {
      setLoading(true);
      console.log('Loading installed apps...');

      const wrapper = await getAppLauncherWrapper();

      // Check permissions first (simplified)
      let realApps = [];
      try {
        realApps = await wrapper.getInstalledApps();
      } catch (error) {
        console.warn('Failed to load real apps, using mock data');
      }

      const sortedApps = realApps.length > 8 ? realApps : mockApps;
      sortedApps.sort((a: any, b: any) => a.name.localeCompare(b.name));

      setApps(sortedApps);
      setFilteredApps(sortedApps);
      appsLoadedRef.current = true;
      console.log('Apps loaded successfully, total:', sortedApps.length);
    } catch (error) {
      console.error('Error loading apps:', error);
      // Fallback to mock data
      const sortedApps = mockApps.sort((a, b) => a.name.localeCompare(b.name));
      setApps(sortedApps);
      setFilteredApps(sortedApps);
      appsLoadedRef.current = true;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredApps(apps);
    } else {
      const filtered = apps.filter((app: any) =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredApps(filtered);
    }
  }, [searchQuery, apps]);

    // Auto-launch when there's only one search result
  useEffect(() => {
    if (searchQuery.trim() && filteredApps.length === 1 && !loading) {
      launchApp(filteredApps[0].packageName);
    }
  }, [filteredApps, searchQuery, loading]);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (isDrawerOpen) {
        closeDrawer();
        return true;
      }
      return false;
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
    // Load apps when drawer is first opened
    loadAppsDeferred();

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

  const renderAppItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.appItem}
      onPress={() => launchApp(item.packageName)}
      activeOpacity={0.6}
    >
      <Text style={[styles.appName, { fontSize: fontSize }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  const handleLongPress = () => {
    router.push('./config');
  };

  const handleHomeAppPress = async (app: any) => {
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
      console.log('No package name for home app:', app);
    }
  };

  const handleHomeAppLongPress = (index: number) => {
    setSelectedHomeAppIndex(index);
    setAppSelectorVisible(true);
  };

  const handleAppSelect = (app: { packageName: string; originalName: string; nickname?: string }) => {
    if (selectedHomeAppIndex !== null) {
      setHomeApp(selectedHomeAppIndex, app);
    }
    setAppSelectorVisible(false);
    setSelectedHomeAppIndex(null);
  };

  const renderHomeAppItem = (app: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.homeAppItem}
      onPress={() => handleHomeAppPress(app)}
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
          }
        }
        // Left swipe (negative translation)
        else if (translationX < -50 || velocityX < -500) {
          if (leftSwipeApp.packageName) {
            console.log('Left swipe detected, launching:', leftSwipeApp.originalName);
            handleHomeAppPress(leftSwipeApp);
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

          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { fontSize }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            autoFocus={isDrawerOpen}
            caretHidden={true}
          />

          {!loading && (
            <FlatList
              data={filteredApps}
              renderItem={renderAppItem}
              keyExtractor={(item) => item.packageName}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </Animated.View>

        {/* App Selector Modal */}
        <React.Suspense fallback={<View />}>
          <AppSelector
            visible={appSelectorVisible}
            onClose={() => {
              setAppSelectorVisible(false);
              setSelectedHomeAppIndex(null);
            }}
            onSelectApp={handleAppSelect}
            currentApp={
              selectedHomeAppIndex !== null && homeApps[selectedHomeAppIndex]
                ? homeApps[selectedHomeAppIndex]
                : undefined
            }
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
    justifyContent: 'flex-end',
    paddingBottom: 100,
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
  searchInput: {
    height: 48,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    color: '#fff',
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  appItem: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  appName: {
    color: '#fff',
    fontWeight: '300',
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
    justifyContent: 'flex-end',
    paddingBottom: 100,
  },
});
