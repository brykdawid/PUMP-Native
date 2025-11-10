import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function ExerciseCard({
  exercise,
  exerciseId,
  isExpanded,
  onToggle,
  // Optional action buttons
  onFavorite,
  isFavorite,
  onReplace,
  replaceButtonText = 'Wymień'
}) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

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
      {/* Favorite star - Top right corner */}
      {onFavorite && (
        <TouchableOpacity
          onPress={onFavorite}
          style={styles.favoriteButtonTop}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isFavorite ? 'star' : 'star-outline'}
            size={24}
            color={isFavorite ? '#facc15' : '#9ca3af'}
          />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={onToggle}
        style={styles.button}
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
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
          )}
        </View>

        <View style={styles.textContainer}>
          <View style={styles.textRow}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#9333ea"
              style={styles.chevronIcon}
            />
          </View>
          <Text style={styles.exerciseSets}>{formatSets(exercise.sets)}</Text>
        </View>
      </TouchableOpacity>

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

      {isExpanded && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            {exercise.description}
          </Text>
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
  button: {
    width: '100%',
    paddingLeft: 16,
    paddingRight: 52,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  favoriteButtonTop: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 6,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseName: {
    flex: 1,
    color: '#111827',
    fontWeight: '600',
    fontSize: 16,
  },
  exerciseSets: {
    color: '#9333ea',
    fontSize: 14,
    marginTop: 4,
  },
  chevronIcon: {
    flexShrink: 0,
  },
  descriptionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#f9fafb',
  },
  descriptionText: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
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

export default ExerciseCard;