import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    AppState,
    BackHandler,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import AppSelector from '../components/AppSelector';
import NumberInput from '../components/NumberInput';
import { useFontSize } from './_layout';

const FONT_SIZE_MIN = 12;
const FONT_SIZE_MAX = 36;
const FONT_SIZE_STEP = 2;

export default function ConfigScreen() {
  const router = useRouter();
  const {
    fontSize,
    setFontSize,
    numHomeApps,
    setNumHomeApps,
    leftSwipeApp,
    rightSwipeApp,
    setLeftSwipeApp,
    setRightSwipeApp
  } = useFontSize();

  const [appSelectorVisible, setAppSelectorVisible] = useState(false);
  const [selectedSwipeType, setSelectedSwipeType] = useState<'left' | 'right' | null>(null);

  // Handle Android back button - go back to home
  useEffect(() => {
    const backAction = () => {
      router.back();
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [router]);

  // Handle Home button behavior - navigate to main screen when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // When app becomes active (e.g., from home button press), go to main screen
        router.push('/');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [router]);

  const handleFontSizeIncrement = () => {
    if (fontSize < FONT_SIZE_MAX) {
      setFontSize(fontSize + FONT_SIZE_STEP);
    }
  };

  const handleFontSizeDecrement = () => {
    if (fontSize > FONT_SIZE_MIN) {
      setFontSize(fontSize - FONT_SIZE_STEP);
    }
  };

  const handleNumHomeAppsIncrement = () => {
    if (numHomeApps < 10) {
      setNumHomeApps(numHomeApps + 1);
    }
  };

  const handleNumHomeAppsDecrement = () => {
    if (numHomeApps > 0) {
      setNumHomeApps(numHomeApps - 1);
    }
  };

  const handleSwipeAppPress = (type: 'left' | 'right') => {
    setSelectedSwipeType(type);
    setAppSelectorVisible(true);
  };

  const handleSwipeAppSelect = (app: { packageName: string; originalName: string; nickname?: string }) => {
    if (selectedSwipeType === 'left') {
      setLeftSwipeApp(app);
    } else if (selectedSwipeType === 'right') {
      setRightSwipeApp(app);
    }
    setAppSelectorVisible(false);
    setSelectedSwipeType(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: fontSize + 6 }]}>Config</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { fontSize: fontSize + 2 }]}>Font Size</Text>

        <NumberInput
          value={fontSize}
          onIncrement={handleFontSizeIncrement}
          onDecrement={handleFontSizeDecrement}
          min={FONT_SIZE_MIN}
          max={FONT_SIZE_MAX}
          fontSize={fontSize}
        />

        <Text style={[styles.sectionTitle, { fontSize: fontSize + 2, marginTop: 40 }]}>Home Apps</Text>

        <NumberInput
          value={numHomeApps}
          onIncrement={handleNumHomeAppsIncrement}
          onDecrement={handleNumHomeAppsDecrement}
          min={0}
          max={10}
          fontSize={fontSize}
        />

        <Text style={[styles.sectionTitle, { fontSize: fontSize + 2, marginTop: 40 }]}>Swipe Gestures</Text>

        <View style={styles.swipeSection}>
          <TouchableOpacity
            style={styles.swipeOption}
            onPress={() => handleSwipeAppPress('left')}
            activeOpacity={0.6}
          >
            <Text style={[styles.swipeLabel, { fontSize }]}>Swipe Left</Text>
            <Text style={[styles.swipeAppName, { fontSize }]}>
              {leftSwipeApp.nickname || leftSwipeApp.originalName}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.swipeOption}
            onPress={() => handleSwipeAppPress('right')}
            activeOpacity={0.6}
          >
            <Text style={[styles.swipeLabel, { fontSize }]}>Swipe Right</Text>
            <Text style={[styles.swipeAppName, { fontSize }]}>
              {rightSwipeApp.nickname || rightSwipeApp.originalName}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Selector Modal */}
      <AppSelector
        visible={appSelectorVisible}
        onClose={() => {
          setAppSelectorVisible(false);
          setSelectedSwipeType(null);
        }}
        onSelectApp={handleSwipeAppSelect}
        currentApp={
          selectedSwipeType === 'left' ? leftSwipeApp :
          selectedSwipeType === 'right' ? rightSwipeApp : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    color: '#fff',
    fontWeight: '300',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: '300',
    marginBottom: 20,
  },

  swipeSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 10,
  },
  swipeOption: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  swipeLabel: {
    color: '#fff',
    fontWeight: '300',
    textAlign: 'center',
  },
  swipeAppName: {
    color: '#fff',
    fontWeight: '300',
    marginTop: 10,
    textAlign: 'center',
  },
});