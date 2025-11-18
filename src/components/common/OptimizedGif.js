import React, { memo, useCallback, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

/**
 * OptimizedGif - Zoptymalizowany komponent do wyświetlania GIF-ów
 *
 * Korzysta z expo-image który ma:
 * - Natywny cache na dysku (SDWebImage iOS, Glide Android)
 * - Blur placeholder podczas ładowania
 * - Płynne przejścia
 * - Lepszą wydajność pamięci
 */
function OptimizedGif({
  uri,
  style,
  contentFit = 'contain',
  placeholder,
  placeholderContentFit = 'contain',
  transition = 200,
  onLoad,
  onError,
  showLoadingIndicator = true,
  loadingIndicatorColor = '#9333ea',
  errorIcon = 'image-outline',
  errorIconSize = 32,
  errorIconColor = '#d1d5db',
  priority = 'normal', // 'low' | 'normal' | 'high'
  cachePolicy = 'disk', // 'none' | 'disk' | 'memory' | 'memory-disk'
  recyclingKey,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback((event) => {
    setIsLoading(false);
    setHasError(false);
    if (onLoad) {
      onLoad(event);
    }
  }, [onLoad]);

  const handleError = useCallback((event) => {
    console.log('[OptimizedGif] Error loading image:', uri);
    setIsLoading(false);
    setHasError(true);
    if (onError) {
      onError(event);
    }
  }, [onError, uri]);

  // Jeśli nie ma URI, pokaż placeholder
  if (!uri) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.placeholderContainer}>
          <Ionicons name={errorIcon} size={errorIconSize} color={errorIconColor} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Loading indicator */}
      {isLoading && showLoadingIndicator && !hasError && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={loadingIndicatorColor} />
        </View>
      )}

      {/* Error state */}
      {hasError && (
        <View style={styles.placeholderContainer}>
          <Ionicons name={errorIcon} size={errorIconSize} color={errorIconColor} />
        </View>
      )}

      {/* Main image */}
      {!hasError && (
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit={contentFit}
          placeholder={placeholder}
          placeholderContentFit={placeholderContentFit}
          transition={transition}
          onLoad={handleLoad}
          onError={handleError}
          priority={priority}
          cachePolicy={cachePolicy}
          recyclingKey={recyclingKey}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  placeholderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
});

// Export komponenty i utilities
export default memo(OptimizedGif);

// Export prefetch function dla użycia w innych miejscach
export { Image as ExpoImage } from 'expo-image';

/**
 * Prefetch obrazów do cache
 * @param {string[]} urls - Lista URL-i do prefetch
 * @param {string} cachePolicy - 'disk' | 'memory' | 'memory-disk'
 */
export const prefetchImages = async (urls, cachePolicy = 'disk') => {
  if (!urls || urls.length === 0) return;

  try {
    const { Image } = require('expo-image');

    // Filtruj puste URL-e
    const validUrls = urls.filter(url => url && typeof url === 'string');

    if (validUrls.length === 0) return;

    console.log(`[OptimizedGif] Prefetching ${validUrls.length} images...`);

    // Prefetch wszystkie obrazy równolegle
    await Image.prefetch(validUrls, cachePolicy);

    console.log(`[OptimizedGif] Successfully prefetched ${validUrls.length} images`);
  } catch (error) {
    console.warn('[OptimizedGif] Prefetch error:', error);
  }
};

/**
 * Wyczyść cache obrazów
 * @param {string} cachePolicy - 'disk' | 'memory' | 'all'
 */
export const clearImageCache = async (cachePolicy = 'all') => {
  try {
    const { Image } = require('expo-image');

    if (cachePolicy === 'disk' || cachePolicy === 'all') {
      await Image.clearDiskCache();
      console.log('[OptimizedGif] Disk cache cleared');
    }

    if (cachePolicy === 'memory' || cachePolicy === 'all') {
      await Image.clearMemoryCache();
      console.log('[OptimizedGif] Memory cache cleared');
    }
  } catch (error) {
    console.warn('[OptimizedGif] Clear cache error:', error);
  }
};

/**
 * Pobierz rozmiar cache
 */
export const getCacheSize = async () => {
  try {
    const { Image } = require('expo-image');
    const size = await Image.getCachePathAsync();
    return size;
  } catch (error) {
    console.warn('[OptimizedGif] Get cache size error:', error);
    return null;
  }
};
