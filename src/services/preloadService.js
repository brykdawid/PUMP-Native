// src/services/preloadService.js
// Serwis do preloadingu API i danych podczas splash screena

import { fetchExercises, checkApiStatus } from './api';
import cacheManager from '../utils/apiCache';

/**
 * Wykonaj preloading wszystkich krytycznych danych
 * @returns {Promise<Object>} Status preloadingu
 */
export const preloadAppData = async (onProgress) => {
  const startTime = Date.now();
  const steps = [
    { name: 'Sprawdzanie API', weight: 20 },
    { name: 'Ładowanie ćwiczeń', weight: 80 },
  ];

  let completedWeight = 0;
  const results = {
    success: false,
    errors: [],
    loadTime: 0,
  };

  try {
    if (__DEV__) console.log('[PRELOAD] 🚀 Starting app data preload...');

    // Krok 1: Sprawdź czy API działa
    if (onProgress) onProgress(0, 'Sprawdzanie API...');
    try {
      const isHealthy = await checkApiStatus();
      if (!isHealthy) {
        throw new Error('API is not responding');
      }
      if (__DEV__) console.log('[PRELOAD] ✅ API health check passed');
    } catch (error) {
      if (__DEV__) console.warn('[PRELOAD] ⚠️ API health check failed (continuing anyway):', error.message);
      results.errors.push({ step: 'API Health Check', error: error.message });
    }

    completedWeight += steps[0].weight;
    if (onProgress) onProgress(completedWeight, 'API gotowe');

    // Krok 2: Załaduj wszystkie ćwiczenia i cachuj je
    if (onProgress) onProgress(completedWeight, 'Ładowanie ćwiczeń...');
    try {
      const exercises = await fetchExercises(false); // Użyj cache jeśli dostępny
      if (__DEV__) console.log(`[PRELOAD] ✅ Loaded ${exercises.length} exercises`);

      // Dodatkowe info o cache
      const cacheStats = cacheManager.getStats();
      if (__DEV__) console.log('[PRELOAD] 📊 Cache stats:', cacheStats);
    } catch (error) {
      if (__DEV__) console.error('[PRELOAD] ❌ Failed to load exercises:', error.message);
      results.errors.push({ step: 'Load Exercises', error: error.message });
      throw error; // To jest krytyczny błąd
    }

    completedWeight += steps[1].weight;
    if (onProgress) onProgress(completedWeight, 'Gotowe!');

    // Sukces
    results.success = true;
    results.loadTime = Date.now() - startTime;

    if (__DEV__) console.log(`[PRELOAD] 🎉 Preload completed in ${results.loadTime}ms`);
    if (__DEV__) console.log(`[PRELOAD] Errors: ${results.errors.length}`);

    return results;

  } catch (error) {
    results.success = false;
    results.loadTime = Date.now() - startTime;

    if (__DEV__) console.error('[PRELOAD] ❌ Preload failed:', error);

    // Jeśli preload nie powiódł się, aplikacja może działać ale wolniej
    return results;
  }
};

/**
 * Minimalna długość wyświetlania splash screen (dla lepszego UX)
 */
export const MIN_SPLASH_DURATION = 1500; // 1.5 sekundy

/**
 * Wykonaj preloading z minimalnym czasem wyświetlania
 */
export const preloadWithMinDuration = async (onProgress) => {
  const startTime = Date.now();

  // Wykonaj preloading
  const results = await preloadAppData(onProgress);

  // Oblicz ile czasu minęło
  const elapsed = Date.now() - startTime;

  // Jeśli preload był szybszy niż minimalny czas, poczekaj
  if (elapsed < MIN_SPLASH_DURATION) {
    const remainingTime = MIN_SPLASH_DURATION - elapsed;
    if (__DEV__) console.log(`[PRELOAD] ⏱️ Waiting ${remainingTime}ms for better UX...`);
    await new Promise(resolve => setTimeout(resolve, remainingTime));
  }

  return results;
};

export default {
  preloadAppData,
  preloadWithMinDuration,
  MIN_SPLASH_DURATION,
};
