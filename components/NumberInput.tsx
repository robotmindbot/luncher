import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NumberInputProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min: number;
  max: number;
  fontSize: number;
}

export default function NumberInput({
  value,
  onIncrement,
  onDecrement,
  min,
  max,
  fontSize
}: NumberInputProps) {
  const showMinus = value > min;
  const showPlus = value < max;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, !showMinus && styles.hiddenButton]}
        onPress={onDecrement}
        disabled={!showMinus}
        activeOpacity={0.6}
      >
        <Text style={[styles.buttonText, { fontSize }, !showMinus && styles.hiddenText]}>
          −
        </Text>
      </TouchableOpacity>

      <View style={styles.numberContainer}>
        <Text style={[styles.numberText, { fontSize }]}>
          {value}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, !showPlus && styles.hiddenButton]}
        onPress={onIncrement}
        disabled={!showPlus}
        activeOpacity={0.6}
      >
        <Text style={[styles.buttonText, { fontSize }, !showPlus && styles.hiddenText]}>
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  button: {
    minWidth: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenButton: {
    opacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '300',
  },
  hiddenText: {
    opacity: 0,
  },
  numberContainer: {
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: '#fff',
    fontWeight: '300',
    textAlign: 'center',
  },
});