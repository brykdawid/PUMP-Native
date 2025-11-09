import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function ExerciseCard({ exercise, exerciseId, isExpanded, onToggle }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onToggle}
        style={styles.button}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: exercise.image }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseSets}>{exercise.sets}</Text>
        </View>

        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#9333ea"
          style={styles.icon}
        />
      </TouchableOpacity>
      
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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  button: {
    width: '100%',
    padding: 16,
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
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
  },
  exerciseName: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 16,
  },
  exerciseSets: {
    color: '#9333ea',
    fontSize: 14,
    marginTop: 4,
  },
  icon: {
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
});

export default ExerciseCard;