// src/utils/apiCache.js
// Zaawansowany system cache'owania dla API z obsługą niestabilnej wydajności Fly.io

import storage from './storage';

/**
 * ============================================
 * KONFIGURACJA CACHE
 * ============================================
 */

const CACHE_CONFIG = {
  // Czas życia cache'a (TTL) w milisekundach
  TTL: {
    EXERCISES: 30 * 60 * 1000,        // 30 minut - rzadko się zmieniają
    WORKOUT: 5 * 60 * 1000,           // 5 minut - dynamiczne treści
    SEARCH: 10 * 60 * 1000,           // 10 minut - wyniki wyszukiwania
    IMAGE_METADATA: 60 * 60 * 1000,   // 1 godzina - metadane obrazków
  },

  // Maksymalny rozmiar cache w pamięci (liczba wpisów)
  MAX_MEMORY_ENTRIES: 100,

  // Maksymalny rozmiar cache w storage (liczba kluczy)
  MAX_STORAGE_ENTRIES: 500,

  // Próg dla uznania połączenia za wolne (ms)
  SLOW_CONNECTION_THRESHOLD: 3000,

  // Adaptive timeouts na podstawie jakości połączenia
  TIMEOUTS: {
    FAST: 5000,      // Szybkie połączenie
    NORMAL: 10000,   // Normalne połączenie
    SLOW: 20000,     // Wolne połączenie
    POOR: 30000,     // Bardzo słabe połączenie
  },
};

/**
 * ============================================
 * CACHE W PAMIĘCI (Memory Cache)
 * ============================================
 * Szybki dostęp bez konieczności odczytu z storage
 */

class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.accessTimes = new Map();
  }

  set(key, value, ttl) {
    // Usuń najstarsze wpisy jeśli przekroczono limit
    if (this.cache.size >= CACHE_CONFIG.MAX_MEMORY_ENTRIES) {
      this.evictOldest();
    }

    const entry = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl,
      expiresAt: Date.now() + ttl,
    };

    this.cache.set(key, entry);
    this.accessTimes.set(key, Date.now());

    if (__DEV__) console.log(`[MemoryCache] 💾 Stored: ${key} (TTL: ${ttl}ms)`);
  }

  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      if (__DEV__) console.log(`[MemoryCache] ❌ Miss: ${key}`);
      return null;
    }

    // Sprawdź czy nie wygasł
    if (Date.now() > entry.expiresAt) {
      if (__DEV__) console.log(`[MemoryCache] ⏰ Expired: ${key}`);
      this.cache.delete(key);
      this.accessTimes.delete(key);
      return null;
    }

    // Zaktualizuj czas ostatniego dostępu
    this.accessTimes.set(key, Date.now());
    if (__DEV__) console.log(`[MemoryCache] ✅ Hit: ${key}`);

    return entry.data;
  }

  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Sprawdź czy nie wygasł
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      return false;
    }

    return true;
  }

  delete(key) {
    this.cache.delete(key);
    this.accessTimes.delete(key);
    if (__DEV__) console.log(`[MemoryCache] 🗑️ Deleted: ${key}`);
  }

  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.accessTimes.clear();
    if (__DEV__) console.log(`[MemoryCache] 🧹 Cleared ${size} entries`);
  }

  // Usuń najstarsze (LRU - Least Recently Used)
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      if (__DEV__) console.log(`[MemoryCache] 🧹 Evicted oldest: ${oldestKey}`);
    }
  }

  // Statystyki cache
  getStats() {
    return {
      size: this.cache.size,
      maxSize: CACHE_CONFIG.MAX_MEMORY_ENTRIES,
      utilization: (this.cache.size / CACHE_CONFIG.MAX_MEMORY_ENTRIES * 100).toFixed(1) + '%',
    };
  }
}

/**
 * ============================================
 * PERSISTENT CACHE (AsyncStorage/localStorage)
 * ============================================
 * Trwały cache przetrwający restarty aplikacji
 */

class PersistentCache {
  constructor(prefix = 'api_cache_') {
    this.prefix = prefix;
  }

  async set(key, value, ttl) {
    try {
      const cacheKey = this.prefix + key;
      const entry = {
        data: value,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      };

      await storage.setItem(cacheKey, JSON.stringify(entry));
      if (__DEV__) console.log(`[PersistentCache] 💾 Stored: ${key}`);
    } catch (error) {
      if (__DEV__) console.error(`[PersistentCache] ❌ Failed to store ${key}:`, error);
    }
  }

  async get(key) {
    try {
      const cacheKey = this.prefix + key;
      const cached = await storage.getItem(cacheKey);

      if (!cached) {
        if (__DEV__) console.log(`[PersistentCache] ❌ Miss: ${key}`);
        return null;
      }

      const entry = JSON.parse(cached);

      // Sprawdź czy nie wygasł
      if (Date.now() > entry.expiresAt) {
        if (__DEV__) console.log(`[PersistentCache] ⏰ Expired: ${key}`);
        await this.delete(key);
        return null;
      }

      if (__DEV__) console.log(`[PersistentCache] ✅ Hit: ${key}`);
      return entry.data;
    } catch (error) {
      if (__DEV__) console.error(`[PersistentCache] ❌ Failed to get ${key}:`, error);
      return null;
    }
  }

  async delete(key) {
    try {
      const cacheKey = this.prefix + key;
      await storage.removeItem(cacheKey);
      if (__DEV__) console.log(`[PersistentCache] 🗑️ Deleted: ${key}`);
    } catch (error) {
      if (__DEV__) console.error(`[PersistentCache] ❌ Failed to delete ${key}:`, error);
    }
  }

  async clear() {
    try {
      // Nie ma prostego sposobu na wyczyszczenie wszystkich kluczy z prefiksem
      // w AsyncStorage, więc to musi być zrobione ręcznie przy potrzebie
      if (__DEV__) console.log('[PersistentCache] 🧹 Clear requested (implement manually if needed)');
    } catch (error) {
      if (__DEV__) console.error('[PersistentCache] ❌ Failed to clear:', error);
    }
  }
}

/**
 * ============================================
 * REQUEST DEDUPLICATION
 * ============================================
 * Zapobiega duplikowaniu żądań do tego samego endpointu
 */

class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
  }

  async deduplicate(key, requestFunction) {
    // Jeśli żądanie już w toku, poczekaj na nie
    if (this.pendingRequests.has(key)) {
      if (__DEV__) console.log(`[Dedup] 🔄 Waiting for pending request: ${key}`);
      return this.pendingRequests.get(key);
    }

    // Rozpocznij nowe żądanie
    if (__DEV__) console.log(`[Dedup] 🆕 Starting new request: ${key}`);
    const promise = requestFunction()
      .finally(() => {
        // Usuń z mapy po zakończeniu (sukces lub błąd)
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear() {
    this.pendingRequests.clear();
    if (__DEV__) console.log('[Dedup] 🧹 Cleared all pending requests');
  }
}

/**
 * ============================================
 * NETWORK QUALITY MONITOR
 * ============================================
 * Monitoruje jakość połączenia i dostosowuje timeouty
 */

class NetworkQualityMonitor {
  constructor() {
    this.responseTimes = [];
    this.maxSamples = 10;
    this.currentQuality = 'NORMAL';
  }

  recordResponseTime(time) {
    this.responseTimes.push(time);

    // Utrzymuj tylko ostatnie N próbek
    if (this.responseTimes.length > this.maxSamples) {
      this.responseTimes.shift();
    }

    // Aktualizuj jakość połączenia
    this.updateQuality();
  }

  updateQuality() {
    if (this.responseTimes.length === 0) {
      this.currentQuality = 'NORMAL';
      return;
    }

    const avgTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

    if (avgTime < 1000) {
      this.currentQuality = 'FAST';
    } else if (avgTime < 3000) {
      this.currentQuality = 'NORMAL';
    } else if (avgTime < 8000) {
      this.currentQuality = 'SLOW';
    } else {
      this.currentQuality = 'POOR';
    }

    if (__DEV__) console.log(`[Network] 📶 Quality: ${this.currentQuality} (avg: ${avgTime.toFixed(0)}ms)`);
  }

  getTimeout() {
    return CACHE_CONFIG.TIMEOUTS[this.currentQuality];
  }

  getQuality() {
    return this.currentQuality;
  }

  reset() {
    this.responseTimes = [];
    this.currentQuality = 'NORMAL';
    if (__DEV__) console.log('[Network] 🔄 Reset quality monitor');
  }
}

/**
 * ============================================
 * GŁÓWNY CACHE MANAGER
 * ============================================
 * Łączy wszystkie mechanizmy cache'owania
 */

class CacheManager {
  constructor() {
    this.memoryCache = new MemoryCache();
    this.persistentCache = new PersistentCache();
    this.deduplicator = new RequestDeduplicator();
    this.networkMonitor = new NetworkQualityMonitor();
  }

  /**
   * Pobierz dane z cache lub wykonaj żądanie
   * Strategia: Stale-While-Revalidate
   * - Zwróć dane z cache jeśli dostępne (nawet jeśli przestarzałe)
   * - W tle odśwież dane jeśli cache wygasł
   */
  async getOrFetch(key, fetchFunction, options = {}) {
    const {
      ttl = CACHE_CONFIG.TTL.EXERCISES,
      forceRefresh = false,
      useStaleWhileRevalidate = true,
    } = options;

    // 1. Sprawdź memory cache
    if (!forceRefresh) {
      const memoryData = this.memoryCache.get(key);
      if (memoryData) {
        if (__DEV__) console.log(`[CacheManager] 🎯 Memory hit: ${key}`);
        return memoryData;
      }

      // 2. Sprawdź persistent cache
      const persistentData = await this.persistentCache.get(key);
      if (persistentData) {
        if (__DEV__) console.log(`[CacheManager] 💽 Persistent hit: ${key}`);
        // Zapisz do memory cache dla szybszego dostępu następnym razem
        this.memoryCache.set(key, persistentData, ttl);
        return persistentData;
      }
    }

    // 3. Brak cache - wykonaj żądanie (z deduplikacją)
    if (__DEV__) console.log(`[CacheManager] 🌐 Fetching fresh data: ${key}`);

    const startTime = Date.now();

    try {
      const data = await this.deduplicator.deduplicate(key, async () => {
        return await fetchFunction();
      });

      const responseTime = Date.now() - startTime;
      this.networkMonitor.recordResponseTime(responseTime);

      // Zapisz w obu cache'ach
      this.memoryCache.set(key, data, ttl);
      await this.persistentCache.set(key, data, ttl);

      if (__DEV__) console.log(`[CacheManager] ✅ Fetched and cached: ${key} (${responseTime}ms)`);

      return data;
    } catch (error) {
      if (__DEV__) console.error(`[CacheManager] ❌ Fetch failed: ${key}:`, error);

      // Strategia fallback: zwróć przestarzałe dane jeśli dostępne
      if (useStaleWhileRevalidate) {
        const staleData = this.memoryCache.cache.get(key)?.data ||
                         await this.persistentCache.get(key);

        if (staleData) {
          if (__DEV__) console.log(`[CacheManager] 🔄 Returning stale data: ${key}`);
          return staleData;
        }
      }

      throw error;
    }
  }

  /**
   * Invaliduj cache dla klucza
   */
  async invalidate(key) {
    this.memoryCache.delete(key);
    await this.persistentCache.delete(key);
    if (__DEV__) console.log(`[CacheManager] 🗑️ Invalidated: ${key}`);
  }

  /**
   * Invaliduj wszystkie cache
   */
  async invalidateAll() {
    this.memoryCache.clear();
    await this.persistentCache.clear();
    this.deduplicator.clear();
    if (__DEV__) console.log('[CacheManager] 🧹 Invalidated all cache');
  }

  /**
   * Prefetch - pobierz dane w tle i zapisz w cache
   */
  async prefetch(key, fetchFunction, ttl = CACHE_CONFIG.TTL.EXERCISES) {
    try {
      if (__DEV__) console.log(`[CacheManager] 🔮 Prefetching: ${key}`);

      const data = await fetchFunction();

      this.memoryCache.set(key, data, ttl);
      await this.persistentCache.set(key, data, ttl);

      if (__DEV__) console.log(`[CacheManager] ✅ Prefetched: ${key}`);
    } catch (error) {
      if (__DEV__) console.error(`[CacheManager] ❌ Prefetch failed: ${key}:`, error);
      // Nie rzucaj błędu - prefetch jest opcjonalny
    }
  }

  /**
   * Pobierz aktualny timeout na podstawie jakości sieci
   */
  getAdaptiveTimeout() {
    return this.networkMonitor.getTimeout();
  }

  /**
   * Pobierz jakość połączenia
   */
  getNetworkQuality() {
    return this.networkMonitor.getQuality();
  }

  /**
   * Statystyki cache
   */
  getStats() {
    return {
      memory: this.memoryCache.getStats(),
      networkQuality: this.networkMonitor.getQuality(),
      adaptiveTimeout: this.networkMonitor.getTimeout(),
    };
  }
}

/**
 * ============================================
 * SINGLETON INSTANCE
 * ============================================
 */

const cacheManager = new CacheManager();

/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */

/**
 * Wygeneruj klucz cache na podstawie endpointu i parametrów
 */
export const generateCacheKey = (endpoint, params = {}) => {
  const paramString = Object.keys(params).length > 0
    ? JSON.stringify(params)
    : '';
  return `${endpoint}${paramString}`;
};

/**
 * ============================================
 * EXPORTS
 * ============================================
 */

export default cacheManager;

export {
  CacheManager,
  MemoryCache,
  PersistentCache,
  RequestDeduplicator,
  NetworkQualityMonitor,
  CACHE_CONFIG,
};
