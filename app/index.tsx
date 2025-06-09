import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Simple mock data for testing
const mockApps = [
  { name: 'Settings', packageName: 'com.android.settings' },
  { name: 'Calculator', packageName: 'com.android.calculator2' },
  { name: 'Camera', packageName: 'com.android.camera' },
  { name: 'Gallery', packageName: 'com.android.gallery3d' },
  { name: 'Clock', packageName: 'com.android.deskclock' },
  { name: 'Phone', packageName: 'com.android.phone' },
  { name: 'Messages', packageName: 'com.android.messaging' },
  { name: 'Contacts', packageName: 'com.android.contacts' },
  { name: 'Chrome', packageName: 'com.android.chrome' },
  { name: 'Play Store', packageName: 'com.android.vending' },
];

interface AppInfo {
  name: string;
  packageName: string;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary componentDidCatch:', error, errorInfo);
    // Log to console for adb logcat
    console.log('=== CRASH DETAILS ===');
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
    console.log('Component Stack:', errorInfo.componentStack);
    console.log('=== END CRASH DETAILS ===');
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.errorContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <Text style={styles.errorTitle}>App Error</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'Unknown error occurred'}
          </Text>
          <Text style={styles.errorStack}>
            {this.state.error?.stack || 'No stack trace available'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

function LauncherHome() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [filteredApps, setFilteredApps] = useState<AppInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('LauncherHome component mounted');
    loadApps();
  }, []);

  useEffect(() => {
    try {
      console.log('Filtering apps, search query:', searchQuery);
      if (searchQuery.trim() === '') {
        setFilteredApps(apps);
      } else {
        const filtered = apps.filter(app =>
          app.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredApps(filtered);
      }
    } catch (error) {
      console.error('Error in search filter:', error);
      setError(`Search error: ${error}`);
    }
  }, [searchQuery, apps]);

  const loadApps = async () => {
    try {
      console.log('Starting to load apps...');
      setLoading(true);
      setError(null);

      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Mock apps loaded:', mockApps.length);
      const sortedApps = mockApps.sort((a, b) => a.name.localeCompare(b.name));
      setApps(sortedApps);
      setFilteredApps(sortedApps);
      console.log('Apps set successfully');
    } catch (error) {
      console.error('Error loading apps:', error);
      setError(`Loading error: ${error}`);
    } finally {
      setLoading(false);
      console.log('Loading complete');
    }
  };

  const launchApp = (packageName: string, appName: string) => {
    try {
      console.log(`Attempting to launch app: ${appName} (${packageName})`);
      Alert.alert('Launch App', `Would launch: ${appName}\nPackage: ${packageName}`);
    } catch (error) {
      console.error('Error launching app:', error);
      setError(`Launch error: ${error}`);
    }
  };

  const renderAppItem = ({ item }: { item: AppInfo }) => {
    try {
      return (
        <TouchableOpacity
          style={styles.appItem}
          onPress={() => launchApp(item.packageName, item.name)}
          activeOpacity={0.7}
        >
          <Text style={styles.appName}>
            {item.name}
          </Text>
        </TouchableOpacity>
      );
    } catch (error) {
      console.error('Error rendering app item:', error);
      return (
        <View style={styles.appItem}>
          <Text style={styles.errorText}>Error rendering app</Text>
        </View>
      );
    }
  };

  const renderSeparator = () => <View style={styles.separator} />;

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadApps}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Text style={styles.loadingText}>Loading applications...</Text>
        <Text style={styles.debugText}>Check console logs for details</Text>
      </SafeAreaView>
    );
  }

  try {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* Debug Info */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            Debug: {filteredApps.length} apps loaded
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search apps..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        {/* Apps List */}
        <FlatList
          data={filteredApps}
          renderItem={renderAppItem}
          keyExtractor={(item) => item.packageName}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={renderSeparator}
        />

        {/* App Count */}
        <View style={styles.footer}>
          <Text style={styles.appCount}>
            {filteredApps.length} {filteredApps.length === 1 ? 'app' : 'apps'}
          </Text>
        </View>
      </SafeAreaView>
    );
  } catch (error) {
    console.error('Error in render:', error);
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Text style={styles.errorTitle}>Render Error</Text>
        <Text style={styles.errorMessage}>Failed to render launcher</Text>
      </SafeAreaView>
    );
  }
}

// Main component with error boundary
export default function App() {
  return (
    <ErrorBoundary>
      <LauncherHome />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  debugContainer: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 0, 0.1)',
  },
  debugText: {
    color: '#yellow',
    fontSize: 12,
    textAlign: 'center',
  },
  searchContainer: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchInput: {
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  appItem: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  appName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  separator: {
    height: 8,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  appCount: {
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#ff4444',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorMessage: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  errorStack: {
    color: '#999',
    fontSize: 12,
    textAlign: 'left',
    marginBottom: 20,
    maxHeight: 200,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
