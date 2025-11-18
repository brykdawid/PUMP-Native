import React, { useState, useCallback, memo, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function GifModal({ exercise, onClose, onToggleFavorite, isFavorite }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (exercise) {
      console.log('[GifModal] Modal opened with exercise:', {
        name: exercise.name,
        hasImage: !!exercise.image,
        hasDescription: !!exercise.description,
        hasTips: !!exercise.tips,
      });
    }
  }, [exercise]);

  const handleImageLoad = useCallback(() => {
    console.log('[GifModal] Image loaded successfully');
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    console.log('[GifModal] Image failed to load');
    setImageLoading(false);
    setImageError(true);
  }, []);

  const handleClose = useCallback(() => {
    console.log('[GifModal] Close button pressed');
    onClose();
  }, [onClose]);

  const handleOverlayPress = useCallback((event) => {
    // Only close if we're clicking the overlay itself, not its children
    console.log('[GifModal] Overlay press event');
    onClose();
  }, [onClose]);

  const handleToggleFavorite = useCallback(() => {
    console.log('[GifModal] Toggling favorite');
    onToggleFavorite();
  }, [onToggleFavorite]);

  if (!exercise) {
    console.log('[GifModal] No exercise provided, not rendering');
    return null;
  }

  console.log('[GifModal] Rendering modal');

  return (
    <Modal
      visible={!!exercise}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      onShow={() => console.log('[GifModal] Modal shown')}
      onDismiss={() => console.log('[GifModal] Modal dismissed')}
    >
      <View style={styles.overlayBackground}>
        <TouchableOpacity
          style={styles.dismissArea}
          onPress={handleOverlayPress}
          activeOpacity={1}
        />
        <View
          style={styles.modalContainer}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            console.log('[GifModal] modalContainer layout:', { width, height });
          }}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Header with gradient overlay */}
            <View style={styles.headerContainer}>
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.6)', 'transparent']}
                style={styles.headerGradient}
              >
                <View style={styles.headerButtons}>
                  <TouchableOpacity
                    onPress={handleToggleFavorite}
                    style={[
                      styles.iconButton,
                      isFavorite ? styles.favoriteButtonActive : styles.favoriteButtonInactive
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isFavorite ? 'star' : 'star-outline'}
                      size={24}
                      color={isFavorite ? '#ffffff' : '#ffffff'}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleClose}
                    style={styles.closeButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={24} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              {/* GIF/Image */}
              <View style={styles.imageContainer}>
                {exercise.image ? (
                  <>
                    {imageLoading && !imageError && (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#9333ea" />
                      </View>
                    )}
                    {!imageError && (
                      <Image
                        source={{ uri: exercise.image }}
                        style={styles.exerciseImage}
                        resizeMode="contain"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        fadeDuration={0}
                      />
                    )}
                    {imageError && (
                      <View style={styles.placeholderContainer}>
                        <Ionicons name="barbell" size={96} color="#6b7280" />
                        <Text style={styles.errorText}>Nie można załadować obrazu</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Ionicons name="barbell" size={96} color="#6b7280" />
                  </View>
                )}
              </View>
            </View>

            {/* Info Section */}
            <View style={styles.infoContainer}>
              <Text style={styles.exerciseName}>{exercise.name || 'Bez nazwy'}</Text>

              {exercise.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Opis:</Text>
                  <Text style={styles.descriptionText}>{exercise.description}</Text>
                </View>
              )}

              {exercise.tips && Array.isArray(exercise.tips) && exercise.tips.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Wskazówki:</Text>
                  <View style={styles.tipsContainer}>
                    {exercise.tips.map((tip, idx) => (
                      <View key={idx} style={styles.tipItem}>
                        <View style={styles.tipNumber}>
                          <Text style={styles.tipNumberText}>{idx + 1}</Text>
                        </View>
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  dismissArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1,
    elevation: 0, // Android - keep background below modalContainer
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    height: SCREEN_HEIGHT * 0.8, // FIXED: Use height instead of maxHeight
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 100,
    borderWidth: 5, // DEBUG: Temporary visible border
    borderColor: '#ff0000', // DEBUG: Red border
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 999, // DEBUG: Very high elevation to ensure it's on top
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    position: 'relative',
    height: Math.min(SCREEN_HEIGHT * 0.28, 320),
    backgroundColor: '#ffffff',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10 || 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 50,
  },
  favoriteButtonActive: {
    backgroundColor: '#facc15',
  },
  favoriteButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeButton: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    zIndex: 1,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  tipsContainer: {
    gap: 6,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f3e8ff',
    padding: 10,
    borderRadius: 8,
  },
  tipNumber: {
    width: 24,
    height: 24,
    backgroundColor: '#9333ea',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  tipNumberText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});

// Memoize component to prevent unnecessary re-renders
export default memo(GifModal, (prevProps, nextProps) => {
  return (
    prevProps.exercise?.id === nextProps.exercise?.id &&
    prevProps.exercise?.name === nextProps.exercise?.name &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.onClose === nextProps.onClose &&
    prevProps.onToggleFavorite === nextProps.onToggleFavorite
  );
});