import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, StyleSheet, ScrollView, Platform, useWindowDimensions, KeyboardAvoidingView } from 'react-native';

const AutocompleteSelect = ({ label, placeholder, data, value, onChange, error, onBlur }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [query, setQuery] = useState(value || '');
  const [filteredData, setFilteredData] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    if (value) setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!query && !showDropdown) {
       setFilteredData(data); // Show all initially or when empty
       return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = data.filter(item => 
      item.label.toLowerCase().includes(lowerQuery)
    );
    setFilteredData(filtered);
    setHighlightedIndex(-1);
  }, [query, data, showDropdown]);

  const handleSelect = (item) => {
    setQuery(item.label);
    onChange(item);
    setShowDropdown(false);
    if (!isMobile) inputRef.current?.blur();
  };

  const handleKeyPress = (e) => {
    if (isMobile) return;
    if (e.nativeEvent.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredData.length - 1));
    } else if (e.nativeEvent.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.nativeEvent.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredData[highlightedIndex]) {
        handleSelect(filteredData[highlightedIndex]);
      }
    } else if (e.nativeEvent.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const renderOption = (item, index, isSelected = false) => (
    <TouchableOpacity
      key={`${item.group}-${item.value}-${index}`}
      style={[
        styles.item, 
        (index === highlightedIndex || isSelected) && styles.itemHighlighted
      ]}
      onPress={() => handleSelect(item)}
    >
      <Text style={styles.itemText}>{item.label}</Text>
      <Text style={styles.itemGroup}>{item.group}</Text>
    </TouchableOpacity>
  );

  if (isMobile) {
    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TouchableOpacity 
          style={[styles.input, error && styles.inputError, { justifyContent: 'center' }]} 
          onPress={() => setShowDropdown(true)}
        >
          <Text style={{ color: query ? '#333' : '#999', fontSize: 16 }}>
            {query || placeholder}
          </Text>
        </TouchableOpacity>
        {error && <Text style={styles.errorText}>{error}</Text>}

        <Modal visible={showDropdown} animationType="slide" onRequestClose={() => setShowDropdown(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Seleccionar'}</Text>
              <TouchableOpacity onPress={() => setShowDropdown(false)} style={styles.closeBtn}>
                <Text style={styles.closeText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalSearchContainer}>
                <TextInput
                    style={styles.modalInput}
                    placeholder={placeholder}
                    value={query}
                    onChangeText={setQuery}
                    autoFocus
                    placeholderTextColor="#999"
                />
            </View>

            <FlatList
              data={filteredData}
              keyExtractor={(item, index) => `${item.value}-${index}`}
              renderItem={({ item, index }) => renderOption(item, index)}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                  <View style={styles.item}>
                    <Text style={styles.noResultText}>No se encontraron resultados</Text>
                  </View>
              }
            />
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input, 
            error && styles.inputError,
            isFocused && styles.inputFocused
          ]}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setShowDropdown(true);
            if (!text) onChange(null);
          }}
          onFocus={() => { setIsFocused(true); setShowDropdown(true); }}
          onBlur={() => {
              setIsFocused(false);
              setTimeout(() => {
                 if (!isMobile) setShowDropdown(false);
                 if (onBlur) onBlur();
              }, 250);
          }}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          placeholderTextColor="#999"
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {showDropdown && filteredData.length > 0 && (
        <View 
            style={styles.dropdownDesktop}
            {...(Platform.OS === 'web' ? { onMouseDown: (e) => e.preventDefault() } : {})}
        >
          <FlatList
            data={filteredData}
            keyExtractor={(item, index) => `${item.value}-${index}`}
            renderItem={({ item, index }) => renderOption(item, index)}
            keyboardShouldPersistTaps="always"
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            nestedScrollEnabled={true}
            style={{ maxHeight: 250 }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    zIndex: 1000, // Ensure container is above siblings
    position: 'relative', // Context for z-index
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontWeight: '500',
  },
  inputContainer: {
    position: 'relative',
    zIndex: 1001,
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputFocused: {
    borderColor: '#070571',
    outlineStyle: 'none',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  dropdownDesktop: {
    position: 'absolute',
    top: '100%',
    marginTop: 4,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 250,
    zIndex: 9999,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
    elevation: 5,
  },
  scrollView: {
    flex: 1,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemHighlighted: {
    backgroundColor: '#e9ecef',
  },
  itemText: {
    fontSize: 14,
    color: '#333',
  },
  itemGroup: {
      fontSize: 10,
      color: '#999',
      textTransform: 'uppercase'
  },
  noResultText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeBtn: {
    padding: 5,
  },
  closeText: {
    color: '#007bff',
    fontSize: 16,
  },
  modalSearchContainer: {
    padding: 10,
    backgroundColor: '#f8f9fa',
  },
  modalInput: {
      height: 45,
      backgroundColor: '#fff',
      borderRadius: 8,
      paddingHorizontal: 15,
      borderWidth: 1,
      borderColor: '#ddd',
      fontSize: 16,
      color: '#333'
  }
});

export default AutocompleteSelect;
