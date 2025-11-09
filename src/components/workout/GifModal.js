import React from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function GifModal({ exercise, onClose, onToggleFavorite, isFavorite }) {
  if (!exercise) return null;

  return (
    <Modal
      visible={!!exercise}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalContainer}>
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
                    onPress={onToggleFavorite}
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
                    onPress={onClose}
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
                  <Image
                    source={{ uri: exercise.image }}
                    style={styles.exerciseImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Ionicons name="barbell" size={96} color="#6b7280" />
                  </View>
                )}
              </View>
            </View>

            {/* Info Section */}
            <View style={styles.infoContainer}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>

              {exercise.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Opis:</Text>
                  <Text style={styles.descriptionText}>{exercise.description}</Text>
                </View>
              )}

              {exercise.tips && exercise.tips.length > 0 && (
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.92,
    maxWidth: 600,
    maxHeight: SCREEN_HEIGHT * 0.85,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
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
    height: SCREEN_HEIGHT * 0.35,
    maxHeight: 400,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    maxHeight: SCREEN_HEIGHT * 0.35,
  },
  placeholderContainer: {
    width: '100%',
    height: 256,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 24,
    backgroundColor: '#ffffff',
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  tipsContainer: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#f3e8ff',
    padding: 12,
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

export default GifModal;