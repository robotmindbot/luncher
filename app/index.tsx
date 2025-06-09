import '@/i18n';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to Waza</Text>
      <Text style={styles.slogan}>{t('slogan')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#fff',
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
  },
});
