import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    BackHandler,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import AppSelector from '../components/AppSelector';
import { useFontSize } from './_layout';

const FONT_SIZES = [
  { label: 'Small', value: 14 },
  { label: 'Medium', value: 18 },
  { label: 'Large', value: 22 },
  { label: 'Extra Large', value: 26 },
];

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

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      // If AppSelector is visible, close it
      if (appSelectorVisible) {
        setAppSelectorVisible(false);
        setSelectedSwipeType(null);
        return true;
      }
      // Otherwise allow default behavior (go back to previous screen)
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [appSelectorVisible]);

  const handleFontSizeSelect = (size: number) => {
    setFontSize(size);
  };

  const handleNumHomeAppsSelect = (num: number) => {
    setNumHomeApps(num);
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

        <View style={styles.optionsRow}>
          {FONT_SIZES.map((size) => (
            <TouchableOpacity
              key={size.value}
              style={styles.option}
              onPress={() => handleFontSizeSelect(size.value)}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.optionText,
                  { fontSize: size.value },
                  fontSize === size.value && styles.selectedOptionText,
                ]}
              >
                {size.label.charAt(0)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { fontSize: fontSize + 2, marginTop: 40 }]}>Home Apps</Text>

                        <View style={styles.counterRow}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={numHomeApps > 0 ? () => handleNumHomeAppsSelect(numHomeApps - 1) : undefined}
            activeOpacity={numHomeApps > 0 ? 0.6 : 1}
            disabled={numHomeApps === 0}
          >
            <Text style={[
              styles.counterButtonText,
              { fontSize },
              numHomeApps === 0 && styles.hiddenButton
            ]}>−</Text>
          </TouchableOpacity>

          <Text style={[styles.counterValue, { fontSize }]}>{numHomeApps}</Text>

          <TouchableOpacity
            style={styles.counterButton}
            onPress={numHomeApps < 10 ? () => handleNumHomeAppsSelect(numHomeApps + 1) : undefined}
            activeOpacity={numHomeApps < 10 ? 0.6 : 1}
            disabled={numHomeApps === 10}
          >
            <Text style={[
              styles.counterButtonText,
              { fontSize },
              numHomeApps === 10 && styles.hiddenButton
            ]}>+</Text>
          </TouchableOpacity>
        </View>

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
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  option: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  optionText: {
    color: '#fff',
    fontWeight: '300',
  },
  selectedOptionText: {
    color: '#fff',
    textDecorationLine: 'underline',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  counterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  counterButtonText: {
    color: '#fff',
    fontWeight: '300',
  },
  hiddenButton: {
    opacity: 0,
  },
  counterValue: {
    color: '#fff',
    fontWeight: '300',
    marginHorizontal: 40,
    textAlign: 'center',
    minWidth: 30,
  },
  swipeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  swipeOption: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  swipeLabel: {
    color: '#fff',
    fontWeight: '300',
  },
  swipeAppName: {
    color: '#fff',
    fontWeight: '300',
    marginTop: 10,
  },
});