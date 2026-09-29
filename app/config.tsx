import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    AppState,
    BackHandler,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import AppSelector from '../components/AppSelector';
import NumberInput from '../components/NumberInput';
import AppLauncherWrapper from '../modules/app-launcher';
import { useFontSize } from './_layout';

const FONT_SIZE_MIN = 12;
const FONT_SIZE_MAX = 36;
const FONT_SIZE_STEP = 2;

export default function ConfigScreen() {
  const router = useRouter();
  const {
    fontSize: homeFontSize,
    setFontSize,
    numHomeApps,
    setNumHomeApps,
    leftSwipeApp,
    rightSwipeApp,
    downSwipeApp,
    setLeftSwipeApp,
    setRightSwipeApp,
    setDownSwipeApp,
    showTime,
    setShowTime,
    showDate,
    setShowDate,
    chineseDate,
    setChineseDate,
    showNextAppointment,
    setShowNextAppointment,
    calendarFilterKeywords,
    setCalendarFilterKeywords,
  } = useFontSize();

  const [appSelectorVisible, setAppSelectorVisible] = useState(false);
  const [selectedSwipeType, setSelectedSwipeType] = useState<'left' | 'right' | 'down' | null>(null);
  const fontSize = 18;

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
    let wasInBackground = false;

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        wasInBackground = true;
      } else if (nextAppState === 'active' && wasInBackground) {
        // When app becomes active from background (e.g., home button press), go to main screen
        wasInBackground = false;
        router.push('/');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [router]);

  const handleFontSizeIncrement = () => {
    if (homeFontSize < FONT_SIZE_MAX) {
      setFontSize(homeFontSize + FONT_SIZE_STEP);
    }
  };

  const handleFontSizeDecrement = () => {
    if (homeFontSize > FONT_SIZE_MIN) {
      setFontSize(homeFontSize - FONT_SIZE_STEP);
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

  const handleSwipeAppPress = (type: 'left' | 'right' | 'down') => {
    setSelectedSwipeType(type);
    setAppSelectorVisible(true);
  };

  const handleSwipeAppSelect = (app: { packageName: string; originalName: string; alias?: string }) => {
    if (selectedSwipeType === 'left') {
      setLeftSwipeApp(app);
    } else if (selectedSwipeType === 'right') {
      setRightSwipeApp(app);
    } else if (selectedSwipeType === 'down') {
      setDownSwipeApp(app);
    }
    setAppSelectorVisible(false);
    setSelectedSwipeType(null);
  };

  const toggleNextAppointment = async (enabled: boolean) => {
    if (enabled && !(await AppLauncherWrapper.requestCalendarPermission())) return;
    setShowNextAppointment(enabled);
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
          value={homeFontSize}
          onIncrement={handleFontSizeIncrement}
          onDecrement={handleFontSizeDecrement}
          min={FONT_SIZE_MIN}
          max={FONT_SIZE_MAX}
          fontSize={fontSize}
        />

        <Text style={[styles.sectionTitle, { fontSize: fontSize + 2, marginTop: 40 }]}>Home Screen</Text>
        <View style={styles.displayOption}>
          <Text style={[styles.swipeLabel, { fontSize }]}>Show time</Text>
          <Switch value={showTime} onValueChange={setShowTime} {...switchColors(showTime)} />
        </View>
        <View style={styles.displayOption}>
          <Text style={[styles.swipeLabel, { fontSize }]}>Show date</Text>
          <Switch value={showDate} onValueChange={setShowDate} {...switchColors(showDate)} />
        </View>
        {showDate && <View style={styles.displayOption}>
          <Text style={[styles.swipeLabel, { fontSize }]}>Chinese date format (12月31日)</Text>
          <Switch value={chineseDate} onValueChange={setChineseDate} {...switchColors(chineseDate)} />
        </View>}
        {showDate && <View style={styles.displayOption}>
          <Text style={[styles.swipeLabel, { fontSize }]}>Show next calendar appointment</Text>
          <Switch value={showNextAppointment} onValueChange={toggleNextAppointment} {...switchColors(showNextAppointment)} />
        </View>}
        {showDate && showNextAppointment && <TextInput
          style={[styles.keywordInput, { fontSize }]}
          placeholder="Hide events with keywords (comma separated)"
          placeholderTextColor="#666"
          value={calendarFilterKeywords}
          onChangeText={setCalendarFilterKeywords}
          autoCorrect={false}
          autoCapitalize="none"
        />}

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
              {leftSwipeApp.alias || leftSwipeApp.originalName}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.swipeOption}
            onPress={() => handleSwipeAppPress('right')}
            activeOpacity={0.6}
          >
            <Text style={[styles.swipeLabel, { fontSize }]}>Swipe Right</Text>
            <Text style={[styles.swipeAppName, { fontSize }]}>
              {rightSwipeApp.alias || rightSwipeApp.originalName}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.swipeOption}
            onPress={() => handleSwipeAppPress('down')}
            activeOpacity={0.6}
          >
            <Text style={[styles.swipeLabel, { fontSize }]}>Swipe Down</Text>
            <Text style={[styles.swipeAppName, { fontSize }]}>
              {downSwipeApp.alias || downSwipeApp.originalName}
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
          selectedSwipeType === 'right' ? rightSwipeApp :
          selectedSwipeType === 'down' ? downSwipeApp : undefined
        }
        allowAlias={false}
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
  displayOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  keywordInput: { minHeight: 48, marginTop: 12, paddingHorizontal: 14, color: '#fff', backgroundColor: '#111', borderRadius: 8 },
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

function switchColors(value: boolean) {
  return { trackColor: { false: '#444', true: '#fff' }, thumbColor: value ? '#000' : '#fff', ios_backgroundColor: '#444' };
}
