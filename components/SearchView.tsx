import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
} from 'react-native';

interface App {
  name: string;
  packageName: string;
}

interface SearchViewProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  filteredApps: App[];
  onAppPress: (packageName: string) => void;
  loading: boolean;
  fontSize: number;
  isOpen: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const SearchView = forwardRef<TextInput, SearchViewProps>(({
  searchQuery,
  onSearchQueryChange,
  filteredApps,
  onAppPress,
  loading,
  fontSize,
  isOpen,
  onRefresh,
  refreshing = false
}, ref) => {
  const internalRef = useRef<TextInput>(null);

  // Use imperative handle to expose the ref with null safety
  useImperativeHandle(ref, () => internalRef.current!, []);

  // Focus the input when the search view opens - with longer delay for drawer animation
  useEffect(() => {
    if (isOpen && internalRef.current) {
      // Longer delay to ensure the drawer animation completes
      const timer = setTimeout(() => {
        internalRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    } else if (!isOpen && internalRef.current) {
      // Blur when closing
      internalRef.current.blur();
    }
  }, [isOpen]);

  const renderAppItem = ({ item }: { item: App }) => (
    <TouchableOpacity
      style={styles.appItem}
      onPress={() => onAppPress(item.packageName)}
      activeOpacity={0.6}
    >
      <Text style={[styles.appName, { fontSize }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <TextInput
        ref={internalRef}
        style={[styles.searchInput, { fontSize, lineHeight: fontSize * 1.4 }]}
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

      {!loading && (
        <FlatList
          data={filteredApps}
          renderItem={renderAppItem}
          keyExtractor={(item, index) => `${item.packageName}_${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
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
    paddingVertical: 12,
    color: '#fff',
    backgroundColor: 'transparent',
    borderRadius: 0,
    textDecorationLine: 'none',
    borderBottomWidth: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    outlineStyle: 'none',
    elevation: 0,
    shadowOpacity: 0,
  } as any,
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
});