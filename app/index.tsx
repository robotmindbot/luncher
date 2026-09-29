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
    View,
    Alert,
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
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [appSelectorVisible, setAppSelectorVisible] = useState(false);
  const [selectedHomeAppIndex, setSelectedHomeAppIndex] = useState<number | null>(null);
  const [editingApp, setEditingApp] = useState<AppInfo | null>(null);
  const [selectedSwipeType, setSelectedSwipeType] = useState<'left' | 'right' | 'down' | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [nextAppointment, setNextAppointment] = useState<{ eventId: number; title: string; begin: number; end: number; allDay: boolean } | null>(null);
  const searchInputRef = useRef<TextInput>(null);
  const isMountedRef = useRef(true);
  const { fontSize, numHomeApps, homeApps, setHomeApp, leftSwipeApp, rightSwipeApp, downSwipeApp, setLeftSwipeApp, setRightSwipeApp, setDownSwipeApp, appAliases, setAppAlias, showTime, showDate, chineseDate, showNextAppointment, calendarFilterKeywords } = useFontSize();

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

  const searchableApps = useMemo(() => apps.map(app => [[app.name, appAliases[app.packageName]].filter(Boolean).join(' ').toLowerCase(), app] as const), [apps, appAliases]);
  const filteredApps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (query ? searchableApps.filter(([name]) => name.includes(query)).map(([, app]) => app) : apps)
      .map(app => ({ ...app, alias: appAliases[app.packageName] }));
  }, [apps, searchableApps, searchQuery, appAliases]);

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

  const openDrawer = useCallback(() => {
    translateY.setValue(0);
    setIsDrawerOpen(true);
    searchInputRef.current?.focus();
  }, [translateY]);

  const toggleDrawer = useCallback(() => {
    if (isDrawerOpen) closeDrawer();
    else openDrawer();
  }, [isDrawerOpen, closeDrawer, openDrawer]);

  // Load apps on component mount
  useEffect(() => {
    loadApps();
  }, [loadApps]);

  useEffect(() => {
    if (!showTime && !showDate) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [showTime, showDate]);

  useEffect(() => {
    if (!showDate || !showNextAppointment) {
      setNextAppointment(null);
      return;
    }
    let active = true;
    const refresh = () => {
      void AppLauncherWrapper.getNextCalendarAppointment(calendarFilterKeywords.split(',').map(keyword => keyword.trim()).filter(Boolean)).then(value => {
        if (active) setNextAppointment(value);
      }).catch(error => console.warn('Could not read calendar appointment:', error));
    };
    refresh();
    const timer = setInterval(refresh, 60_000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => {
      active = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, [showDate, showNextAppointment, calendarFilterKeywords]);

  useEffect(() => {
    const subscription = AppLauncherWrapper.addHomeIntentListener(toggleDrawer);
    return () => subscription?.remove();
  }, [toggleDrawer]);

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
        void loadApps(true);
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

  const handleLongPress = () => {
    router.push('./config');
  };

  const handleSearchLongPress = (app: AppInfo) => Alert.alert(app.name, undefined, [
    { text: 'Edit alias', onPress: () => { setEditingApp(app); setAppSelectorVisible(true); } },
    { text: 'Uninstall app', style: 'destructive', onPress: () => {
      if (!AppLauncherWrapper.uninstallApp(app.packageName)) Alert.alert('Unable to uninstall app');
    } },
    { text: 'Cancel', style: 'cancel' },
  ]);

  const launchNamedApp = (term: string) => {
    const app = apps.find(item => item.name.toLowerCase().includes(term));
    if (app) void launchApp(app.packageName);
    else openDrawer();
  };

  const chineseDateParts = new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).formatToParts(now);
  const dateText = chineseDate
    ? `${chineseDateParts.find(part => part.type === 'month')?.value}月${chineseDateParts.find(part => part.type === 'day')?.value}日`
    : now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

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

  const handleAppSelect = (app: { packageName: string; originalName: string; alias?: string }) => {
    if (editingApp) {
      setAppAlias(editingApp.packageName, app.alias ?? '');
    } else if (selectedHomeAppIndex !== null) {
      setHomeApp(selectedHomeAppIndex, app);
    } else if (selectedSwipeType) {
      // Handle swipe app assignment
      if (selectedSwipeType === 'left') {
        setLeftSwipeApp(app);
      } else if (selectedSwipeType === 'right') {
        setRightSwipeApp(app);
      } else if (selectedSwipeType === 'down') {
        setDownSwipeApp(app);
      }
    }
    setAppSelectorVisible(false);
    setSelectedHomeAppIndex(null);
    setSelectedSwipeType(null);
    setEditingApp(null);
  };

  const renderHomeAppItem = (app: HomeApp | null | undefined, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.homeAppItem}
      onPress={event => {
        event.stopPropagation();
        handleHomeAppPress(app, index);
      }}
      onLongPress={event => {
        event.stopPropagation();
        handleHomeAppLongPress(index);
      }}
      activeOpacity={0.6}
    >
      <Text style={[styles.homeAppName, { fontSize }]}>
        {app?.alias || app?.originalName || 'select'}
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
        // Downward swipe
        else if (translationY > 50 || velocityY > 500) {
          if (downSwipeApp.packageName) {
            handleHomeAppPress(downSwipeApp);
          } else {
            setSelectedSwipeType('down');
            setAppSelectorVisible(true);
          }
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
              {(numHomeApps > 0 || showTime || showDate) && (
                <View style={styles.homeAppsContainer}>
                  {(showTime || showDate) && <View style={styles.dateTimeContainer}>
                    {showTime && <TouchableOpacity onPress={() => launchNamedApp('clock')}><Text style={[styles.homeAppName, styles.dateTimeText, { fontSize: fontSize + 8 }]}>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })}</Text></TouchableOpacity>}
                    {showDate && <TouchableOpacity onPress={() => launchNamedApp('calendar')}><Text style={[styles.homeAppName, styles.dateTimeText, { fontSize }]}>{dateText}</Text></TouchableOpacity>}
                    {showDate && showNextAppointment && <TouchableOpacity
                      style={styles.appointmentLine}
                      disabled={!nextAppointment}
                      onPress={() => nextAppointment && AppLauncherWrapper.openCalendarEvent(nextAppointment)}
                    >
                      <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.homeAppName, styles.appointmentText]}>
                        {nextAppointment ? (nextAppointment.allDay ? nextAppointment.title : `${new Date(nextAppointment.begin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${nextAppointment.title}`) : ' '}
                      </Text>
                    </TouchableOpacity>}
                  </View>}
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
            onAppLongPress={handleSearchLongPress}
            loading={loading}
            error={loadError}
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
            setEditingApp(null);
          }}
          onSelectApp={handleAppSelect}
          currentApp={editingApp ? { ...editingApp, originalName: editingApp.name, alias: appAliases[editingApp.packageName] } :
            selectedHomeAppIndex !== null && homeApps[selectedHomeAppIndex]
              ? homeApps[selectedHomeAppIndex]
              : selectedSwipeType === 'left'
              ? leftSwipeApp
            : selectedSwipeType === 'right'
              ? rightSwipeApp
              : selectedSwipeType === 'down'
                ? downSwipeApp
              : undefined
          }
          allowAlias={selectedHomeAppIndex !== null || editingApp !== null}
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
  dateTimeContainer: { marginBottom: 24 },
  dateTimeText: { marginBottom: 8 },
  appointmentLine: { height: 20, justifyContent: 'center' },
  appointmentText: { fontSize: 14, lineHeight: 18 },
  touchArea: {
    flex: 1,
    justifyContent: 'center',
  },
});
