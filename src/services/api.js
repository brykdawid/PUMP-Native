// src/services/api.js
// Kompletna konfiguracja połączenia z API dla PUMP-native
// Z zaawansowanym cache'owaniem dla optymalizacji wydajności Fly.io

import { Platform } from 'react-native';
import cacheManager, { generateCacheKey, CACHE_CONFIG } from '../utils/apiCache';

/**
 * ============================================
 * KONFIGURACJA URL API
 * ============================================
 * 
 * Automatyczna detekcja środowiska i platformy:
 * 
 * DEVELOPMENT (localhost):
 * - iOS Simulator: http://localhost:5000/api
 * - Android Emulator: http://10.0.2.2:5000/api
 * - Fizyczne urządzenie: http://[twoje-lokalne-ip]:5000/api
 * - Web Browser: http://localhost:5000/api
 * 
 * PRODUCTION:
 * - Zewnętrzny hosting: https://your-api.railway.app/api
 * 
 * UWAGA: Jeśli testujesz na FIZYCZNYM urządzeniu:
 * 1. Znajdź swoje lokalne IP: 
 *    - macOS/Linux: ifconfig | grep "inet "
 *    - Windows: ipconfig
 * 2. Zmień PHYSICAL_DEVICE_API_URL poniżej na swoje IP
 * 3. Upewnij się że API działa na host='0.0.0.0'
 */

// ============================================
// KONFIGURACJA - ZMIEŃ TE WARTOŚCI
// ============================================

// Dla fizycznych urządzeń - zmień na swoje lokalne IP
const PHYSICAL_DEVICE_API_URL = 'http://192.168.1.100:5000/api'; // ← ZMIEŃ NA SWOJE IP!

// Dla produkcji - Fly.io API
const PRODUCTION_API_URL = 'https://ai-api-drlzza.fly.dev/api';

// ============================================
// AUTOMATYCZNA DETEKCJA URL
// ============================================

const getApiUrl = () => {
  // ZAWSZE używaj produkcyjnego API Fly.io
  // Lokalne API nie jest potrzebne
  if (__DEV__) console.log('[API CONFIG] Using production Fly.io API');
  return PRODUCTION_API_URL;
};

// Export głównego URL
export const API_URL = getApiUrl();

// Debug info - wyświetl w konsoli
if (__DEV__) console.log('================================================');
if (__DEV__) console.log('[API CONFIG] Configuration:');
if (__DEV__) console.log(`[API CONFIG] Platform: ${Platform.OS}`);
if (__DEV__) console.log(`[API CONFIG] Dev mode: ${__DEV__}`);
if (__DEV__) console.log(`[API CONFIG] API URL: ${API_URL}`);
if (__DEV__) console.log('================================================');

// ============================================
// HELPER FUNCTIONS - Podstawowe wywołania API
// ============================================

/**
 * Uniwersalna funkcja fetch z obsługą błędów i adaptive timeout
 * @param {string} endpoint - Endpoint API (np. '/exercises')
 * @param {object} options - Opcje fetch
 * @param {number} timeout - Timeout w ms (default: adaptive na podstawie jakości sieci)
 * @returns {Promise} Response data
 */
export const apiFetch = async (endpoint, options = {}, timeout = null) => {
  // Użyj adaptive timeout jeśli nie podano konkretnego
  const actualTimeout = timeout || cacheManager.getAdaptiveTimeout();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), actualTimeout);
  
  const startTime = Date.now();

  try {
    const url = `${API_URL}${endpoint}`;
    const networkQuality = cacheManager.getNetworkQuality();

    if (__DEV__) console.log(`[API] 📡 Fetching: ${url}`);
    if (__DEV__) console.log(`[API] Method: ${options.method || 'GET'}`);
    if (__DEV__) console.log(`[API] Network: ${networkQuality}, Timeout: ${actualTimeout}ms`);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Zmierz czas odpowiedzi dla network quality monitor
    const responseTime = Date.now() - startTime;

    // Sprawdź status odpowiedzi
    if (!response.ok) {
      const errorText = await response.text();
      if (__DEV__) console.error(`[API] ❌ Error ${response.status}: ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (__DEV__) console.log(`[API] ✅ Success: ${endpoint} (${responseTime}ms)`);
    return data;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Lepsze komunikaty błędów
    if (error.name === 'AbortError') {
      if (__DEV__) console.error(`[API] ⏱️ Timeout: ${endpoint}`);
      throw new Error('Request timeout - API nie odpowiada');
    }

    if (error.message.includes('Network request failed')) {
      if (__DEV__) console.error(`[API] 🔌 Network error: ${endpoint}`);
      throw new Error('Nie można połączyć z API. Upewnij się, że serwer działa.');
    }

    if (__DEV__) console.error(`[API] ❌ Error: ${endpoint}:`, error);
    throw error;
  }
};

/**
 * GET request
 * @param {string} endpoint - Endpoint API
 * @returns {Promise} Response data
 */
export const apiGet = async (endpoint) => {
  return apiFetch(endpoint, { method: 'GET' });
};

/**
 * POST request
 * @param {string} endpoint - Endpoint API
 * @param {object} data - Dane do wysłania
 * @returns {Promise} Response data
 */
export const apiPost = async (endpoint, data) => {
  return apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * PUT request
 * @param {string} endpoint - Endpoint API
 * @param {object} data - Dane do aktualizacji
 * @returns {Promise} Response data
 */
export const apiPut = async (endpoint, data) => {
  return apiFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request
 * @param {string} endpoint - Endpoint API
 * @returns {Promise} Response data
 */
export const apiDelete = async (endpoint) => {
  return apiFetch(endpoint, { method: 'DELETE' });
};

// ============================================
// API ENDPOINTS - Konkretne wywołania
// ============================================

/**
 * Sprawdź status API (health check)
 * @returns {Promise<boolean>} True jeśli API działa
 */
export const checkApiStatus = async () => {
  try {
    if (__DEV__) console.log('[API] 🏥 Checking API health...');
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      timeout: 5000,
    });
    const isHealthy = response.ok;
    if (__DEV__) console.log(`[API] Health check: ${isHealthy ? '✅ OK' : '❌ FAILED'}`);
    return isHealthy;
  } catch (error) {
    if (__DEV__) console.error('[API] ❌ Health check failed:', error.message);
    return false;
  }
};

/**
 * Pobierz wszystkie ćwiczenia (z cache'owaniem)
 * @param {boolean} forceRefresh - Wymuś pobranie świeżych danych
 * @returns {Promise<Array>} Lista ćwiczeń
 */
export const fetchExercises = async (forceRefresh = false) => {
  const cacheKey = generateCacheKey('/exercises');

  return cacheManager.getOrFetch(
    cacheKey,
    async () => {
      if (__DEV__) console.log('[API] 💪 Fetching exercises from server...');
      const exercises = await apiGet('/exercises');
      if (__DEV__) console.log(`[API] ✅ Loaded ${exercises.length} exercises from server`);
      return exercises;
    },
    {
      ttl: CACHE_CONFIG.TTL.EXERCISES,
      forceRefresh,
      useStaleWhileRevalidate: true,
    }
  );
};

/**
 * Wygeneruj workout z AI (z cache'owaniem na podstawie kategorii)
 * @param {Array<string>} categories - Kategorie mięśniowe (np. ['chest', 'back'])
 * @param {number} numExercises - Liczba ćwiczeń (default: 3)
 * @param {boolean} forceRefresh - Wymuś wygenerowanie nowego
 * @returns {Promise<Object>} Wygenerowany workout
 */
export const generateWorkout = async (categories, numExercises = 3, forceRefresh = false) => {
  const cacheKey = generateCacheKey('/generate-workout', { categories, numExercises });

  return cacheManager.getOrFetch(
    cacheKey,
    async () => {
      if (__DEV__) console.log('[API] 🤖 Generating AI workout from server...');
      if (__DEV__) console.log(`[API] Categories: ${categories.join(', ')}`);
      if (__DEV__) console.log(`[API] Number of exercises: ${numExercises}`);

      const workout = await apiPost('/generate-workout', {
        categories,
        num_exercises: numExercises,
      });

      if (__DEV__) console.log(`[API] ✅ Generated workout with ${workout.exercises?.length || 0} exercises`);
      return workout;
    },
    {
      ttl: CACHE_CONFIG.TTL.WORKOUT,
      forceRefresh,
      useStaleWhileRevalidate: true,
    }
  );
};

/**
 * Pobierz ćwiczenie po ID (z cache'owaniem)
 * @param {string|number} exerciseId - ID ćwiczenia
 * @param {boolean} forceRefresh - Wymuś pobranie świeżych danych
 * @returns {Promise<Object>} Dane ćwiczenia
 */
export const fetchExerciseById = async (exerciseId, forceRefresh = false) => {
  const cacheKey = generateCacheKey(`/exercises/${exerciseId}`);

  return cacheManager.getOrFetch(
    cacheKey,
    async () => {
      if (__DEV__) console.log(`[API] 🔍 Fetching exercise ID from server: ${exerciseId}`);
      const exercise = await apiGet(`/exercises/${exerciseId}`);
      if (__DEV__) console.log(`[API] ✅ Loaded exercise: ${exercise.name}`);
      return exercise;
    },
    {
      ttl: CACHE_CONFIG.TTL.EXERCISES,
      forceRefresh,
      useStaleWhileRevalidate: true,
    }
  );
};

/**
 * Wyszukaj ćwiczenia po nazwie lub kategorii (z cache'owaniem)
 * @param {string} query - Fraza wyszukiwania
 * @param {boolean} forceRefresh - Wymuś pobranie świeżych danych
 * @returns {Promise<Array>} Wyniki wyszukiwania
 */
export const searchExercises = async (query, forceRefresh = false) => {
  const cacheKey = generateCacheKey('/exercises/search', { q: query });

  return cacheManager.getOrFetch(
    cacheKey,
    async () => {
      if (__DEV__) console.log(`[API] 🔎 Searching exercises from server: "${query}"`);
      const results = await apiGet(`/exercises/search?q=${encodeURIComponent(query)}`);
      if (__DEV__) console.log(`[API] ✅ Found ${results.length} results`);
      return results;
    },
    {
      ttl: CACHE_CONFIG.TTL.SEARCH,
      forceRefresh,
      useStaleWhileRevalidate: true,
    }
  );
};

// ============================================
// RETRY LOGIC - Dla krytycznych requestów
// ============================================

/**
 * Wywołaj funkcję z retry logic
 * @param {Function} apiFunction - Funkcja API do wywołania
 * @param {number} maxRetries - Maksymalna liczba prób (default: 3)
 * @param {number} delay - Opóźnienie między próbami w ms (default: 1000)
 * @returns {Promise} Wynik funkcji
 */
export const withRetry = async (apiFunction, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (__DEV__) console.log(`[API] 🔄 Attempt ${attempt}/${maxRetries}`);
      const result = await apiFunction();
      return result;
    } catch (error) {
      lastError = error;
      if (__DEV__) console.warn(`[API] ⚠️ Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(2, attempt - 1); // Exponential backoff
        if (__DEV__) console.log(`[API] ⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  if (__DEV__) console.error(`[API] ❌ All ${maxRetries} attempts failed`);
  throw lastError;
};

// ============================================
// BATCH OPERATIONS - Operacje zbiorcze
// ============================================

/**
 * Pobierz wiele ćwiczeń jednocześnie
 * @param {Array<string|number>} exerciseIds - Lista ID ćwiczeń
 * @returns {Promise<Array>} Lista ćwiczeń
 */
export const fetchMultipleExercises = async (exerciseIds) => {
  try {
    if (__DEV__) console.log(`[API] 📦 Fetching ${exerciseIds.length} exercises...`);
    const promises = exerciseIds.map(id => fetchExerciseById(id));
    const exercises = await Promise.all(promises);
    if (__DEV__) console.log(`[API] ✅ Loaded ${exercises.length} exercises`);
    return exercises;
  } catch (error) {
    if (__DEV__) console.error('[API] ❌ Batch fetch failed:', error);
    throw error;
  }
};

// ============================================
// CACHE MANAGEMENT
// ============================================

/**
 * Wyczyść cały cache API
 */
export const clearApiCache = async () => {
  try {
    if (__DEV__) console.log('[API] 🧹 Clearing all API cache...');
    await cacheManager.invalidateAll();
    if (__DEV__) console.log('[API] ✅ Cache cleared');
  } catch (error) {
    if (__DEV__) console.error('[API] ❌ Failed to clear cache:', error);
  }
};

/**
 * Wyczyść cache dla konkretnego endpointu
 */
export const clearEndpointCache = async (endpoint, params = {}) => {
  try {
    const cacheKey = generateCacheKey(endpoint, params);
    if (__DEV__) console.log(`[API] 🧹 Clearing cache for: ${cacheKey}`);
    await cacheManager.invalidate(cacheKey);
    if (__DEV__) console.log('[API] ✅ Cache cleared');
  } catch (error) {
    if (__DEV__) console.error('[API] ❌ Failed to clear endpoint cache:', error);
  }
};

/**
 * Pobierz statystyki cache
 */
export const getCacheStats = () => {
  return cacheManager.getStats();
};

/**
 * Prefetch - pobierz dane w tle i zapisz w cache
 */
export const prefetchExercises = async () => {
  try {
    if (__DEV__) console.log('[API] 🔮 Prefetching exercises...');
    const cacheKey = generateCacheKey('/exercises');
    await cacheManager.prefetch(cacheKey, () => apiGet('/exercises'), CACHE_CONFIG.TTL.EXERCISES);
  } catch (error) {
    if (__DEV__) console.error('[API] ❌ Prefetch failed:', error);
  }
};

// ============================================
// EXPORTS
// ============================================

export default {
  // Config
  API_URL,

  // Basic operations
  apiFetch,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,

  // Specific endpoints
  checkApiStatus,
  fetchExercises,
  generateWorkout,
  fetchExerciseById,
  searchExercises,

  // Advanced
  withRetry,
  fetchMultipleExercises,

  // Cache management
  clearApiCache,
  clearEndpointCache,
  getCacheStats,
  prefetchExercises,
};