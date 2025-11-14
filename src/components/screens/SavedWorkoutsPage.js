import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import storage, { confirmDialog } from '../../utils/storage';
import { normalizeWorkout, getTotalExercises as getExerciseCount, getLocalISOString } from '../../utils/workoutHelpers';
import GifModal from '../workout/GifModal';
import ExerciseCard from '../workout/ExerciseCard';

function SavedWorkoutsPage({ savedWorkouts, onDeleteWorkout, onBeginWorkout, onUpdateWorkout, onScheduleWorkout }) {
  const [activeTab, setActiveTab] = useState('workouts');
  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const [selectedGif, setSelectedGif] = useState(null);
  const [savedExercises, setSavedExercises] = useState([]);
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');

  const translateCategory = (category) => {
    const translations = {
      'shoulders': 'barki',
      'biceps': 'biceps',
      'abs': 'brzuch',
      'chest': 'klatka',
      'legs': 'nogi',
      'back': 'plecy',
      'glutes': 'pośladki',
      'forearms': 'przedramiona',
      'triceps': 'triceps',
    };
    return translations[category?.toLowerCase()] || category;
  };

  useEffect(() => {
    loadSavedExercises();
  }, []);

  const loadSavedExercises = async () => {
    try {
      const saved = await storage.getItem('favoriteExercises');
      if (saved) {
        setSavedExercises(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved exercises:', error);
    }
  };

  const toggleFavorite = async (exercise) => {
    const exists = savedExercises.find(ex => ex.name === exercise.name);

    let updated;
    if (exists) {
      updated = savedExercises.filter(ex => ex.name !== exercise.name);
    } else {
      updated = [...savedExercises, {
        name: exercise.name,
        image: exercise.image,
        description: exercise.description,
        tips: exercise.tips,
        labels: exercise.labels,
        category: exercise.category,
        savedAt: getLocalISOString()
      }];
    }

    try {
      await storage.setItem('favoriteExercises', JSON.stringify(updated));
      setSavedExercises(updated);
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const removeSavedExercise = async (exerciseName) => {
    const updated = savedExercises.filter(ex => ex.name !== exerciseName);
    setSavedExercises(updated);

    try {
      await storage.setItem('favoriteExercises', JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing saved exercise:', error);
    }
  };

  const isFavorite = (exerciseName) => {
    return savedExercises.some(ex => ex.name === exerciseName);
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

  const getTotalExercises = (workout) => {
    return getExerciseCount(workout);
  };

  const toggleExpand = (workoutId) => {
    setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId);
    setExpandedExercise(null);
  };

  const handleStartWorkout = (workout) => {
    const normalized = normalizeWorkout(workout);

    const workoutData = {
      title: normalized.title || 'Trening',
      exercises: normalized.exercises.map(ex => ({
        ...ex,
        id: `${ex.name}-${Date.now()}-${Math.random()}`
      })),
      type: normalized.type
    };

    if (onBeginWorkout) {
      onBeginWorkout(workoutData, null, false);
    }
  };

  const handleScheduleWorkout = (workout) => {
    const normalized = normalizeWorkout(workout);

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;

    const workoutData = {
      id: Date.now(),
      title: normalized.title || 'Trening',
      exercises: normalized.exercises.map(ex => ({
        ...ex,
        id: `${ex.name}-${Date.now()}-${Math.random()}`
      })),
      type: normalized.type,
      date: todayString,
      scheduled: true
    };

    if (onScheduleWorkout) {
      onScheduleWorkout(workoutData);
      Alert.alert('Sukces', 'Trening został zaplanowany na dzisiaj!');
    }
  };

  const startEditingTitle = (workout) => {
    setEditingWorkoutId(workout.id);
    setEditedTitle(workout.title || 'Trening');
  };

  const cancelEditingTitle = () => {
    setEditingWorkoutId(null);
    setEditedTitle('');
  };

  const saveEditedTitle = (workoutId) => {
    if (!editedTitle.trim()) {
      Alert.alert('Błąd', 'Tytuł nie może być pusty!');
      return;
    }

    if (onUpdateWorkout) {
      onUpdateWorkout(workoutId, { title: editedTitle.trim() });
    }

    setEditingWorkoutId(null);
    setEditedTitle('');
  };

  const handleDelete = (workoutId) => {
    console.log('🗑️ SavedWorkouts: Attempting to delete workout', workoutId);
    confirmDialog(
      'Usuń trening',
      'Czy na pewno chcesz usunąć ten trening?',
      () => {
        console.log('✅ SavedWorkouts: User confirmed deletion, calling onDeleteWorkout');
        if (onDeleteWorkout) {
          onDeleteWorkout(workoutId);
        } else {
          console.error('❌ SavedWorkouts: onDeleteWorkout is not defined');
        }
      },
      () => {
        console.log('❌ SavedWorkouts: User cancelled deletion');
      }
    );
  };

  return (
    <LinearGradient
      colors={['#faf5ff', '#fce7f3']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Zapisane</Text>
          <Text style={styles.subtitle}>Twoje ulubione treningi i ćwiczenia</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('workouts')}
            style={[styles.tab, activeTab === 'workouts' && styles.tabActive]}
            activeOpacity={0.7}
          >
            {activeTab === 'workouts' ? (
              <LinearGradient
                colors={['#9333ea', '#7c3aed']}
                style={styles.tabGradient}
              >
                <Ionicons name="barbell" size={20} color="#ffffff" />
                <Text style={styles.tabTextActive}>
                  Treningi ({savedWorkouts.length})
                </Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabInactive}>
                <Ionicons name="barbell" size={20} color="#4b5563" />
                <Text style={styles.tabTextInactive}>
                  Treningi ({savedWorkouts.length})
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('exercises')}
            style={[styles.tab, activeTab === 'exercises' && styles.tabActive]}
            activeOpacity={0.7}
          >
            {activeTab === 'exercises' ? (
              <LinearGradient
                colors={['#9333ea', '#7c3aed']}
                style={styles.tabGradient}
              >
                <Ionicons name="star" size={20} color="#ffffff" />
                <Text style={styles.tabTextActive}>
                  Ćwiczenia ({savedExercises.length})
                </Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabInactive}>
                <Ionicons name="star" size={20} color="#4b5563" />
                <Text style={styles.tabTextInactive}>
                  Ćwiczenia ({savedExercises.length})
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Workouts Tab */}
        {activeTab === 'workouts' && (
          <>
            {savedWorkouts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="bookmark-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyTitle}>Brak Zapisanych Treningów</Text>
                <Text style={styles.emptyText}>
                  Zapisz swoje ulubione treningi, aby mieć do nich szybki dostęp!
                </Text>
              </View>
            ) : (
              <View style={styles.workoutsList}>
                {savedWorkouts.map((workout) => {
                  const normalized = normalizeWorkout(workout);
                  const isExpanded = expandedWorkout === workout.id;
                  const isEditing = editingWorkoutId === workout.id;

                  return (
                    <View key={workout.id} style={styles.workoutCard}>
                      {/* Header */}
                      <View style={styles.workoutHeader}>
                        <View style={styles.workoutHeaderTop}>
                          {isEditing ? (
                            <View style={styles.editContainer}>
                              <TextInput
                                style={styles.editInput}
                                value={editedTitle}
                                onChangeText={setEditedTitle}
                                placeholder="Nazwa treningu"
                                autoFocus
                              />
                              <View style={styles.editButtons}>
                                <TouchableOpacity
                                  onPress={() => saveEditedTitle(workout.id)}
                                  style={styles.editButton}
                                >
                                  <Ionicons name="checkmark" size={20} color="#16a34a" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={cancelEditingTitle}
                                  style={styles.editButton}
                                >
                                  <Ionicons name="close" size={20} color="#ef4444" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          ) : (
                            <>
                              <View style={styles.workoutTitleContainer}>
                                {workout.isFavorite && (
                                  <Ionicons name="star" size={16} color="#facc15" />
                                )}
                                <Text style={styles.workoutTitle} numberOfLines={1} ellipsizeMode="tail">
                                  {normalized.title || 'Trening'}
                                </Text>
                              </View>
                              <TouchableOpacity
                                onPress={() => startEditingTitle(workout)}
                                style={styles.iconButton}
                              >
                                <Ionicons name="create-outline" size={20} color="#6b7280" />
                              </TouchableOpacity>
                            </>
                          )}
                        </View>

                        <View style={styles.workoutMeta}>
                          <View style={styles.metaItem}>
                            <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                            <Text style={styles.metaText}>
                              {workout.date ? new Date(workout.date + 'T00:00:00').toLocaleDateString('pl-PL') : 'Brak daty'}
                            </Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Ionicons name="fitness-outline" size={14} color="#6b7280" />
                            <Text style={styles.metaText}>
                              {getTotalExercises(workout)} ćwiczeń
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Actions */}
                      <View style={styles.workoutActions}>
                        <TouchableOpacity
                          onPress={() => handleStartWorkout(workout)}
                          style={styles.actionButton}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={['#16a34a', '#15803d']}
                            style={styles.actionButtonGradient}
                          >
                            <Ionicons name="play-circle" size={18} color="#ffffff" />
                            <Text style={styles.actionButtonText}>Rozpocznij</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleScheduleWorkout(workout)}
                          style={styles.actionButton}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={['#ea580c', '#c2410c']}
                            style={styles.actionButtonGradient}
                          >
                            <Ionicons name="calendar" size={18} color="#ffffff" />
                            <Text style={styles.actionButtonText}>Zaplanuj</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => toggleExpand(workout.id)}
                          style={styles.expandButton}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color="#6b7280"
                          />
                          <Text style={styles.expandButtonText}>
                            {isExpanded ? 'Zwiń' : 'Podgląd'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDelete(workout.id)}
                          style={styles.deleteButton}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <View style={styles.expandedContent}>
                          {normalized.exercises && normalized.exercises.length > 0 && (
                            <View style={styles.exercisesList}>
                              {normalized.exercises.map((ex, idx) => (
                                <ExerciseCard
                                  key={idx}
                                  exercise={ex}
                                  exerciseId={idx}
                                  onToggle={() => setSelectedGif(ex)}
                                />
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Exercises Tab */}
        {activeTab === 'exercises' && (
          <>
            {savedExercises.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="star-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyTitle}>Brak Zapisanych Ćwiczeń</Text>
                <Text style={styles.emptyText}>
                  Kliknij gwiazdkę przy ćwiczeniu, aby dodać je tutaj!
                </Text>
              </View>
            ) : (
              <View style={styles.exercisesList}>
                {savedExercises.map((exercise, idx) => (
                  <View key={idx} style={styles.exerciseCard}>
                    <ExerciseCard
                      exercise={exercise}
                      exerciseId={idx}
                      onToggle={() => setSelectedGif(exercise)}
                    />
                    <View style={styles.exerciseCardFooter}>
                      {exercise.labels && exercise.labels.length > 0 && (
                        <View style={styles.labelsContainer}>
                          {exercise.labels.slice(0, 4).map((label, i) => (
                            <View key={i} style={styles.labelChip}>
                              <Text style={styles.labelChipText}>
                                {translateCategory(label)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                      <TouchableOpacity
                        onPress={() => removeSavedExercise(exercise.name)}
                        style={styles.removeButton}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    {exercise.savedAt && (
                      <Text style={styles.savedAtText}>
                        Zapisano: {formatDate(exercise.savedAt)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <GifModal
        exercise={selectedGif}
        onClose={() => setSelectedGif(null)}
        onToggleFavorite={() => selectedGif && toggleFavorite(selectedGif)}
        isFavorite={selectedGif ? isFavorite(selectedGif.name) : false}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    gap: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
  },
  tabActive: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tabTextActive: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextInactive: {
    color: '#4b5563',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  workoutsList: {
    gap: 16,
  },
  workoutCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  workoutHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  workoutHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  workoutTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  editContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  editInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  editButton: {
    padding: 8,
  },
  iconButton: {
    padding: 8,
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  workoutActions: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  actionButton: {
    flex: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  expandButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  expandButtonText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  exercisesList: {
    gap: 12,
    padding: 12,
  },
  exerciseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  exerciseCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  labelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  labelChip: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d8b4fe',
  },
  labelChipText: {
    fontSize: 10,
    color: '#7c3aed',
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
  },
  savedAtText: {
    fontSize: 10,
    color: '#9ca3af',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});

export default SavedWorkoutsPage;