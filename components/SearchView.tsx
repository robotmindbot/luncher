import React, { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
} from 'react-native';
import AppLauncherWrapper from '../modules/app-launcher';

interface App {
  name: string;
  packageName: string;
  alias?: string;
}

interface SearchViewProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  filteredApps: App[];
  onAppPress: (packageName: string) => void;
  loading: boolean;
  isOpen: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  error?: string;
}

const keyExtractor = (item: App) => item.packageName;

const SearchView = forwardRef<TextInput, SearchViewProps>(({
  searchQuery,
  onSearchQueryChange,
  filteredApps,
  onAppPress,
  loading,
  isOpen,
  onRefresh,
  refreshing = false,
  error,
}, ref) => {
  const fontSize = 18;
  const internalRef = useRef<TextInput>(null);
  const focusFrame = useRef<number | null>(null);

  // Use imperative handle to expose the ref with null safety
  useImperativeHandle(ref, () => internalRef.current!, []);

  // Focus as soon as the drawer opens so the keyboard starts immediately.
  useLayoutEffect(() => {
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    if (isOpen && internalRef.current) {
      focusFrame.current = requestAnimationFrame(() => internalRef.current?.focus());
    } else if (!isOpen && internalRef.current) {
      internalRef.current.blur();
    }
    return () => {
      if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    };
  }, [isOpen]);

  const renderAppItem = useCallback(({ item }: { item: App }) => (
    <TouchableOpacity
      style={styles.appItem}
      onPress={() => onAppPress(item.packageName)}
      activeOpacity={0.6}
    >
      <Text style={[styles.appName, { fontSize }]}>{item.name}{item.alias ? ` (${item.alias})` : ''}</Text>
    </TouchableOpacity>
  ), [fontSize, onAppPress]);

  return (
    <>
      <TextInput
        ref={internalRef}
        onFocus={() => AppLauncherWrapper.finishKeyboardShowImmediately()}
        style={[styles.searchInput, { fontSize, lineHeight: fontSize * 1.4, height: Math.max(56, fontSize * 1.4 + 24) }]}
        value={searchQuery}
        onChangeText={onSearchQueryChange}
        autoCorrect={false}
        autoCapitalize="none"
        caretHidden={true}
        underlineColorAndroid="transparent"
        selectionColor="transparent"
        textContentType="none"
        autoComplete="off"
        spellCheck={false}
        textAlignVertical="center"
      />

      {loading ? <ActivityIndicator color="#fff" /> : (
        <FlatList
          data={filteredApps}
          renderItem={renderAppItem}
          keyExtractor={keyExtractor}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyMessage}>
              {error || (searchQuery.trim() ? 'No matching apps' : 'No apps found')}
            </Text>
          }
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#fff"
                colors={["#fff"]}
                progressBackgroundColor="#333"
              />
            ) : undefined
          }
        />
      )}
    </>
  );
});

SearchView.displayName = 'SearchView';

export default SearchView;

const styles = StyleSheet.create({
  searchInput: {
    height: 56,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 0,
    color: '#fff',
    backgroundColor: 'transparent',
    borderRadius: 0,
    textDecorationLine: 'none',
    borderBottomWidth: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
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
  emptyMessage: {
    color: '#888',
    paddingHorizontal: 4,
    textAlign: 'center',
  },
});
