import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';

const ToastNotification = ({ message, visible, onHide, duration = 2000, type = 'success' }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(-100);

      // Animacja pojawienia się
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide po określonym czasie
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, message]); // Add message to dependencies to reset on new message

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  if (!visible) return null;

  const backgroundColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3';

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            backgroundColor,
          },
        ]}
        pointerEvents="auto"
      >
        <View style={styles.content}>
          <Text style={styles.icon}>{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    elevation: 99999,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'web' ? 20 : 50,
  },
  container: {
    minWidth: Platform.OS === 'web' ? 300 : undefined,
    maxWidth: Platform.OS === 'web' ? 500 : '90%',
    marginHorizontal: Platform.OS === 'web' ? undefined : 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    color: '#fff',
    marginRight: 12,
    fontWeight: 'bold',
  },
  message: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
});

export default ToastNotification;
