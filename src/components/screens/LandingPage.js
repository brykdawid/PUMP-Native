import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

function LandingPage({ onSelectMode, targetDate }) {
  if (__DEV__) console.log('LandingPage render');
  if (__DEV__) console.log('onSelectMode:', typeof onSelectMode);
  if (__DEV__) console.log('targetDate:', targetDate);

  const handleGenerated = () => {
    if (__DEV__) console.log('Generated clicked');
    onSelectMode('generated');
  };

  const handleCustom = () => {
    if (__DEV__) console.log('Custom clicked');
    onSelectMode('custom');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">Wybierz Tryb Treningu</Text>
          <Text style={styles.subtitle} numberOfLines={2} ellipsizeMode="tail">
            Jak chcesz zaplanować swój trening?
          </Text>
        </View>

        <View style={styles.modesContainer}>
          <TouchableOpacity
            onPress={handleGenerated}
            style={styles.modeCard}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#9333ea', '#7c3aed']}
              style={styles.modeGradient}
            >
              <Ionicons name="flash" size={48} color="#ffffff" />
              <Text style={styles.modeTitle} numberOfLines={2} ellipsizeMode="tail">Wygeneruj Trening</Text>
              <Text style={styles.modeDescription} numberOfLines={3} ellipsizeMode="tail">
                Automatycznie wygenerowany plan dla wybranych partii mięśniowych
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCustom}
            style={styles.modeCard}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#0891b2', '#0e7490']}
              style={styles.modeGradient}
            >
              <Ionicons name="construct" size={48} color="#ffffff" />
              <Text style={styles.modeTitle} numberOfLines={2} ellipsizeMode="tail">Własny Trening</Text>
              <Text style={styles.modeDescription} numberOfLines={3} ellipsizeMode="tail">
                Stwórz spersonalizowany plan treningowy od podstaw
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  subtitle: {
    fontSize: 16,
    paddingHorizontal: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
  modesContainer: {
    gap: 20,
  },
  modeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modeGradient: {
    padding: 32,
    alignItems: 'center',
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  modeDescription: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: 8,
    lineHeight: 20,
  },
});

export default LandingPage;