import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  FlatList,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import AppSelector from '../components/AppSelector';
import AppLauncherWrapper, { AppInfo } from '../modules/app-launcher';
import { useFontSize } from './_layout';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

function LauncherHome() {
  const router = useRouter();
  const { fontSize, numHomeApps, homeApps, setHomeApp, leftSwipeApp, rightSwipeApp } = useFontSize();
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [filteredApps, setFilteredApps] = useState<AppInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [appSelectorVisible, setAppSelectorVisible] = useState(false);
  const [selectedHomeAppIndex, setSelectedHomeAppIndex] = useState<number | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    loadApps();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredApps(apps);
    } else {
      const filtered = apps.filter(app =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredApps(filtered);
    }
  }, [searchQuery, apps]);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (isDrawerOpen) {
        closeDrawer();
        return true; // Prevent default behavior
      }
      return false; // Allow default behavior (exit app)
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [isDrawerOpen]);

  // Function to check and request QUERY_ALL_PACKAGES permission
  const checkAndRequestPermissions = async () => {
    if (Platform.OS !== 'android') return true;

    try {
      // First try to load apps to see if permission is already granted
      const testApps = await AppLauncherWrapper.getInstalledApps();
      if (testApps.length > 8) {
        // If we get more than 8 apps, permission is likely granted
        console.log('QUERY_ALL_PACKAGES permission appears to be granted');
        return true;
      }

      // If we only get mock data, we need to request permission
      Alert.alert(
        'Permission Required',
        'This launcher needs permission to see all installed apps. Please grant "Query all packages" permission in the next screen.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Open Settings',
            onPress: () => {
              // Open the app settings page
              Linking.openSettings().catch((err) => {
                console.error('Failed to open settings:', err);
                Alert.alert(
                  'Manual Setup Required',
                  'Please go to Settings > Apps > Luncher > Permissions and enable "Query all packages" permission.',
                  [{ text: 'OK' }]
                );
              });
            },
          },
        ]
      );
      return false;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  };

  const loadApps = async () => {
    try {
      setLoading(true);
      console.log('Loading installed apps...');

      // Check permissions first
      await checkAndRequestPermissions();

      // Try to load real apps first, fallback to mock data
      const realApps = await AppLauncherWrapper.getInstalledApps();
      console.log('Retrieved apps count:', realApps.length);

      if (realApps.length === 0) {
        console.warn('No apps retrieved from native module, using mock data');
      } else if (realApps.length <= 8) {
        console.warn('Only got mock data - QUERY_ALL_PACKAGES permission may not be granted');
      }

      const sortedApps = realApps.length > 0 ? realApps : mockApps;
      sortedApps.sort((a, b) => a.name.localeCompare(b.name));

      setApps(sortedApps);
      setFilteredApps(sortedApps);
      console.log('Apps loaded successfully, total:', sortedApps.length);
    } catch (error) {
      console.error('Error loading apps:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Fallback to mock data
      const sortedApps = mockApps.sort((a, b) => a.name.localeCompare(b.name));
      setApps(sortedApps);
      setFilteredApps(sortedApps);
      console.log('Using mock data, count:', sortedApps.length);
    } finally {
      setLoading(false);
    }
  };

  const launchApp = async (packageName: string) => {
    try {
      console.log('Attempting to launch app:', packageName);
      await AppLauncherWrapper.launchApp(packageName);
      console.log('App launched successfully:', packageName);
      // Close the drawer after launching an app
      closeDrawer();
    } catch (error) {
      console.error('Failed to launch app:', packageName, error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
  };

  const openDrawer = () => {
    setIsDrawerOpen(true);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      // Focus the search input after the animation completes
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    });
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSearchQuery(''); // Clear search when closing
    Animated.spring(translateY, {
      toValue: SCREEN_HEIGHT,
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

  const refreshApps = () => {
    console.log('Refreshing app list...');
    loadApps();
  };

  const renderAppItem = ({ item }: { item: AppInfo }) => (
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
        await AppLauncherWrapper.launchApp(app.packageName);
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
        >
          <TouchableOpacity onPress={closeDrawer}>
            <View style={styles.drawerHandle} />
          </TouchableOpacity>

          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            autoFocus={isDrawerOpen}
          />

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={refreshApps}
            activeOpacity={0.6}
          >
            <Text style={styles.refreshText}>
              🔄 Refresh Apps {apps.length <= 8 ? '(Grant permission first)' : ''}
            </Text>
          </TouchableOpacity>

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
  swipeIndicator: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  swipeText: {
    color: '#555',
    fontSize: 16,
    opacity: 0.8,
  },
  hintText: {
    color: '#555',
    fontSize: 12,
    opacity: 0.8,
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
    fontSize: 16,
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
    fontSize: 18,
    fontWeight: '300',
  },
  homeAppItem: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  homeAppName: {
    color: '#fff',
    fontSize: 18,
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
  refreshButton: {
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#111',
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
});
