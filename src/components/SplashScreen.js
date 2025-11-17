// src/components/SplashScreen.js
// Animowany splash screen z progress indicator

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const SplashScreen = ({ progress = 0, message = 'Ładowanie...' }) => {
  // Animacje
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animacja wejścia
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Ciągła rotacja ikony ładowania
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Animacja progresu
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient
      colors={['#9333ea', '#7c3aed', '#6d28d9']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo i nazwa aplikacji */}
        <View style={styles.logoContainer}>
          <Ionicons name="barbell" size={80} color="white" />
          <Text style={styles.title}>PUMP</Text>
          <Text style={styles.subtitle}>Workout</Text>
        </View>

        {/* Animowana ikona ładowania */}
        <Animated.View
          style={[
            styles.loadingIcon,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <Ionicons name="sync-circle" size={50} color="rgba(255, 255, 255, 0.8)" />
        </Animated.View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>

        {/* Status message */}
        <Text style={styles.message}>{message}</Text>

        {/* Bottom tagline */}
        <View style={styles.bottomContainer}>
          <Text style={styles.tagline}>Przygotowuję Twoją aplikację...</Text>
        </View>
      </Animated.View>

      {/* Animated background elements */}
      <View style={styles.backgroundElements}>
        {[...Array(3)].map((_, i) => (
          <AnimatedCircle key={i} delay={i * 400} />
        ))}
      </View>
    </LinearGradient>
  );
};

// Animowany element dekoracyjny w tle
const AnimatedCircle = ({ delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 3000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 3000,
            delay,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.circle,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '300',
    letterSpacing: 4,
  },
  loadingIcon: {
    marginVertical: 30,
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 20,
    width: 250,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
  message: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    marginTop: 20,
    fontWeight: '500',
  },
  bottomContainer: {
    marginTop: 60,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '300',
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  circle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 300,
    height: 300,
    marginLeft: -150,
    marginTop: -150,
    borderRadius: 150,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default SplashScreen;
