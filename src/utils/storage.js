// Storage utility that works in both web and native environments
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Detect if we're running in a browser
const isWeb = Platform.OS === 'web';

// Cross-platform alert dialog (informacyjny, tylko OK)
export const alertDialog = (title, message, onPress) => {
  if (isWeb && typeof window !== 'undefined') {
    // Dla web używamy natywnego window.alert ponieważ Alert.alert() nie działa na web
    window.alert(`${title}\n\n${message}`);
    if (onPress) onPress();
  } else {
    // Dla mobile używamy React Native Alert
    Alert.alert(title, message, [{ text: 'OK', onPress }]);
  }
};

// Cross-platform confirm dialog (z przyciskami Anuluj/OK)
export const confirmDialog = (title, message, onConfirm, onCancel) => {
  if (isWeb && typeof window !== 'undefined') {
    // Dla web używamy natywnego window.confirm ponieważ Alert.alert() nie działa na web
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed && onConfirm) {
      onConfirm();
    } else if (!confirmed && onCancel) {
      onCancel();
    }
  } else {
    // Dla mobile używamy React Native Alert
    Alert.alert(
      title,
      message,
      [
        { text: 'Anuluj', style: 'cancel', onPress: onCancel },
        { text: 'OK', style: 'destructive', onPress: onConfirm }
      ]
    );
  }
};

const storage = {
  async getItem(key) {
    try {
      if (isWeb && typeof window !== 'undefined' && window.localStorage) {
        // Use localStorage directly in web browsers
        const value = window.localStorage.getItem(key);
        if (__DEV__) console.log(`📖 [Web localStorage] GET ${key}:`, value ? 'found' : 'null');
        return value;
      }
      // Use AsyncStorage for native apps
      const value = await AsyncStorage.getItem(key);
      if (__DEV__) console.log(`📖 [AsyncStorage] GET ${key}:`, value ? 'found' : 'null');
      return value;
    } catch (error) {
      if (__DEV__) console.error(`❌ Error getting ${key}:`, error);
      return null;
    }
  },

  async setItem(key, value) {
    try {
      if (isWeb && typeof window !== 'undefined' && window.localStorage) {
        // Use localStorage directly in web browsers
        window.localStorage.setItem(key, value);
        if (__DEV__) console.log(`💾 [Web localStorage] SET ${key}`);
        return;
      }
      // Use AsyncStorage for native apps
      await AsyncStorage.setItem(key, value);
      if (__DEV__) console.log(`💾 [AsyncStorage] SET ${key}`);
    } catch (error) {
      if (__DEV__) console.error(`❌ Error setting ${key}:`, error);
    }
  },

  async removeItem(key) {
    try {
      if (isWeb && typeof window !== 'undefined' && window.localStorage) {
        // Use localStorage directly in web browsers
        window.localStorage.removeItem(key);
        if (__DEV__) console.log(`🗑️ [Web localStorage] REMOVE ${key}`);
        return;
      }
      // Use AsyncStorage for native apps
      await AsyncStorage.removeItem(key);
      if (__DEV__) console.log(`🗑️ [AsyncStorage] REMOVE ${key}`);
    } catch (error) {
      if (__DEV__) console.error(`❌ Error removing ${key}:`, error);
    }
  },

  async clear() {
    try {
      if (isWeb && typeof window !== 'undefined' && window.localStorage) {
        // Use localStorage directly in web browsers
        window.localStorage.clear();
        if (__DEV__) console.log('🗑️ [Web localStorage] CLEARED');
        return;
      }
      // Use AsyncStorage for native apps
      await AsyncStorage.clear();
      if (__DEV__) console.log('🗑️ [AsyncStorage] CLEARED');
    } catch (error) {
      if (__DEV__) console.error('❌ Error clearing storage:', error);
    }
  }
};

export default storage;
