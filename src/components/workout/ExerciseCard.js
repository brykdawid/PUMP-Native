import React, { useState, memo, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function ExerciseCard({
  exercise,
  exerciseId,
  onToggle,
  // Optional action buttons
  onFavorite,
  isFavorite,
  onAdd,
  onRemove,
  onReplace,
  replaceButtonText = 'Wymień',
  // AI tag
  showAITag = false
}) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  // Format sets display - handle string, number, or array
  const formatSets = (sets) => {
    if (!sets) return '';

    // If it's already a string, return it
    if (typeof sets === 'string') return sets;

    // If it's a number, format it as "X serii"
    if (typeof sets === 'number') {
      return `${sets} ${sets === 1 ? 'seria' : 'serie'}`;
    }

    // If it's an array (completed workout with detailed sets)
    if (Array.isArray(sets)) {
      return `${sets.length} ${sets.length === 1 ? 'seria' : 'serie'}`;
    }

    return '';
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContent}>
        <TouchableOpacity
          onPress={onToggle}
          style={styles.clickableArea}
          activeOpacity={0.7}
        >
          <View style={styles.imageContainer}>
            {imageLoading && !imageError && (
              <View style={styles.imagePlaceholder}>
                <ActivityIndicator size="small" color="#9333ea" />
              </View>
            )}
            {imageError ? (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={32} color="#d1d5db" />
              </View>
            ) : (
              <Image
                source={{ uri: exercise.image }}
                style={styles.image}
                resizeMode="cover"
                onLoad={handleImageLoad}
                onError={handleImageError}
                fadeDuration={0}
              />
            )}
          </View>

          <View style={styles.textContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.exerciseName} numberOfLines={2} ellipsizeMode="tail">{exercise.name}</Text>
              {showAITag && (
                <View style={styles.aiTag}>
                  <Ionicons name="sparkles" size={12} color="#9333ea" />
                  <Text style={styles.aiTagText}>AI</Text>
                </View>
              )}
            </View>
            <Text style={styles.exerciseSets}>{formatSets(exercise.sets)}</Text>
          </View>
        </TouchableOpacity>

        {/* Action buttons - Right edge, centered vertically */}
        <View style={styles.actionButtonsContainer}>
          {onFavorite && (
            <TouchableOpacity
              onPress={onFavorite}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFavorite ? 'star' : 'star-outline'}
                size={32}
                color={isFavorite ? '#facc15' : '#9ca3af'}
              />
            </TouchableOpacity>
          )}
          {onAdd && (
            <TouchableOpacity
              onPress={onAdd}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add-circle"
                size={32}
                color="#9333ea"
              />
            </TouchableOpacity>
          )}
          {onRemove && (
            <TouchableOpacity
              onPress={onRemove}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close-circle"
                size={32}
                color="#ef4444"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Replace button (if provided) */}
      {onReplace && (
        <View style={styles.exerciseActions}>
          <TouchableOpacity
            onPress={onReplace}
            style={styles.replaceButton}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={16} color="#2563eb" />
            <Text style={styles.replaceButtonText}>{replaceButtonText}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clickableArea: {
    flex: 1,
    paddingLeft: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    zIndex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  exerciseName: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d8b4fe',
  },
  aiTagText: {
    color: '#9333ea',
    fontSize: 11,
    fontWeight: '700',
  },
  exerciseSets: {
    color: '#9333ea',
    fontSize: 14,
    marginTop: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  replaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dbeafe',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  replaceButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
});

// Memoize component to prevent unnecessary re-renders
export default memo(ExerciseCard, (prevProps, nextProps) => {
  return (
    prevProps.exercise?.id === nextProps.exercise?.id &&
    prevProps.exercise?.name === nextProps.exercise?.name &&
    prevProps.exercise?.image === nextProps.exercise?.image &&
    prevProps.exercise?.sets === nextProps.exercise?.sets &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.showAITag === nextProps.showAITag &&
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.onFavorite === nextProps.onFavorite &&
    prevProps.onAdd === nextProps.onAdd &&
    prevProps.onRemove === nextProps.onRemove &&
    prevProps.onReplace === nextProps.onReplace
  );
});