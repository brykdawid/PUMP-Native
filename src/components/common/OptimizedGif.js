import React, { memo, useCallback, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, Image as RNImage } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

// Helper to properly encode URI for Android
const encodeURI_Android = (uri) => {
  if (!uri || Platform.OS !== 'android') return uri;

  try {
    // Split URL into parts
    const url = new URL(uri);
    // Encode only the pathname part (keeps domain intact)
    const encodedPath = url.pathname.split('/').map(segment =>
      encodeURIComponent(decodeURIComponent(segment))
    ).join('/');

    return `${url.protocol}//${url.host}${encodedPath}${url.search}`;
  } catch (e) {
    console.log('[OptimizedGif] URL encoding failed, using original:', e);
    return uri;
  }
};

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
  const [loadTimeout, setLoadTimeout] = useState(false);

  // Encode URI for Android compatibility
  const encodedUri = React.useMemo(() => {
    return encodeURI_Android(uri);
  }, [uri]);

  // Log when component mounts with URI
  React.useEffect(() => {
    console.log('[OptimizedGif] 🎬 Component mounted with URI:', uri);
    if (encodedUri !== uri) {
      console.log('[OptimizedGif] 🔄 Encoded URI:', encodedUri);
    }
    console.log('[OptimizedGif] 📱 Platform:', Platform.OS);
    return () => {
      console.log('[OptimizedGif] 🔚 Component unmounted');
    };
  }, [uri, encodedUri]);

  // Add timeout for loading (10 seconds)
  React.useEffect(() => {
    if (!uri) return;

    const timeoutId = setTimeout(() => {
      if (isLoading && !hasError) {
        console.log('[OptimizedGif] ⏱️ Load timeout for:', uri);
        setLoadTimeout(true);
        setIsLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [uri, isLoading, hasError]);

  // Generate stable cache key from URI for better caching
  const cacheKey = React.useMemo(() => {
    if (!uri) return null;
    // Use URI as cache key - expo-image will handle the rest
    return recyclingKey || uri;
  }, [uri, recyclingKey]);

  const handleLoad = useCallback((event) => {
    console.log('[OptimizedGif] ✅ Image loaded from cache or network:', uri);
    setIsLoading(false);
    setHasError(false);
    if (onLoad) {
      onLoad(event);
    }
  }, [onLoad, uri]);

  const handleError = useCallback((event) => {
    console.log('[OptimizedGif] ❌ Error loading image:', uri);
    console.log('[OptimizedGif] ❌ Error details:', event);
    setIsLoading(false);
    setHasError(true);
    if (onError) {
      onError(event);
    }
  }, [onError, uri]);

  // Jeśli nie ma URI, pokaż placeholder
  if (!uri) {
    console.log('[OptimizedGif] ⚠️ No URI provided, showing placeholder');
    return (
      <View style={[styles.container, style]}>
        <View style={styles.placeholderContainer}>
          <Ionicons name={errorIcon} size={errorIconSize} color={errorIconColor} />
        </View>
      </View>
    );
  }

  console.log('[OptimizedGif] 🖼️ Rendering with URI:', uri);

  // Use native Image for Android GIFs for better compatibility
  const useNativeImage = Platform.OS === 'android';

  return (
    <View style={[styles.container, style]}>
      {/* Loading indicator */}
      {isLoading && showLoadingIndicator && !hasError && !loadTimeout && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={loadingIndicatorColor} />
        </View>
      )}

      {/* Error or timeout state */}
      {(hasError || loadTimeout) && (
        <View style={styles.placeholderContainer}>
          <Ionicons name={errorIcon} size={errorIconSize} color={errorIconColor} />
        </View>
      )}

      {/* Main image - use native Image for Android, expo-image for iOS */}
      {!hasError && !loadTimeout && (
        useNativeImage ? (
          <RNImage
            source={{ uri: encodedUri }}
            style={styles.image}
            resizeMode={contentFit === 'cover' ? 'cover' : 'contain'}
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : (
          <Image
            source={{
              uri: encodedUri,
            }}
            style={styles.image}
            contentFit={contentFit}
            placeholder={placeholder}
            placeholderContentFit={placeholderContentFit}
            transition={transition}
            onLoad={handleLoad}
            onError={handleError}
            priority={priority}
            cachePolicy="memory-disk"
            recyclingKey={cacheKey}
            autoplay={true}
            allowDownscaling={false}
          />
        )
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
