import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFontSize } from '../app/_layout';
import AppLauncherWrapper, { AppInfo } from '../modules/app-launcher';
import SearchView from './SearchView';

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

  useEffect(() => {
    if (visible) {
      setSearchQuery(''); // Clear search query when modal opens
      loadApps();
      if (currentApp && currentApp.packageName) {
        setSelectedApp({ name: currentApp.originalName, packageName: currentApp.packageName });
        setNickname(currentApp.nickname || '');
      } else {
        setSelectedApp(null);
        setNickname('');
      }
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

  const handleAppPress = (packageName: string) => {
    const app = filteredApps.find(a => a.packageName === packageName);
    if (app) {
      setSelectedApp(app);
      setNickname(''); // Reset nickname when selecting new app
    }
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

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeText, { fontSize }]}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { fontSize: fontSize + 2 }]}>Select App</Text>
          </View>

          <View style={styles.searchContainer}>
            <SearchView
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              filteredApps={filteredApps.map(app => ({ name: app.name, packageName: app.packageName }))}
              onAppPress={handleAppPress}
              loading={false}
              fontSize={fontSize}
              isOpen={true}
            />
          </View>

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
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: '#000',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
    maxHeight: 320,
    marginBottom: 20,
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