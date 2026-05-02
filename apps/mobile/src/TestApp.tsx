import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const TestApp = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ App is Working!</Text>
      <Text style={styles.subtitle}>If you see this, React Native Web is running correctly.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
