import '@/i18n';
import * as Sentry from '@sentry/react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const { t } = useTranslation();

  const handleTestSentry = () => {
    Alert.alert(
      "Test Sentry",
      "This will throw an error to test Sentry reporting. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Test Error",
          onPress: () => {
            throw new Error('Hello, Sentry! This is a test error from Waza app.');
          }
        }
      ]
    );
  };

  const handleTestSentryMessage = () => {
    Sentry.captureMessage('Test message from Waza app', 'info');
    Alert.alert("Success", "Test message sent to Sentry!");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to Waza</Text>
      <Text style={styles.slogan}>{t('slogan')}</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleTestSentryMessage}>
          <Text style={styles.buttonText}>Test Sentry Message</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.errorButton]} onPress={handleTestSentry}>
          <Text style={styles.buttonText}>Test Sentry Error</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#fff',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  slogan: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  buttonContainer: {
    gap: 15,
    width: '100%',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
