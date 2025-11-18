// src/utils/imagePrefetch.js
// System prefetch'owania i cache'owania obrazków/GIF-ów
// Zoptymalizowany z expo-image dla lepszego cache'owania na dysku

import { Image } from 'expo-image';

/**
 * ============================================
 * IMAGE PREFETCH MANAGER
 * ============================================
 * Zarządza prefetch'owaniem obrazków w tle dla lepszej wydajności
 */

class ImagePrefetchManager {
  constructor() {
    this.prefetchQueue = [];
    this.prefetchedImages = new Set();
    this.failedImages = new Set();
    this.prefetchingInProgress = false;
    this.maxConcurrent = 3; // Maksymalna liczba równoczesnych prefetch
    this.activePrefetches = 0;
  }

  /**
   * Dodaj obrazek do kolejki prefetch
   * @param {string} uri - URL obrazka
   * @param {number} priority - Priorytet (wyższy = ważniejszy)
   */
  add(uri, priority = 0) {
    if (!uri) return;

    // Sprawdź czy już prefetch'owano lub w kolejce
    if (this.prefetchedImages.has(uri) || this.prefetchQueue.some(item => item.uri === uri)) {
      if (__DEV__) console.log(`[ImagePrefetch] ⏭️ Already queued/prefetched: ${uri}`);
      return;
    }

    // Nie próbuj ponownie jeśli wcześniej się nie powiodło
    if (this.failedImages.has(uri)) {
      if (__DEV__) console.log(`[ImagePrefetch] ⚠️ Skipping failed image: ${uri}`);
      return;
    }

    this.prefetchQueue.push({ uri, priority });

    // Sortuj po priorytecie (wyższy priorytet = wcześniej)
    this.prefetchQueue.sort((a, b) => b.priority - a.priority);

    if (__DEV__) console.log(`[ImagePrefetch] ➕ Added to queue: ${uri} (priority: ${priority})`);

    // Rozpocznij prefetch jeśli nie jest w toku
    this.processPrefetchQueue();
  }

  /**
   * Dodaj wiele obrazków do kolejki
   * @param {Array<string>} uris - Lista URL-i
   * @param {number} priority - Priorytet
   */
  addBatch(uris, priority = 0) {
    if (!Array.isArray(uris)) return;

    uris.forEach(uri => this.add(uri, priority));

    if (__DEV__) console.log(`[ImagePrefetch] 📦 Batch added: ${uris.length} images`);
  }

  /**
   * Przetwórz kolejkę prefetch
   */
  async processPrefetchQueue() {
    // Jeśli już osiągnięto limit równoczesnych prefetch, poczekaj
    if (this.activePrefetches >= this.maxConcurrent) {
      return;
    }

    // Jeśli kolejka pusta, zakończ
    if (this.prefetchQueue.length === 0) {
      return;
    }

    // Pobierz następny obrazek z kolejki
    const item = this.prefetchQueue.shift();
    if (!item) return;

    this.activePrefetches++;

    try {
      if (__DEV__) console.log(`[ImagePrefetch] 🔄 Prefetching: ${item.uri}`);

      // expo-image prefetch z cache na dysku
      await Image.prefetch([item.uri], 'disk');

      this.prefetchedImages.add(item.uri);
      if (__DEV__) console.log(`[ImagePrefetch] ✅ Prefetched: ${item.uri}`);
    } catch (error) {
      this.failedImages.add(item.uri);
      if (__DEV__) console.error(`[ImagePrefetch] ❌ Failed to prefetch: ${item.uri}`, error);
    } finally {
      this.activePrefetches--;

      // Kontynuuj przetwarzanie kolejki
      this.processPrefetchQueue();
    }
  }

  /**
   * Prefetch obrazków z listy ćwiczeń
   * @param {Array} exercises - Lista ćwiczeń z property 'image'
   * @param {number} priority - Priorytet
   */
  prefetchExerciseImages(exercises, priority = 0) {
    if (!Array.isArray(exercises)) return;

    const imageUrls = exercises
      .map(exercise => exercise?.image)
      .filter(Boolean); // Usuń null/undefined

    // Dla wysokiego priorytetu, użyj natywnego batch prefetch expo-image
    if (priority >= 1 && imageUrls.length > 0) {
      this.nativeBatchPrefetch(imageUrls);
    } else {
      this.addBatch(imageUrls, priority);
    }

    if (__DEV__) console.log(`[ImagePrefetch] 💪 Queued ${imageUrls.length} exercise images (priority: ${priority})`);
  }

  /**
   * Natywny batch prefetch - najbardziej wydajny dla expo-image
   * Prefetchuje wszystkie obrazy równolegle używając natywnej implementacji
   * @param {Array<string>} uris - Lista URL-i
   */
  async nativeBatchPrefetch(uris) {
    if (!uris || uris.length === 0) return;

    // Filtruj już prefetch'owane
    const newUris = uris.filter(uri =>
      uri && !this.prefetchedImages.has(uri) && !this.failedImages.has(uri)
    );

    if (newUris.length === 0) {
      if (__DEV__) console.log('[ImagePrefetch] ⏭️ All images already prefetched');
      return;
    }

    try {
      if (__DEV__) console.log(`[ImagePrefetch] 🚀 Native batch prefetch: ${newUris.length} images`);

      // expo-image natywny batch prefetch - bardzo wydajny
      await Image.prefetch(newUris, 'disk');

      // Oznacz wszystkie jako prefetch'owane
      newUris.forEach(uri => this.prefetchedImages.add(uri));

      if (__DEV__) console.log(`[ImagePrefetch] ✅ Batch prefetch complete: ${newUris.length} images`);
    } catch (error) {
      if (__DEV__) console.error('[ImagePrefetch] ❌ Batch prefetch failed:', error);

      // Fallback do kolejki dla nieudanych
      this.addBatch(newUris, 0);
    }
  }

  /**
   * Wyczyść wszystkie cache obrazków (expo-image cache)
   */
  async clearCache() {
    try {
      if (__DEV__) console.log('[ImagePrefetch] 🧹 Clearing image cache...');

      // Wyczyść cache dyskowy i pamięciowy expo-image
      await Promise.all([
        Image.clearDiskCache(),
        Image.clearMemoryCache()
      ]);

      // Wyczyść lokalną listę
      this.prefetchedImages.clear();
      this.failedImages.clear();
      this.prefetchQueue = [];
      this.activePrefetches = 0;

      if (__DEV__) console.log('[ImagePrefetch] ✅ Cache cleared (disk + memory)');
    } catch (error) {
      if (__DEV__) console.error('[ImagePrefetch] ❌ Failed to clear cache:', error);
    }
  }

  /**
   * Sprawdź czy obrazek został prefetch'owany
   * @param {string} uri - URL obrazka
   * @returns {boolean}
   */
  isPrefetched(uri) {
    return this.prefetchedImages.has(uri);
  }

  /**
   * Pobierz statystyki
   */
  getStats() {
    return {
      queued: this.prefetchQueue.length,
      prefetched: this.prefetchedImages.size,
      failed: this.failedImages.size,
      active: this.activePrefetches,
      maxConcurrent: this.maxConcurrent,
    };
  }

  /**
   * Ustaw maksymalną liczbę równoczesnych prefetch
   * @param {number} max - Maksymalna liczba
   */
  setMaxConcurrent(max) {
    this.maxConcurrent = max;
    if (__DEV__) console.log(`[ImagePrefetch] ⚙️ Max concurrent set to: ${max}`);

    // Rozpocznij przetwarzanie jeśli zwiększono limit
    this.processPrefetchQueue();
  }
}

/**
 * ============================================
 * INTELLIGENT IMAGE LOADER
 * ============================================
 * Inteligentne ładowanie obrazków z retry logic
 */

class IntelligentImageLoader {
  constructor() {
    this.retryAttempts = new Map(); // uri -> attempt count
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 sekundy
  }

  /**
   * Załaduj obrazek z retry logic
   * @param {string} uri - URL obrazka
   * @returns {Promise<boolean>} True jeśli sukces
   */
  async loadWithRetry(uri) {
    if (!uri) {
      if (__DEV__) console.warn('[ImageLoader] ⚠️ Empty URI provided');
      return false;
    }

    const attempts = this.retryAttempts.get(uri) || 0;

    if (attempts >= this.maxRetries) {
      if (__DEV__) console.warn(`[ImageLoader] ⚠️ Max retries reached for: ${uri}`);
      return false;
    }

    try {
      if (__DEV__) console.log(`[ImageLoader] 🔄 Loading (attempt ${attempts + 1}): ${uri}`);

      // expo-image prefetch z cache na dysku
      await Image.prefetch([uri], 'disk');

      // Reset licznika przy sukcesie
      this.retryAttempts.delete(uri);

      if (__DEV__) console.log(`[ImageLoader] ✅ Loaded successfully: ${uri}`);
      return true;
    } catch (error) {
      // Zwiększ licznik prób
      this.retryAttempts.set(uri, attempts + 1);

      if (__DEV__) console.error(`[ImageLoader] ❌ Failed (attempt ${attempts + 1}): ${uri}`, error);

      // Retry po opóźnieniu z exponential backoff
      if (attempts + 1 < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, attempts); // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.loadWithRetry(uri);
      }

      return false;
    }
  }

  /**
   * Wyczyść historię retry dla URI
   * @param {string} uri - URL obrazka
   */
  clearRetryHistory(uri) {
    this.retryAttempts.delete(uri);
  }

  /**
   * Wyczyść całą historię retry
   */
  clearAllRetryHistory() {
    this.retryAttempts.clear();
    if (__DEV__) console.log('[ImageLoader] 🧹 Retry history cleared');
  }
}

/**
 * ============================================
 * SINGLETON INSTANCES
 * ============================================
 */

const imagePrefetchManager = new ImagePrefetchManager();
const intelligentImageLoader = new IntelligentImageLoader();

/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */

/**
 * Prefetch pojedynczego obrazka
 * @param {string} uri - URL obrazka
 * @param {number} priority - Priorytet (default: 0)
 */
export const prefetchImage = (uri, priority = 0) => {
  imagePrefetchManager.add(uri, priority);
};

/**
 * Prefetch wielu obrazków
 * @param {Array<string>} uris - Lista URL-i
 * @param {number} priority - Priorytet (default: 0)
 */
export const prefetchImages = (uris, priority = 0) => {
  imagePrefetchManager.addBatch(uris, priority);
};

/**
 * Prefetch obrazków z listy ćwiczeń
 * @param {Array} exercises - Lista ćwiczeń
 * @param {number} priority - Priorytet (default: 0)
 */
export const prefetchExerciseImages = (exercises, priority = 0) => {
  imagePrefetchManager.prefetchExerciseImages(exercises, priority);
};

/**
 * Natywny batch prefetch - najbardziej wydajny
 * @param {Array<string>} uris - Lista URL-i
 */
export const nativeBatchPrefetch = (uris) => {
  return imagePrefetchManager.nativeBatchPrefetch(uris);
};

/**
 * Załaduj obrazek z retry logic
 * @param {string} uri - URL obrazka
 * @returns {Promise<boolean>}
 */
export const loadImageWithRetry = (uri) => {
  return intelligentImageLoader.loadWithRetry(uri);
};

/**
 * Wyczyść cache obrazków
 */
export const clearImageCache = () => {
  imagePrefetchManager.clearCache();
  intelligentImageLoader.clearAllRetryHistory();
};

/**
 * Pobierz statystyki prefetch
 */
export const getImagePrefetchStats = () => {
  return imagePrefetchManager.getStats();
};

/**
 * Ustaw maksymalną liczbę równoczesnych prefetch
 * @param {number} max - Maksymalna liczba
 */
export const setMaxConcurrentPrefetch = (max) => {
  imagePrefetchManager.setMaxConcurrent(max);
};

/**
 * ============================================
 * EXPORTS
 * ============================================
 */

export default {
  prefetchImage,
  prefetchImages,
  prefetchExerciseImages,
  nativeBatchPrefetch,
  loadImageWithRetry,
  clearImageCache,
  getImagePrefetchStats,
  setMaxConcurrentPrefetch,
  imagePrefetchManager,
  intelligentImageLoader,
};
