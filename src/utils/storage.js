// Storage utility that works in both web and native environments
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Detect if we're running in a browser
const isWeb = Platform.OS === 'web';

// Cross-platform confirm dialog - używa React Native Alert dla wszystkich platform
export const confirmDialog = (title, message, onConfirm, onCancel) => {
  Alert.alert(
    title,
    message,
    [
      { text: 'Anuluj', style: 'cancel', onPress: onCancel },
      { text: 'OK', style: 'destructive', onPress: onConfirm }
    ]
  );
};

const storage = {
  async getItem(key) {
    try {
      if (isWeb && typeof window !== 'undefined' && window.localStorage) {
        // Use localStorage directly in web browsers
        const value = window.localStorage.getItem(key);
        console.log(`📖 [Web localStorage] GET ${key}:`, value ? 'found' : 'null');
        return value;
      }
      // Use AsyncStorage for native apps
      const value = await AsyncStorage.getItem(key);
      console.log(`📖 [AsyncStorage] GET ${key}:`, value ? 'found' : 'null');
      return value;
    } catch (error) {
      console.error(`❌ Error getting ${key}:`, error);
      return null;
    }
  },

  async setItem(key, value) {
    try {
      if (isWeb && typeof window !== 'undefined' && window.localStorage) {
        // Use localStorage directly in web browsers
        window.localStorage.setItem(key, value);
        console.log(`💾 [Web localStorage] SET ${key}`);
        return;
      }
      // Use AsyncStorage for native apps
      await AsyncStorage.setItem(key, value);
      console.log(`💾 [AsyncStorage] SET ${key}`);
    } catch (error) {
      console.error(`❌ Error setting ${key}:`, error);
    }
  },

  async removeItem(key) {
    try {
      if (isWeb && typeof window !== 'undefined' && window.localStorage) {
        // Use localStorage directly in web browsers
        window.localStorage.removeItem(key);
        console.log(`🗑️ [Web localStorage] REMOVE ${key}`);
        return;
      }
      // Use AsyncStorage for native apps
      await AsyncStorage.removeItem(key);
      console.log(`🗑️ [AsyncStorage] REMOVE ${key}`);
    } catch (error) {
      console.error(`❌ Error removing ${key}:`, error);
    }
  },

  async clear() {
    try {
      if (isWeb && typeof window !== 'undefined' && window.localStorage) {
        // Use localStorage directly in web browsers
        window.localStorage.clear();
        console.log('🗑️ [Web localStorage] CLEARED');
        return;
      }
      // Use AsyncStorage for native apps
      await AsyncStorage.clear();
      console.log('🗑️ [AsyncStorage] CLEARED');
    } catch (error) {
      console.error('❌ Error clearing storage:', error);
    }
  }
};

export default storage;
