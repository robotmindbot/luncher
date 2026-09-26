import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  BackHandler,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFontSize } from '../app/_layout';
import AppLauncherWrapper, { type AppInfo } from '../modules/app-launcher';
import SearchView from './SearchView';

interface AppSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectApp: (app: { packageName: string; originalName: string; alias?: string }) => void;
  currentApp?: { packageName: string; originalName: string; alias?: string };
  allowAlias?: boolean;
}

export default function AppSelector({ visible, onClose, onSelectApp, currentApp, allowAlias = true }: AppSelectorProps) {
  const { appAliases } = useFontSize();
  const fontSize = 18;
  const searchInputRef = useRef<TextInput>(null);
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [alias, setAlias] = useState('');
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | undefined>();
  const searchableApps = useMemo(() => apps.map(app => [[app.name, appAliases[app.packageName]].filter(Boolean).join(' ').toLowerCase(), app] as const), [apps, appAliases]);
  const filteredApps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (query ? searchableApps.filter(([name]) => name.includes(query)).map(([, app]) => app) : apps)
      .map(app => ({ ...app, alias: appAliases[app.packageName] }));
  }, [apps, searchableApps, searchQuery, appAliases]);

  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      if (currentApp && currentApp.packageName) {
        setSelectedApp({ name: currentApp.originalName, packageName: currentApp.packageName });
        setAlias(appAliases[currentApp.packageName] || currentApp.alias || '');
      } else {
        setSelectedApp(null);
        setAlias('');
      }
    }
  }, [visible, currentApp, appAliases]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(undefined);
    AppLauncherWrapper.getInstalledApps().then(installedApps => {
      if (!cancelled) setApps(installedApps);
    }).catch(error => {
      if (cancelled) return;
      setApps([]);
      setLoadError('Could not load installed apps. Try again later.');
      console.error('Failed to load apps:', error);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [visible]);

  // Handle Android back button in modal
  useEffect(() => {
    if (visible) {
      const backAction = () => {
        onClose();
        return true; // Prevent default behavior
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }
  }, [visible, onClose]);

  // Handle Home button behavior - close modal when app becomes active from background
  useEffect(() => {
    if (visible) {
      let wasInBackground = false;

      const handleAppStateChange = (nextAppState: string) => {
        if (nextAppState === 'background') {
          wasInBackground = true;
        } else if (nextAppState === 'active' && wasInBackground) {
          // When app becomes active from background (home button), close modal
          wasInBackground = false;
          onClose();
        }
      };

      const subscription = AppState.addEventListener('change', handleAppStateChange);
      return () => subscription?.remove();
    }
  }, [visible, onClose]);

  const handleAppPress = (packageName: string) => {
    const app = filteredApps.find(a => a.packageName === packageName);
    if (app) {
      setSelectedApp(app);
      setAlias(appAliases[app.packageName] || (currentApp?.packageName === app.packageName ? currentApp.alias || '' : ''));
    }
  };

  const handleSave = () => {
    if (selectedApp) {
      onSelectApp({
        packageName: selectedApp.packageName,
        originalName: selectedApp.name,
        alias: allowAlias ? alias.trim() : undefined,
      });
    }
    onClose();
  };

  const handleRemove = () => {
    onSelectApp({ packageName: '', originalName: 'select' });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="none"
      onShow={() => requestAnimationFrame(() => searchInputRef.current?.focus())}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeText, { fontSize }]}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { fontSize: fontSize + 2 }]}>Select App</Text>
        </View>

        <View style={styles.searchContainer}>
          <SearchView
            ref={searchInputRef}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            filteredApps={filteredApps}
            onAppPress={handleAppPress}
            loading={loading}
            error={loadError}
            isOpen={visible}
          />
        </View>

        {selectedApp && (
          <View style={styles.selectedSection}>
            <Text style={[styles.selectedLabel, { fontSize }]}>Selected: {selectedApp.name}</Text>
            {allowAlias && <TextInput
              style={[styles.aliasInput, { fontSize }]}
              placeholder="Alias (optional)"
              placeholderTextColor="#666"
              value={alias}
              onChangeText={setAlias}
              autoCorrect={false}
              autoCapitalize="words"
            />}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={[styles.buttonText, { fontSize }]}>Save</Text>
              </TouchableOpacity>
              {currentApp?.packageName && (
                <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
                  <Text style={[styles.buttonText, { fontSize }]}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
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
  closeText: {
    color: '#fff',
    marginRight: 20,
    fontWeight: '300',
  },
  title: {
    color: '#fff',
    fontWeight: '300',
  },
  searchContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  selectedSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  selectedLabel: {
    color: '#fff',
    marginBottom: 10,
    fontWeight: '300',
  },
  aliasInput: {
    height: 48,
    marginBottom: 20,
    paddingHorizontal: 16,
    color: '#fff',
    backgroundColor: '#111',
    borderRadius: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  removeButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '300',
  },
});
