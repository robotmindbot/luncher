import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useFontSize } from '../app/_layout';
import AppLauncherWrapper, { AppInfo } from '../modules/app-launcher';

interface AppSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectApp: (app: { packageName: string; originalName: string; nickname?: string }) => void;
  currentApp?: { packageName: string; originalName: string; nickname?: string };
}

export default function AppSelector({ visible, onClose, onSelectApp, currentApp }: AppSelectorProps) {
  const { fontSize } = useFontSize();
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [filteredApps, setFilteredApps] = useState<AppInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      loadApps();
      if (currentApp && currentApp.packageName) {
        setSelectedApp({ name: currentApp.originalName, packageName: currentApp.packageName });
        setNickname(currentApp.nickname || '');
      } else {
        setSelectedApp(null);
        setNickname('');
      }
      // Focus the search input when modal opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      // Clear search when modal closes
      setSearchQuery('');
    }
  }, [visible, currentApp]);



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

  // Auto-select when there's only one search result
  useEffect(() => {
    if (searchQuery.trim() && filteredApps.length === 1) {
      handleAppSelect(filteredApps[0]);
    }
  }, [filteredApps, searchQuery]);

  const loadApps = async () => {
    try {
      const realApps = await AppLauncherWrapper.getInstalledApps();
      const sortedApps = realApps.sort((a, b) => a.name.localeCompare(b.name));
      setApps(sortedApps);
      setFilteredApps(sortedApps);
    } catch (error) {
      console.error('Failed to load apps:', error);
    }
  };

  const handleAppSelect = (app: AppInfo) => {
    setSelectedApp(app);
    setNickname(''); // Reset nickname when selecting new app
  };

  const handleSave = () => {
    if (selectedApp) {
      onSelectApp({
        packageName: selectedApp.packageName,
        originalName: selectedApp.name,
        nickname: nickname.trim() || undefined,
      });
    }
    onClose();
  };

  const handleRemove = () => {
    onSelectApp({ packageName: '', originalName: 'select' });
    onClose();
  };

  const renderAppItem = ({ item }: { item: AppInfo }) => (
    <TouchableOpacity
      style={[
        styles.appItem,
        selectedApp?.packageName === item.packageName && styles.selectedAppItem,
      ]}
      onPress={() => handleAppSelect(item)}
      activeOpacity={0.6}
    >
      <Text style={[styles.appName, { fontSize }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity onPress={onClose}>
            <View style={styles.drawerHandle} />
          </TouchableOpacity>

          <TextInput
            style={[styles.searchInput, { fontSize }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            caretHidden={true}
            ref={searchInputRef}
          />

          <FlatList
            data={filteredApps}
            renderItem={renderAppItem}
            keyExtractor={(item) => item.packageName}
            showsVerticalScrollIndicator={false}
            style={styles.appsList}
          />

          {selectedApp && (
            <View style={styles.selectedSection}>
              <Text style={[styles.selectedLabel, { fontSize }]}>Selected: {selectedApp.name}</Text>
              <TextInput
                style={[styles.nicknameInput, { fontSize }]}
                placeholder="Nickname (optional)"
                placeholderTextColor="#666"
                value={nickname}
                onChangeText={setNickname}
                autoCorrect={false}
                autoCapitalize="words"
              />
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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontWeight: '300',
  },
  searchInput: {
    height: 48,
    marginBottom: 20,
    paddingHorizontal: 16,
    color: '#fff',
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
  appsList: {
    maxHeight: 300,
  },
  appItem: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  selectedAppItem: {
    backgroundColor: '#222',
    borderRadius: 8,
  },
  appName: {
    color: '#fff',
    fontWeight: '300',
  },
  selectedSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  selectedLabel: {
    color: '#fff',
    marginBottom: 10,
    fontWeight: '300',
  },
  nicknameInput: {
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