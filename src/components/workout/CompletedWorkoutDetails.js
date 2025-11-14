import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GifModal from './GifModal';
import { useToast } from '../../contexts/ToastContext';
import storage from '../../utils/storage';

function CompletedWorkoutDetails({ workout, onClose, onSaveCompletedWorkoutAsTemplate, onRemoveCompletedWorkoutAsTemplate, isWorkoutSavedAsTemplate }) {
  const { showToast } = useToast();
  const [expandedExercises, setExpandedExercises] = useState({});
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [favoriteExercises, setFavoriteExercises] = useState([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const saved = await storage.getItem('favoriteExercises');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFavoriteExercises(parsed);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (exercise) => {
    if (!exercise) return;

    const exerciseName = exercise.name;
    const exists = favoriteExercises.find(ex => ex.name === exerciseName);

    let updated;
    if (exists) {
      updated = favoriteExercises.filter(ex => ex.name !== exerciseName);
    } else {
      updated = [...favoriteExercises, {
        name: exercise.name,
        image: exercise.image,
        description: exercise.description,
        tips: exercise.tips,
        labels: exercise.labels,
        category: exercise.category,
        savedAt: new Date().toISOString()
      }];
    }

    try {
      await storage.setItem('favoriteExercises', JSON.stringify(updated));
      setFavoriteExercises(updated);

      if (exists) {
        showToast(`${exerciseName} usunięte z ulubionych`, 'info');
      } else {
        showToast(`${exerciseName} dodane do ulubionych`, 'success');
      }
    } catch (error) {
      console.error('Error saving favorites:', error);
      showToast('Błąd podczas zapisywania', 'error');
    }
  };

  const isFavorite = (exercise) => {
    if (!exercise) return false;
    return favoriteExercises.some(ex => ex.name === exercise.name);
  };

  const exercisesByCategory = useMemo(() => {
    const grouped = {};
    if (workout?.exercises) {
      workout.exercises.forEach(ex => {
        const category = ex.category || 'inne';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(ex);
      });
    }
    return grouped;
  }, [workout]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpandExercise = (exerciseName) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseName]: !prev[exerciseName]
    }));
  };

  const handleSaveWorkout = () => {
    if (!workout) return;

    // Check if workout is already saved
    const isSaved = isWorkoutSavedAsTemplate && isWorkoutSavedAsTemplate(workout);

    if (isSaved) {
      // Remove from saved workouts
      if (onRemoveCompletedWorkoutAsTemplate) {
        onRemoveCompletedWorkoutAsTemplate(workout);
      }
    } else {
      // Add to saved workouts
      if (onSaveCompletedWorkoutAsTemplate) {
        onSaveCompletedWorkoutAsTemplate(workout);
      }
    }
  };

  const getCategoryName = (id) => {
    const names = {
      'barki': 'Barki',
      'biceps': 'Biceps',
      'brzuch': 'Brzuch',
      'klatka': 'Klatka',
      'nogi': 'Nogi',
      'plecy': 'Plecy',
      'posladki': 'Pośladki',
      'przedramiona': 'Przedramiona',
      'triceps': 'Triceps',
      'inne': 'Inne'
    };
    return names[id] || id;
  };

  const getCategoryIcon = (id) => {
    const icons = {
      'barki': '💪',
      'biceps': '💪',
      'brzuch': '🔥',
      'klatka': '🦅',
      'nogi': '🦵',
      'plecy': '🏋️',
      'posladki': '🍑',
      'przedramiona': '✊',
      'triceps': '💪',
      'inne': '⚙️'
    };
    return icons[id] || '💪';
  };

  const totalExercises = workout?.exercises?.length || 0;
  const completedExercises = workout?.exercises?.filter(ex => {
    const sets = Array.isArray(ex.sets) ? ex.sets : [];
    return sets.length > 0 && sets.some(set => set.completed);
  }).length || 0;

  if (!workout) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1f2937', '#111827']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Szczegóły treningu</Text>
          <TouchableOpacity
            onPress={handleSaveWorkout}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isWorkoutSavedAsTemplate && isWorkoutSavedAsTemplate(workout) ? "star" : "star-outline"}
              size={24}
              color={isWorkoutSavedAsTemplate && isWorkoutSavedAsTemplate(workout) ? "#fbbf24" : "#ffffff"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutTitle} numberOfLines={2} ellipsizeMode="tail">{workout.title}</Text>
            <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={20} color="#ffffff" />
            <Text style={styles.statText}>{formatTime(workout.duration)}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.statText}>
              {completedExercises}/{totalExercises} ćwiczeń
            </Text>
          </View>
          {workout.totalVolume > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="barbell-outline" size={20} color="#ffffff" />
              <Text style={styles.statText}>
                {workout.totalVolume.toLocaleString()} kg
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(exercisesByCategory).map(([category, exercises]) => (
          <View key={category} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryIcon}>{getCategoryIcon(category)}</Text>
              <Text style={styles.categoryTitle}>{getCategoryName(category)}</Text>
              <Text style={styles.categoryCount}>({exercises.length})</Text>
            </View>

            {exercises.map((exercise, idx) => {
              const isExpanded = expandedExercises[exercise.name];
              const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
              const completedSets = sets.filter(s => s.completed).length;
              const hasImageError = imageErrors[exercise.name];

              return (
                <View key={idx} style={styles.exerciseCard}>
                  <TouchableOpacity
                    onPress={() => toggleExpandExercise(exercise.name)}
                    style={styles.exerciseHeader}
                    activeOpacity={0.7}
                  >
                    {/* Exercise Image/GIF */}
                    <TouchableOpacity
                      onPress={() => setSelectedExercise(exercise)}
                      style={styles.exerciseImageContainer}
                      activeOpacity={0.8}
                    >
                      {exercise.image && !hasImageError ? (
                        <Image
                          source={{ uri: exercise.image }}
                          style={styles.exerciseImage}
                          resizeMode="cover"
                          onError={() => {
                            setImageErrors(prev => ({ ...prev, [exercise.name]: true }));
                          }}
                        />
                      ) : (
                        <View style={styles.exerciseImagePlaceholder}>
                          <Ionicons name="barbell-outline" size={32} color="#d1d5db" />
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Exercise Info */}
                    <View style={styles.exerciseHeaderLeft}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseSets}>
                        {completedSets}/{sets.length} serie ukończone
                      </Text>
                    </View>

                    {/* Expand Icon */}
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>

                  {isExpanded && sets.length > 0 && (
                    <View style={styles.setsContainer}>
                      {sets.map((set, setIdx) => (
                        <View key={setIdx} style={styles.setRow}>
                          <Text style={styles.setNumber}>{setIdx + 1}</Text>

                          <View style={[
                            styles.setValueBox,
                            set.completed && styles.setValueBoxCompleted
                          ]}>
                            <Text style={styles.setValueText}>
                              {set.weight || '0'} kg
                            </Text>
                          </View>

                          <Text style={styles.setX}>×</Text>

                          <View style={[
                            styles.setValueBox,
                            set.completed && styles.setValueBoxCompleted
                          ]}>
                            <Text style={styles.setValueText}>
                              {set.reps || '0'} powt.
                            </Text>
                          </View>

                          <Ionicons
                            name={set.completed ? 'checkmark-circle' : 'close-circle'}
                            size={24}
                            color={set.completed ? '#10b981' : '#ef4444'}
                          />
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <GifModal
        exercise={selectedExercise}
        onClose={() => setSelectedExercise(null)}
        onToggleFavorite={() => toggleFavorite(selectedExercise)}
        isFavorite={isFavorite(selectedExercise)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerContent: {
    marginBottom: 16,
  },
  workoutInfo: {
    alignItems: 'center',
  },
  workoutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 14,
    color: '#d1d5db',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  categoryCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  exerciseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 16,
  },
  exerciseImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#f3f4f6',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  exerciseImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  exerciseHeaderLeft: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  exerciseSets: {
    fontSize: 14,
    color: '#6b7280',
  },
  setsContainer: {
    padding: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  setNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
    width: 24,
  },
  setValueBox: {
    minWidth: 70,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  setValueBoxCompleted: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  setValueText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  setX: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
});

export default CompletedWorkoutDetails;
