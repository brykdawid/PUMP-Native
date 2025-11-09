// src/services/api.js
// Kompletna konfiguracja połączenia z API dla PUMP-native

import { Platform } from 'react-native';

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

// Dla produkcji - zmień gdy zahostujesz API
const PRODUCTION_API_URL = 'https://your-api.railway.app/api'; // ← ZMIEŃ gdy zahostujesz!

// ============================================
// AUTOMATYCZNA DETEKCJA URL
// ============================================

const getApiUrl = () => {
  // Tryb developerski (localhost)
  if (__DEV__) {
    console.log('[API CONFIG] Running in DEVELOPMENT mode');
    
    // iOS Simulator lub Web Browser
    if (Platform.OS === 'ios' || Platform.OS === 'web') {
      console.log('[API CONFIG] Platform: iOS/Web - Using localhost');
      return 'http://localhost:5000/api';
    }
    
    // Android Emulator
    // 10.0.2.2 to specjalny alias dla localhost na Android Emulator
    if (Platform.OS === 'android') {
      console.log('[API CONFIG] Platform: Android');
      
      // Wykryj czy to emulator czy fizyczne urządzenie
      // W emulatorze użyj 10.0.2.2, na fizycznym urządzeniu użyj lokalnego IP
      const isEmulator = true; // Zmień na false jeśli testujesz na fizycznym urządzeniu
      
      if (isEmulator) {
        console.log('[API CONFIG] Using Android Emulator address: 10.0.2.2');
        return 'http://10.0.2.2:5000/api';
      } else {
        console.log('[API CONFIG] Using physical device address');
        return PHYSICAL_DEVICE_API_URL;
      }
    }
    
    // Fallback dla innych platform
    console.log('[API CONFIG] Unknown platform - Using localhost');
    return 'http://localhost:5000/api';
  }
  
  // Tryb produkcyjny (zahostowane API)
  console.log('[API CONFIG] Running in PRODUCTION mode');
  return PRODUCTION_API_URL;
};

// Export głównego URL
export const API_URL = getApiUrl();

// Debug info - wyświetl w konsoli
console.log('================================================');
console.log('[API CONFIG] Configuration:');
console.log(`[API CONFIG] Platform: ${Platform.OS}`);
console.log(`[API CONFIG] Dev mode: ${__DEV__}`);
console.log(`[API CONFIG] API URL: ${API_URL}`);
console.log('================================================');

// ============================================
// HELPER FUNCTIONS - Podstawowe wywołania API
// ============================================

/**
 * Uniwersalna funkcja fetch z obsługą błędów i timeout
 * @param {string} endpoint - Endpoint API (np. '/exercises')
 * @param {object} options - Opcje fetch
 * @param {number} timeout - Timeout w ms (default: 10000)
 * @returns {Promise} Response data
 */
export const apiFetch = async (endpoint, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const url = `${API_URL}${endpoint}`;
    console.log(`[API] 📡 Fetching: ${url}`);
    console.log(`[API] Method: ${options.method || 'GET'}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Sprawdź status odpowiedzi
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] ❌ Error ${response.status}: ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[API] ✅ Success: ${endpoint}`);
    return data;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Lepsze komunikaty błędów
    if (error.name === 'AbortError') {
      console.error(`[API] ⏱️ Timeout: ${endpoint}`);
      throw new Error('Request timeout - API nie odpowiada');
    }
    
    if (error.message.includes('Network request failed')) {
      console.error(`[API] 🔌 Network error: ${endpoint}`);
      throw new Error('Nie można połączyć z API. Upewnij się, że serwer działa.');
    }
    
    console.error(`[API] ❌ Error: ${endpoint}:`, error);
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
    console.log('[API] 🏥 Checking API health...');
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      timeout: 5000,
    });
    const isHealthy = response.ok;
    console.log(`[API] Health check: ${isHealthy ? '✅ OK' : '❌ FAILED'}`);
    return isHealthy;
  } catch (error) {
    console.error('[API] ❌ Health check failed:', error.message);
    return false;
  }
};

/**
 * Pobierz wszystkie ćwiczenia
 * @returns {Promise<Array>} Lista ćwiczeń
 */
export const fetchExercises = async () => {
  try {
    console.log('[API] 💪 Fetching exercises...');
    const exercises = await apiGet('/exercises');
    console.log(`[API] ✅ Loaded ${exercises.length} exercises`);
    return exercises;
  } catch (error) {
    console.error('[API] ❌ Failed to fetch exercises:', error);
    throw error;
  }
};

/**
 * Wygeneruj workout z AI
 * @param {Array<string>} categories - Kategorie mięśniowe (np. ['chest', 'back'])
 * @param {number} numExercises - Liczba ćwiczeń (default: 4)
 * @returns {Promise<Object>} Wygenerowany workout
 */
export const generateWorkout = async (categories, numExercises = 4) => {
  try {
    console.log('[API] 🤖 Generating AI workout...');
    console.log(`[API] Categories: ${categories.join(', ')}`);
    console.log(`[API] Number of exercises: ${numExercises}`);
    
    const workout = await apiPost('/generate-workout', {
      categories,
      num_exercises: numExercises,
    });
    
    console.log(`[API] ✅ Generated workout with ${workout.exercises?.length || 0} exercises`);
    return workout;
  } catch (error) {
    console.error('[API] ❌ Failed to generate workout:', error);
    throw error;
  }
};

/**
 * Pobierz ćwiczenie po ID
 * @param {string|number} exerciseId - ID ćwiczenia
 * @returns {Promise<Object>} Dane ćwiczenia
 */
export const fetchExerciseById = async (exerciseId) => {
  try {
    console.log(`[API] 🔍 Fetching exercise ID: ${exerciseId}`);
    const exercise = await apiGet(`/exercises/${exerciseId}`);
    console.log(`[API] ✅ Loaded exercise: ${exercise.name}`);
    return exercise;
  } catch (error) {
    console.error(`[API] ❌ Failed to fetch exercise ${exerciseId}:`, error);
    throw error;
  }
};

/**
 * Wyszukaj ćwiczenia po nazwie lub kategorii
 * @param {string} query - Fraza wyszukiwania
 * @returns {Promise<Array>} Wyniki wyszukiwania
 */
export const searchExercises = async (query) => {
  try {
    console.log(`[API] 🔎 Searching exercises: "${query}"`);
    const results = await apiGet(`/exercises/search?q=${encodeURIComponent(query)}`);
    console.log(`[API] ✅ Found ${results.length} results`);
    return results;
  } catch (error) {
    console.error('[API] ❌ Search failed:', error);
    throw error;
  }
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
      console.log(`[API] 🔄 Attempt ${attempt}/${maxRetries}`);
      const result = await apiFunction();
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`[API] ⚠️ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`[API] ⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.error(`[API] ❌ All ${maxRetries} attempts failed`);
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
    console.log(`[API] 📦 Fetching ${exerciseIds.length} exercises...`);
    const promises = exerciseIds.map(id => fetchExerciseById(id));
    const exercises = await Promise.all(promises);
    console.log(`[API] ✅ Loaded ${exercises.length} exercises`);
    return exercises;
  } catch (error) {
    console.error('[API] ❌ Batch fetch failed:', error);
    throw error;
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
};