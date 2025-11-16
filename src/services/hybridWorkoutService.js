// src/services/hybridWorkoutService.js
// Intelligent hybrid workout service
// Online: Uses AI API for personalized workouts
// Offline: Falls back to rule-based generator
// Auto-detects network and switches accordingly

import NetInfo from '@react-native-community/netinfo';
import { generateWorkout as generateAIWorkout, apiFetch } from './api';
import { generateOfflineWorkout, getAllOfflineExercises, getOfflineExercisesByCategory, searchOfflineExercises } from './offlineWorkoutGenerator';

/**
 * Network quality levels
 */
const NETWORK_QUALITY = {
  EXCELLENT: 'excellent',  // Fast, reliable connection
  GOOD: 'good',            // Decent connection
  POOR: 'poor',            // Slow or unstable
  OFFLINE: 'offline'       // No connection
};

/**
 * Current network state (cached)
 */
let currentNetworkState = {
  isConnected: true,
  isInternetReachable: true,
  quality: NETWORK_QUALITY.GOOD,
  lastChecked: Date.now()
};

/**
 * Workout generation preferences
 */
let preferences = {
  preferOnline: true,       // Prefer AI when available
  offlineTimeout: 5000,     // Timeout for API before fallback (ms)
  cacheEnabled: true,       // Use cached workouts when offline
  autoDetectNetwork: true   // Automatically detect network changes
};

/**
 * Initialize network monitoring
 */
export function initializeNetworkMonitoring() {
  if (!preferences.autoDetectNetwork) return;

  // Subscribe to network state changes
  NetInfo.addEventListener(state => {
    currentNetworkState = {
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable !== false,
      quality: determineNetworkQuality(state),
      lastChecked: Date.now()
    };

    if (__DEV__) {
      console.log('[HybridService] Network state changed:', currentNetworkState);
    }
  });

  // Initial network check
  NetInfo.fetch().then(state => {
    currentNetworkState = {
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable !== false,
      quality: determineNetworkQuality(state),
      lastChecked: Date.now()
    };
  });
}

/**
 * Determines network quality from NetInfo state
 */
function determineNetworkQuality(state) {
  if (!state.isConnected || state.isInternetReachable === false) {
    return NETWORK_QUALITY.OFFLINE;
  }

  // Check connection type
  const type = state.type;
  const details = state.details;

  // WiFi or Ethernet = usually good
  if (type === 'wifi' || type === 'ethernet') {
    return NETWORK_QUALITY.EXCELLENT;
  }

  // Cellular - check effective type if available
  if (type === 'cellular') {
    const effectiveType = details?.cellularGeneration;

    if (effectiveType === '5g' || effectiveType === '4g') {
      return NETWORK_QUALITY.GOOD;
    } else if (effectiveType === '3g') {
      return NETWORK_QUALITY.POOR;
    } else {
      return NETWORK_QUALITY.POOR;
    }
  }

  // Default to good if we can't determine
  return NETWORK_QUALITY.GOOD;
}

/**
 * Checks if online mode is available and recommended
 */
async function shouldUseOnlineMode() {
  // User explicitly disabled online mode
  if (!preferences.preferOnline) {
    return false;
  }

  // Check network state
  if (!currentNetworkState.isConnected || !currentNetworkState.isInternetReachable) {
    return false;
  }

  // Poor network quality - prefer offline
  if (currentNetworkState.quality === NETWORK_QUALITY.POOR) {
    if (__DEV__) {
      console.log('[HybridService] Poor network quality detected, using offline mode');
    }
    return false;
  }

  return true;
}

/**
 * MAIN FUNCTION: Generate workout (hybrid AI + offline)
 *
 * @param {Array<string>} categories - Muscle group categories
 * @param {number} numExercises - Number of exercises (default: 5)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Generated workout
 */
export async function generateHybridWorkout(categories, numExercises = 5, options = {}) {
  const startTime = Date.now();

  try {
    // Check if we should try online mode
    const useOnline = await shouldUseOnlineMode();

    if (useOnline) {
      if (__DEV__) {
        console.log('[HybridService] 🌐 Attempting online AI generation...');
      }

      try {
        // Try AI API with timeout
        const aiWorkout = await Promise.race([
          generateAIWorkout(categories, numExercises),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('API timeout')), preferences.offlineTimeout)
          )
        ]);

        const duration = Date.now() - startTime;

        if (__DEV__) {
          console.log(`[HybridService] ✅ AI workout generated in ${duration}ms`);
        }

        return {
          ...aiWorkout,
          generatedBy: 'ai',
          generationTime: duration,
          mode: 'online'
        };

      } catch (apiError) {
        // API failed - fall back to offline
        if (__DEV__) {
          console.warn('[HybridService] ⚠️ AI generation failed, falling back to offline:', apiError.message);
        }

        const offlineWorkout = generateOfflineWorkout(categories, numExercises);
        const duration = Date.now() - startTime;

        return {
          ...offlineWorkout,
          generatedBy: 'offline-fallback',
          generationTime: duration,
          mode: 'offline',
          fallbackReason: apiError.message
        };
      }
    } else {
      // Offline mode preferred or required
      if (__DEV__) {
        console.log('[HybridService] 📴 Using offline mode (network unavailable or poor quality)');
      }

      const offlineWorkout = generateOfflineWorkout(categories, numExercises);
      const duration = Date.now() - startTime;

      return {
        ...offlineWorkout,
        generatedBy: 'offline',
        generationTime: duration,
        mode: 'offline'
      };
    }

  } catch (error) {
    console.error('[HybridService] ❌ Critical error generating workout:', error);

    // Last resort fallback
    try {
      const emergencyWorkout = generateOfflineWorkout(categories, numExercises);
      return {
        ...emergencyWorkout,
        generatedBy: 'offline-emergency',
        mode: 'offline',
        error: error.message
      };
    } catch (offlineError) {
      throw new Error(`Failed to generate workout: ${error.message}`);
    }
  }
}

/**
 * Get exercises (hybrid: try API, fallback to local)
 *
 * @param {Array<string>} categories - Optional category filter
 * @param {number} limit - Optional limit
 * @returns {Promise<Array>} Array of exercises
 */
export async function getHybridExercises(categories = null, limit = null) {
  try {
    const useOnline = await shouldUseOnlineMode();

    if (useOnline) {
      try {
        // Try API first
        const apiExercises = await Promise.race([
          apiFetch(`/exercises${categories ? `?categories=${categories.join(',')}` : ''}${limit ? `&limit=${limit}` : ''}`),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 3000)
          )
        ]);

        if (__DEV__) {
          console.log(`[HybridService] ✅ Loaded ${apiExercises.length} exercises from API`);
        }

        return apiExercises;

      } catch (apiError) {
        if (__DEV__) {
          console.warn('[HybridService] ⚠️ API failed, using local exercises:', apiError.message);
        }

        // Fallback to local
        return getLocalExercises(categories, limit);
      }
    } else {
      // Use local exercises
      return getLocalExercises(categories, limit);
    }

  } catch (error) {
    console.error('[HybridService] ❌ Error getting exercises:', error);
    return getLocalExercises(categories, limit);
  }
}

/**
 * Helper: Get local exercises with optional filtering
 */
function getLocalExercises(categories = null, limit = null) {
  let exercises;

  if (categories && categories.length > 0) {
    // Get exercises for specific categories
    exercises = categories.flatMap(cat => getOfflineExercisesByCategory(cat));

    // Remove duplicates
    exercises = Array.from(new Map(exercises.map(ex => [ex.id, ex])).values());
  } else {
    // Get all exercises
    exercises = getAllOfflineExercises();
  }

  if (limit) {
    exercises = exercises.slice(0, limit);
  }

  if (__DEV__) {
    console.log(`[HybridService] 📴 Loaded ${exercises.length} exercises from local database`);
  }

  return exercises;
}

/**
 * Search exercises (hybrid)
 */
export async function searchHybridExercises(query) {
  try {
    const useOnline = await shouldUseOnlineMode();

    if (useOnline) {
      try {
        const apiResults = await Promise.race([
          apiFetch(`/exercises/search?q=${encodeURIComponent(query)}`),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
        ]);

        return apiResults;

      } catch (apiError) {
        return searchOfflineExercises(query);
      }
    } else {
      return searchOfflineExercises(query);
    }

  } catch (error) {
    return searchOfflineExercises(query);
  }
}

/**
 * Get current network status
 */
export function getNetworkStatus() {
  return {
    ...currentNetworkState,
    canUseOnline: currentNetworkState.isConnected && currentNetworkState.isInternetReachable,
    qualityDescription: getQualityDescription(currentNetworkState.quality)
  };
}

/**
 * Get human-readable quality description
 */
function getQualityDescription(quality) {
  switch (quality) {
    case NETWORK_QUALITY.EXCELLENT:
      return 'Doskonałe połączenie';
    case NETWORK_QUALITY.GOOD:
      return 'Dobre połączenie';
    case NETWORK_QUALITY.POOR:
      return 'Słabe połączenie';
    case NETWORK_QUALITY.OFFLINE:
      return 'Tryb offline';
    default:
      return 'Nieznane';
  }
}

/**
 * Update preferences
 */
export function setPreferences(newPreferences) {
  preferences = { ...preferences, ...newPreferences };

  if (__DEV__) {
    console.log('[HybridService] Preferences updated:', preferences);
  }
}

/**
 * Get current preferences
 */
export function getPreferences() {
  return { ...preferences };
}

/**
 * Force refresh network state
 */
export async function refreshNetworkState() {
  const state = await NetInfo.fetch();

  currentNetworkState = {
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable !== false,
    quality: determineNetworkQuality(state),
    lastChecked: Date.now()
  };

  return currentNetworkState;
}

// Export default object
export default {
  generateHybridWorkout,
  getHybridExercises,
  searchHybridExercises,
  initializeNetworkMonitoring,
  getNetworkStatus,
  setPreferences,
  getPreferences,
  refreshNetworkState
};
