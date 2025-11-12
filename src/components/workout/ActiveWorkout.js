import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GifModal from './GifModal';
import CalendarTab from './CalendarTab';
import { getExercises } from '../../utils/apiHelpers';
import { TRAINING_TYPES } from '../data/exercisesData';
import { getLocalISOString } from '../../utils/workoutHelpers';

function ActiveWorkout({
  activeWorkout,
  workoutStartTime,
  targetDate,
  onEndWorkout,
  onGoToPlan,
  onBeginWorkout,
  workoutHistory,
  setWorkoutHistory,
  onSaveWorkout,
  onSaveCompletedWorkoutAsTemplate,
  onRemoveCompletedWorkoutAsTemplate,
  isWorkoutSavedAsTemplate
}) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [exerciseSets, setExerciseSets] = useState({});
  const [expandedExercises, setExpandedExercises] = useState({});
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [searchQueries, setSearchQueries] = useState({});
  const [showSearchForCategory, setShowSearchForCategory] = useState(null);
  const [showMuscleGroupModal, setShowMuscleGroupModal] = useState(false);
  const [showEndWorkoutModal, setShowEndWorkoutModal] = useState(false);
  const [validationError, setValidationError] = useState(null);

  const workoutType = activeWorkout?.type || 'custom';

  const exercisesByCategory = useMemo(() => {
    const grouped = {};
    workoutExercises.forEach(ex => {
      const category = ex.category || 'inne';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(ex);
    });
    return grouped;
  }, [workoutExercises]);

  useEffect(() => {
    if (!workoutStartTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - workoutStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [workoutStartTime]);

  useEffect(() => {
    if (activeWorkout && activeWorkout.exercises) {
      setWorkoutExercises(activeWorkout.exercises);
      const initialSets = {};
      const initialExpanded = {};
      activeWorkout.exercises.forEach(exercise => {
        initialSets[exercise.name] = [{ weight: '', reps: '', completed: false }];
        initialExpanded[exercise.name] = true; // Domyślnie rozwinięte
      });
      setExerciseSets(initialSets);
      setExpandedExercises(initialExpanded);
    }
  }, [activeWorkout]);

  useEffect(() => {
    let mounted = true;
    async function loadExercises() {
      try {
        const data = await getExercises();
        if (mounted) {
          setAllExercises(data);
        }
      } catch (error) {
        console.error('Error loading exercises:', error);
      }
    }
    loadExercises();
    return () => { mounted = false; };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleExpandExercise = (exerciseName) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseName]: !prev[exerciseName]
    }));
  };

  const addSet = (exerciseName) => {
    setExerciseSets(prev => ({
      ...prev,
      [exerciseName]: [
        ...(prev[exerciseName] || []),
        { weight: '', reps: '', completed: false }
      ]
    }));
  };

  const updateSet = (exerciseName, setIndex, field, value) => {
    setExerciseSets(prev => ({
      ...prev,
      [exerciseName]: prev[exerciseName].map((set, idx) =>
        idx === setIndex ? { ...set, [field]: value } : set
      )
    }));
  };

  const toggleSetComplete = (exerciseName, setIndex) => {
    console.log('=== toggleSetComplete WYWOŁANE ===');
    console.log('Exercise:', exerciseName, 'Set index:', setIndex);

    setExerciseSets(prev => {
      const currentSet = prev[exerciseName][setIndex];
      console.log('Current set:', currentSet);
      console.log('Current set completed:', currentSet.completed);
      console.log('Current set weight:', currentSet.weight);
      console.log('Current set reps:', currentSet.reps);

      // Jeśli próbujemy oznaczyć serię jako ukończoną (currently not completed)
      if (!currentSet.completed) {
        console.log('Seria NIE jest ukończona - sprawdzam walidację');

        const weightStr = String(currentSet.weight || '').trim();
        const repsStr = String(currentSet.reps || '').trim();

        console.log('weightStr:', weightStr);
        console.log('repsStr:', repsStr);

        // Sprawdź czy pola są puste
        if (!weightStr || !repsStr) {
          console.log('BŁĄD: Puste pola!');
          const errorMsg = 'Musisz wypełnić wagę i liczbę powtórzeń.';
          console.log('Ustawiam błąd walidacji:', errorMsg);
          setValidationError(errorMsg);
          return prev;
        }

        const weight = parseFloat(weightStr);
        const reps = parseFloat(repsStr);

        console.log('Parsed weight:', weight);
        console.log('Parsed reps:', reps);
        console.log('isNaN(weight):', isNaN(weight));
        console.log('weight <= 0:', weight <= 0);
        console.log('isNaN(reps):', isNaN(reps));
        console.log('reps <= 0:', reps <= 0);

        // Walidacja: kg i reps muszą być liczbami większymi od 0
        if (isNaN(weight) || weight <= 0 || isNaN(reps) || reps <= 0) {
          console.log('BŁĄD: Wartości <= 0 lub NaN!');
          const errorMsg = 'Waga i liczba powtórzeń muszą być większe od 0.';
          console.log('Ustawiam błąd walidacji:', errorMsg);
          setValidationError(errorMsg);
          return prev; // Nie zmieniaj stanu
        }

        console.log('Walidacja PRZESZŁA - zaznaczam serię jako ukończoną');
      } else {
        console.log('Seria JEST ukończona - odznaczam');
      }

      // Walidacja przeszła lub odznaczamy serię - zmień stan
      return {
        ...prev,
        [exerciseName]: prev[exerciseName].map((set, idx) =>
          idx === setIndex ? { ...set, completed: !set.completed } : set
        )
      };
    });
  };

  const removeSet = (exerciseName, setIndex) => {
    setExerciseSets(prev => ({
      ...prev,
      [exerciseName]: prev[exerciseName].filter((_, idx) => idx !== setIndex)
    }));
  };

  const removeExercise = (exerciseName) => {
    Alert.alert(
      'Usuń ćwiczenie',
      'Czy na pewno chcesz usunąć to ćwiczenie z treningu?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            setWorkoutExercises(prev => prev.filter(ex => ex.name !== exerciseName));
            setExerciseSets(prev => {
              const newSets = { ...prev };
              delete newSets[exerciseName];
              return newSets;
            });
          }
        }
      ]
    );
  };

  const addExerciseToWorkout = (exercise, category) => {
    const newExercise = {
      ...exercise,
      category: category,
      id: `${exercise.name}-${Date.now()}`
    };

    setWorkoutExercises(prev => [...prev, newExercise]);
    setExerciseSets(prev => ({
      ...prev,
      [exercise.name]: [{ weight: '', reps: '', completed: false }]
    }));
    setExpandedExercises(prev => ({
      ...prev,
      [exercise.name]: true
    }));
  };

  const getFilteredExercisesForCategory = (category) => {
    const query = (searchQueries[category] || '').toLowerCase();
    const categoryLabels = {
      'barki': 'shoulders',
      'biceps': 'biceps',
      'brzuch': 'abs',
      'klatka': 'chest',
      'nogi': 'legs',
      'plecy': 'back',
      'posladki': 'glutes',
      'przedramiona': 'forearms',
      'triceps': 'triceps'
    };
    
    const targetLabel = categoryLabels[category];
    const currentExerciseNames = workoutExercises.map(ex => ex.name);
    
    return allExercises.filter(ex => {
      if (currentExerciseNames.includes(ex.name)) return false;
      if (!ex.labels || !ex.labels.includes(targetLabel)) return false;
      if (query && !ex.name.toLowerCase().includes(query)) return false;
      return true;
    });
  };

  const handleAddMuscleGroup = (groupId) => {
    setShowMuscleGroupModal(false);
    
    const categoryLabels = {
      'barki': 'shoulders',
      'biceps': 'biceps',
      'brzuch': 'abs',
      'klatka': 'chest',
      'nogi': 'legs',
      'plecy': 'back',
      'posladki': 'glutes',
      'przedramiona': 'forearms',
      'triceps': 'triceps'
    };
    
    const targetLabel = categoryLabels[groupId];
    const categoryExercises = allExercises.filter(ex =>
      ex.labels && ex.labels.includes(targetLabel)
    );
    
    if (categoryExercises.length === 0) {
      Alert.alert('Info', 'Brak ćwiczeń dla tej grupy mięśniowej');
      return;
    }
    
    const randomExercise = categoryExercises[Math.floor(Math.random() * categoryExercises.length)];
    addExerciseToWorkout(randomExercise, groupId);
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

  const handleEndWorkout = () => {
    console.log('handleEndWorkout called - showing modal');
    setShowEndWorkoutModal(true);
  };

  const confirmEndWorkout = () => {
    console.log('User confirmed end workout');
    setShowEndWorkoutModal(false);

    // Generate title from categories
    const categories = Object.keys(exercisesByCategory);
    const title = categories.map(cat => getCategoryName(cat)).join('+');

    // Calculate total training volume (weight × reps for all completed sets)
    let totalVolume = 0;
    workoutExercises.forEach(ex => {
      const sets = exerciseSets[ex.name] || [];
      sets.forEach(set => {
        if (set.completed) {
          const weight = parseFloat(set.weight) || 0;
          const reps = parseFloat(set.reps) || 0;
          totalVolume += weight * reps;
        }
      });
    });

    const workoutData = {
      id: Date.now(),
      date: getLocalISOString(),
      duration: elapsedTime,
      title: title || 'Trening',
      type: workoutType,
      totalVolume: Math.round(totalVolume),
      exercises: workoutExercises.map(ex => ({
        name: ex.name,
        category: ex.category,
        image: ex.image,
        description: ex.description || '',
        tips: ex.tips || [],
        labels: ex.labels || [],
        sets: exerciseSets[ex.name] || []
      }))
    };

    // Update workout history first
    if (setWorkoutHistory) {
      setWorkoutHistory(prev => {
        const updated = [...prev, workoutData];
        return updated;
      });
    }

    // Use setTimeout to ensure state update completes before navigation
    setTimeout(() => {
      if (onEndWorkout) {
        onEndWorkout();
      }
    }, 100);
  };

  const totalExercises = workoutExercises.length;
  const completedExercises = workoutExercises.filter(ex => {
    const sets = exerciseSets[ex.name] || [];
    return sets.length > 0 && sets.every(set => set.completed);
  }).length;

  if (!activeWorkout && !workoutStartTime) {
    return (
      <CalendarTab
        workoutHistory={workoutHistory}
        setWorkoutHistory={setWorkoutHistory}
        onGoToPlan={onGoToPlan}
        onSaveWorkout={onSaveWorkout}
        onSaveCompletedWorkoutAsTemplate={onSaveCompletedWorkoutAsTemplate}
        onRemoveCompletedWorkoutAsTemplate={onRemoveCompletedWorkoutAsTemplate}
        isWorkoutSavedAsTemplate={isWorkoutSavedAsTemplate}
      />
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1f2937', '#111827']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={24} color="#ffffff" />
            <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
          </View>
          <View style={styles.progressContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.progressText}>
              {completedExercises}/{totalExercises}
            </Text>
          </View>
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

            {exercises.map((exercise) => {
              const isExpanded = expandedExercises[exercise.name];
              const sets = exerciseSets[exercise.name] || [];
              const completedSets = sets.filter(s => s.completed).length;
              const allSetsCompleted = sets.length > 0 && sets.every(s => s.completed);

              return (
                <View key={exercise.id || exercise.name} style={[
                  styles.exerciseCard,
                  allSetsCompleted && styles.exerciseCardCompleted
                ]}>
                  <View style={styles.exerciseHeader}>
                    <TouchableOpacity
                      onPress={() => toggleExpandExercise(exercise.name)}
                      style={styles.exerciseClickableArea}
                      activeOpacity={0.7}
                    >
                      {/* Exercise Image/GIF */}
                      <TouchableOpacity
                        onPress={() => setSelectedExercise(exercise)}
                        style={styles.exerciseImageContainer}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{ uri: exercise.image }}
                          style={styles.exerciseImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>

                      {/* Exercise Info */}
                      <View style={styles.exerciseHeaderLeft}>
                        <Text style={[
                          styles.exerciseName,
                          allSetsCompleted && styles.exerciseNameCompleted
                        ]}>{exercise.name}</Text>
                        {allSetsCompleted ? (
                          <View style={styles.completedLabelContainer}>
                            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                            <Text style={styles.completedLabel}>Ukończono</Text>
                          </View>
                        ) : (
                          <Text style={styles.exerciseSets}>
                            {completedSets}/{sets.length} serie
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Remove button - Right edge, centered vertically */}
                    <View style={styles.exerciseHeaderRight}>
                      <TouchableOpacity
                        onPress={() => removeExercise(exercise.name)}
                        style={styles.removeButton}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-circle" size={32} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {isExpanded && (
                    <View style={styles.setsContainer}>
                      {sets.map((set, idx) => (
                        <View key={idx} style={styles.setRow}>
                          <Text style={styles.setNumber}>{idx + 1}</Text>
                          
                          <TextInput
                            style={[styles.setInput, set.completed && styles.setInputCompleted]}
                            value={set.weight}
                            onChangeText={(value) => updateSet(exercise.name, idx, 'weight', value)}
                            placeholder="kg"
                            keyboardType="decimal-pad"
                            editable={!set.completed}
                          />
                          
                          <Text style={styles.setX}>×</Text>
                          
                          <TextInput
                            style={[styles.setInput, set.completed && styles.setInputCompleted]}
                            value={set.reps}
                            onChangeText={(value) => updateSet(exercise.name, idx, 'reps', value)}
                            placeholder="reps"
                            keyboardType="number-pad"
                            editable={!set.completed}
                          />

                          <TouchableOpacity
                            onPress={() => toggleSetComplete(exercise.name, idx)}
                            style={[styles.checkButton, set.completed && styles.checkButtonActive]}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={set.completed ? 'checkmark-circle' : 'checkmark-circle-outline'}
                              size={32}
                              color={set.completed ? '#10b981' : '#3b82f6'}
                            />
                          </TouchableOpacity>

                          {sets.length > 1 && (
                            <TouchableOpacity
                              onPress={() => removeSet(exercise.name, idx)}
                              style={styles.deleteSetButton}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="trash-outline" size={18} color="#ef4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}

                      <TouchableOpacity
                        onPress={() => addSet(exercise.name)}
                        style={styles.addSetButton}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add-circle" size={20} color="#9333ea" />
                        <Text style={styles.addSetButtonText}>Dodaj serię</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}

            <TouchableOpacity
              onPress={() => setShowSearchForCategory(category)}
              style={styles.addExerciseButton}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={20} color="#9333ea" />
              <Text style={styles.addExerciseButtonText}>Dodaj ćwiczenie</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          onPress={() => setShowMuscleGroupModal(true)}
          style={styles.addGroupButton}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#f3e8ff', '#fce7f3']}
            style={styles.addGroupGradient}
          >
            <Ionicons name="add-circle-outline" size={24} color="#7c3aed" />
            <Text style={styles.addGroupButtonText}>Dodaj grupę mięśniową</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            console.log('END BUTTON PRESSED!');
            handleEndWorkout();
          }}
          style={styles.endButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#ef4444', '#dc2626']}
            style={styles.endButtonGradient}
          >
            <Text style={styles.endButtonText}>Zakończ Sesję</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showSearchForCategory !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSearchForCategory(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.searchModal}>
            <View style={styles.searchModalHeader}>
              <Text style={styles.searchModalTitle}>Dodaj ćwiczenie</Text>
              <TouchableOpacity
                onPress={() => setShowSearchForCategory(null)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              value={searchQueries[showSearchForCategory] || ''}
              onChangeText={(text) => setSearchQueries(prev => ({
                ...prev,
                [showSearchForCategory]: text
              }))}
              placeholder="Szukaj ćwiczenia..."
              autoFocus
            />

            <ScrollView style={styles.searchResults}>
              {showSearchForCategory && getFilteredExercisesForCategory(showSearchForCategory).length > 0 ? (
                getFilteredExercisesForCategory(showSearchForCategory).slice(0, 10).map((exercise, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      addExerciseToWorkout(exercise, showSearchForCategory);
                      setShowSearchForCategory(null);
                    }}
                    style={styles.searchResultItem}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.searchResultText}>{exercise.name}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noResultsText}>Brak dostępnych ćwiczeń</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showMuscleGroupModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMuscleGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.muscleGroupModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wybierz grupę mięśniową</Text>
              <TouchableOpacity
                onPress={() => setShowMuscleGroupModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.muscleGroupGrid}>
              <View style={styles.muscleGroupGridContent}>
                {TRAINING_TYPES.filter(type => type.id !== 'fullbody').map(type => {
                  const alreadyExists = Object.keys(exercisesByCategory).some(cat =>
                    cat.toLowerCase() === type.id.toLowerCase()
                  );

                  return (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() => !alreadyExists && handleAddMuscleGroup(type.id)}
                      disabled={alreadyExists}
                      style={[
                        styles.muscleGroupCard,
                        alreadyExists && styles.muscleGroupCardDisabled
                      ]}
                      activeOpacity={0.7}
                    >
                      {alreadyExists && (
                        <View style={styles.muscleGroupCheck}>
                          <Ionicons name="checkmark" size={16} color="#ffffff" />
                        </View>
                      )}
                      <Text style={styles.muscleGroupEmoji}>💪</Text>
                      <Text style={styles.muscleGroupName}>{type.name}</Text>
                      {alreadyExists && (
                        <Text style={styles.muscleGroupAlready}>Już w treningu</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEndWorkoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEndWorkoutModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmModalTitle}>Zakończ sesję</Text>
            <Text style={styles.confirmModalMessage}>
              Czy na pewno chcesz zakończyć trening?
            </Text>

            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                onPress={() => {
                  console.log('User cancelled');
                  setShowEndWorkoutModal(false);
                }}
                style={[styles.confirmModalButton, styles.confirmModalButtonCancel]}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmModalButtonTextCancel}>Anuluj</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmEndWorkout}
                style={[styles.confirmModalButton, styles.confirmModalButtonConfirm]}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  style={styles.confirmModalButtonGradient}
                >
                  <Text style={styles.confirmModalButtonTextConfirm}>Zakończ</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={validationError !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setValidationError(null)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.validationErrorIcon}>
              <Ionicons name="alert-circle" size={48} color="#ef4444" />
            </View>
            <Text style={styles.confirmModalTitle}>Nieprawidłowe dane</Text>
            <Text style={styles.confirmModalMessage}>
              {validationError}
            </Text>

            <TouchableOpacity
              onPress={() => setValidationError(null)}
              style={[styles.confirmModalButton, styles.validationErrorButton]}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmModalButtonTextConfirm}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <GifModal
        exercise={selectedExercise}
        onClose={() => setSelectedExercise(null)}
        onToggleFavorite={() => {}}
        isFavorite={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    fontSize: 16,
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
  exerciseCardCompleted: {
    borderColor: '#10b981',
    borderWidth: 2,
    backgroundColor: '#f0fdf4',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseClickableArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  exerciseHeaderLeft: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  exerciseNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  exerciseSets: {
    fontSize: 14,
    color: '#6b7280',
  },
  completedLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  exerciseHeaderRight: {
    paddingRight: 16,
  },
  removeButton: {
    padding: 4,
  },
  setsContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  setNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
    width: 20,
  },
  setInput: {
    width: 60,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  setInputCompleted: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  setX: {
    fontSize: 16,
    color: '#6b7280',
  },
  checkButton: {
    padding: 4,
    marginLeft: 2,
  },
  checkButtonActive: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
  },
  deleteSetButton: {
    padding: 4,
    marginLeft: 2,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d8b4fe',
    borderRadius: 8,
    marginTop: 4,
  },
  addSetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9333ea',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d8b4fe',
    borderRadius: 12,
    backgroundColor: '#faf5ff',
  },
  addExerciseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9333ea',
  },
  addGroupButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d8b4fe',
  },
  addGroupGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  addGroupButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  endButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  endButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  endButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  searchModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 8,
  },
  searchInput: {
    margin: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    fontSize: 16,
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchResultItem: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchResultText: {
    fontSize: 16,
    color: '#111827',
  },
  noResultsText: {
    textAlign: 'center',
    padding: 32,
    fontSize: 14,
    color: '#6b7280',
  },
  muscleGroupModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  muscleGroupGrid: {
    flex: 1,
  },
  muscleGroupGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  muscleGroupCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  muscleGroupCardDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    opacity: 0.6,
  },
  muscleGroupCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    backgroundColor: '#10b981',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muscleGroupEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  muscleGroupName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  muscleGroupAlready: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmModal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmModalMessage: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmModalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmModalButtonCancel: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalButtonConfirm: {
    overflow: 'hidden',
  },
  confirmModalButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmModalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  validationErrorIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  validationErrorButton: {
    width: '100%',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
});

export default ActiveWorkout;