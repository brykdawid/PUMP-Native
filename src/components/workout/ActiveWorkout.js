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
  ActivityIndicator,
} from 'react-native';
import { alertDialog, confirmDialog } from '../../utils/storage';
import storage from '../../utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GifModal from './GifModal';
import CalendarTab from './CalendarTab';
import { getExercises, getAbsoluteImageUrl } from '../../utils/apiHelpers';
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
  isWorkoutSavedAsTemplate,
  isPaused,
  setIsPaused,
  totalPausedTime,
  setTotalPausedTime,
  elapsedTime,
  setElapsedTime,
  pauseStartTime,
  setPauseStartTime
}) {
  const [exerciseSets, setExerciseSets] = useState({});
  const [expandedExercises, setExpandedExercises] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [searchQueries, setSearchQueries] = useState({});
  const [showSearchForCategory, setShowSearchForCategory] = useState(null);
  const [showMuscleGroupModal, setShowMuscleGroupModal] = useState(false);
  const [showEndWorkoutModal, setShowEndWorkoutModal] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const [muscleGroupImages, setMuscleGroupImages] = useState({});

  const workoutType = activeWorkout?.type || 'custom';

  // Załaduj obrazy grup mięśniowych
  useEffect(() => {
    const images = {};
    TRAINING_TYPES.forEach((type) => {
      if (type.id !== 'fullbody') {
        images[type.id] = getAbsoluteImageUrl(`image/Grupy/${type.name}.png`);
      }
    });
    setMuscleGroupImages(images);
  }, []);

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
    if (activeWorkout && activeWorkout.exercises) {
      if (__DEV__) console.log('=== INICJALIZACJA ĆWICZEŃ ===');
      if (__DEV__) console.log('Liczba ćwiczeń z activeWorkout:', activeWorkout.exercises.length);

      // Upewnij się, że każde ćwiczenie ma unikalne ID
      const exercisesWithIds = activeWorkout.exercises.map((exercise, idx) => ({
        ...exercise,
        id: exercise.id || `${exercise.name}-${idx}-${Date.now()}`
      }));

      if (__DEV__) console.log('Ćwiczenia z ID:', exercisesWithIds.map(ex => ({
        name: ex.name,
        id: ex.id,
        category: ex.category
      })));

      setWorkoutExercises(exercisesWithIds);
      const initialSets = {};
      const initialExpanded = {};
      const initialExpandedCategories = {};

      // Grupuj ćwiczenia po kategorii
      const categories = {};
      exercisesWithIds.forEach(exercise => {
        const category = exercise.category || 'inne';
        if (!categories[category]) {
          categories[category] = true;
          initialExpandedCategories[category] = true; // Domyślnie rozwinięte
        }
        initialSets[exercise.name] = [{ weight: '', reps: '', completed: false }];
        initialExpanded[exercise.name] = true; // Domyślnie rozwinięte
      });

      // Spróbuj załadować zapisane serie z AsyncStorage
      const loadSavedSets = async () => {
        try {
          const savedSetsJSON = await storage.getItem('activeWorkoutSets');
          if (savedSetsJSON) {
            const savedSets = JSON.parse(savedSetsJSON);
            // Sprawdź czy zapisane serie pasują do obecnego treningu
            const savedExerciseNames = Object.keys(savedSets);
            const currentExerciseNames = exercisesWithIds.map(ex => ex.name);

            // Jeśli wszystkie zapisane ćwiczenia są w obecnym treningu, użyj zapisanych serii
            const allMatch = savedExerciseNames.every(name => currentExerciseNames.includes(name));
            if (allMatch) {
              if (__DEV__) console.log('📥 Załadowano zapisane serie z AsyncStorage');
              setExerciseSets(savedSets);
              setExpandedExercises(initialExpanded);
              setExpandedCategories(initialExpandedCategories);
              return;
            }
          }
        } catch (error) {
          if (__DEV__) console.error('Błąd ładowania zapisanych serii:', error);
        }

        // Jeśli nie udało się załadować lub nie pasują, użyj domyślnych
        setExerciseSets(initialSets);
        setExpandedExercises(initialExpanded);
        setExpandedCategories(initialExpandedCategories);
      };

      loadSavedSets();
    }
  }, [activeWorkout]);

  // AUTO-SAVE: Zapisuj serie do AsyncStorage za każdym razem gdy się zmienią
  useEffect(() => {
    // Nie zapisuj jeśli nie ma aktywnego treningu
    if (!activeWorkout || !workoutStartTime) return;

    // Nie zapisuj jeśli exerciseSets jest pusty (inicjalizacja)
    if (Object.keys(exerciseSets).length === 0) return;

    const saveSets = async () => {
      try {
        await storage.setItem('activeWorkoutSets', JSON.stringify(exerciseSets));
        if (__DEV__) console.log('💾 AUTO-SAVE: Zapisano serie do AsyncStorage');
      } catch (error) {
        if (__DEV__) console.error('Błąd zapisywania serii:', error);
      }
    };

    saveSets();
  }, [exerciseSets, activeWorkout, workoutStartTime]);

  // Log zmian w workoutExercises
  useEffect(() => {
    if (__DEV__) console.log('=== ZMIANA workoutExercises ===');
    if (__DEV__) console.log('Aktualna liczba ćwiczeń:', workoutExercises.length);
    if (__DEV__) console.log('Lista ćwiczeń:', workoutExercises.map(ex => ({
      name: ex.name,
      id: ex.id || 'BRAK ID',
      category: ex.category
    })));
  }, [workoutExercises]);

  useEffect(() => {
    let mounted = true;
    async function loadExercises() {
      try {
        const data = await getExercises();
        if (mounted) {
          setAllExercises(data);
        }
      } catch (error) {
        if (__DEV__) console.error('Error loading exercises:', error);
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

  const toggleExpandCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const isCategoryCompleted = (category, exercises) => {
    if (!exercises || exercises.length === 0) return false;

    return exercises.every(exercise => {
      const sets = exerciseSets[exercise.name] || [];
      return sets.length > 0 && sets.every(set => set.completed);
    });
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
    setExerciseSets(prev => {
      const updatedSets = prev[exerciseName].map((set, idx) => {
        if (idx === setIndex) {
          const updatedSet = { ...set, [field]: value };

          // Automatyczne sprawdzanie: jeśli waga i reps są wypełnione i > 0, oznacz jako ukończone
          const weightStr = String(field === 'weight' ? value : updatedSet.weight || '').trim();
          const repsStr = String(field === 'reps' ? value : updatedSet.reps || '').trim();

          if (weightStr && repsStr) {
            const weight = parseFloat(weightStr);
            const reps = parseFloat(repsStr);

            // Jeśli obie wartości są prawidłowe (liczby > 0), automatycznie zaznacz jako ukończone
            if (!isNaN(weight) && weight > 0 && !isNaN(reps) && reps > 0) {
              updatedSet.completed = true;
            } else {
              // Jeśli wartości są nieprawidłowe, odznacz jako ukończone
              updatedSet.completed = false;
            }
          } else {
            // Jeśli którekolwiek pole jest puste, odznacz jako ukończone
            updatedSet.completed = false;
          }

          return updatedSet;
        }
        return set;
      });

      return {
        ...prev,
        [exerciseName]: updatedSets
      };
    });
  };

  const toggleSetComplete = (exerciseName, setIndex) => {
    setExerciseSets(prev => {
      const currentSet = prev[exerciseName][setIndex];

      // Jeśli próbujemy oznaczyć serię jako ukończoną (nie jest jeszcze ukończona)
      if (!currentSet.completed) {
        const weightStr = String(currentSet.weight || '').trim();
        const repsStr = String(currentSet.reps || '').trim();

        // Sprawdź czy pola są puste
        if (!weightStr || !repsStr) {
          setValidationError('Musisz wypełnić wagę i liczbę powtórzeń.');
          return prev;
        }

        const weight = parseFloat(weightStr);
        const reps = parseFloat(repsStr);

        // Walidacja: kg i reps muszą być liczbami większymi od 0
        if (isNaN(weight) || weight <= 0 || isNaN(reps) || reps <= 0) {
          setValidationError('Waga i liczba powtórzeń muszą być większe od 0.');
          return prev;
        }
      }

      // Przełącz status ukończenia
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

  const removeExercise = (exercise) => {
    if (__DEV__) console.log('=== PRÓBA USUNIĘCIA ĆWICZENIA ===');
    if (__DEV__) console.log('Ćwiczenie do usunięcia:', {
      name: exercise.name,
      id: exercise.id,
      category: exercise.category
    });

    confirmDialog(
      'Usuń ćwiczenie',
      `Czy na pewno chcesz usunąć "${exercise.name}" z treningu?`,
      () => {
        // onConfirm - użytkownik potwierdził
        if (__DEV__) console.log('Użytkownik potwierdził usunięcie');

        // Używamy ID do usunięcia konkretnego ćwiczenia
        const exerciseId = exercise.id || exercise.name;
        if (__DEV__) console.log('ID do usunięcia:', exerciseId);

        // Najpierw aktualizujemy listę ćwiczeń
        setWorkoutExercises(prev => {
          if (__DEV__) console.log('Przed usunięciem - liczba ćwiczeń:', prev.length);
          if (__DEV__) console.log('Wszystkie ćwiczenia:', prev.map(ex => ({
            name: ex.name,
            id: ex.id || 'BRAK ID'
          })));

          const updated = prev.filter(ex => {
            const currentId = ex.id || ex.name;
            const shouldKeep = currentId !== exerciseId;
            if (__DEV__) console.log(`Ćwiczenie ${ex.name} (ID: ${currentId}) - ${shouldKeep ? 'ZACHOWAJ' : 'USUŃ'}`);
            return shouldKeep;
          });

          if (__DEV__) console.log('Po usunięciu - liczba ćwiczeń:', updated.length);

          // Sprawdź czy po usunięciu są jeszcze ćwiczenia o tej samej nazwie
          const stillHasExercise = updated.some(ex => ex.name === exercise.name);
          if (__DEV__) console.log(`Czy są jeszcze ćwiczenia "${exercise.name}"?`, stillHasExercise);

          // Jeśli nie ma już ćwiczeń o tej nazwie, usuń sets
          if (!stillHasExercise) {
            if (__DEV__) console.log(`Usuwam sets dla "${exercise.name}"`);
            setExerciseSets(prevSets => {
              const newSets = { ...prevSets };
              delete newSets[exercise.name];
              return newSets;
            });
          }

          return updated;
        });

        if (__DEV__) console.log('=== KONIEC USUWANIA ===');
      },
      () => {
        // onCancel - użytkownik anulował
        if (__DEV__) console.log('Użytkownik anulował usuwanie');
      }
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
    setExpandedCategories(prev => ({
      ...prev,
      [category]: true
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
      alertDialog('Info', 'Brak ćwiczeń dla tej grupy mięśniowej');
      return;
    }
    
    const randomExercise = categoryExercises[Math.floor(Math.random() * categoryExercises.length)];
    addExerciseToWorkout(randomExercise, groupId);
  };

  const handleAddAIExercise = (category) => {
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

    // Filtruj ćwiczenia - tylko te z odpowiednią kategorią i nie dodane jeszcze
    const availableExercises = allExercises.filter(ex =>
      ex.labels && ex.labels.includes(targetLabel) && !currentExerciseNames.includes(ex.name)
    );

    if (availableExercises.length === 0) {
      alertDialog('Info', 'Brak więcej ćwiczeń dla tej grupy mięśniowej');
      return;
    }

    const randomExercise = availableExercises[Math.floor(Math.random() * availableExercises.length)];
    addExerciseToWorkout(randomExercise, category);
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

  const handleTogglePause = () => {
    if (isPaused) {
      // Wznawiamy timer - oblicz ile czasu minęło podczas pauzy
      if (pauseStartTime) {
        const pauseDuration = Date.now() - pauseStartTime;
        setTotalPausedTime(prev => prev + pauseDuration);
        setPauseStartTime(null);
      }
      setIsPaused(false);
    } else {
      // Pauzujemy timer - zapisz moment rozpoczęcia pauzy
      setPauseStartTime(Date.now());
      setIsPaused(true);
    }
  };

  const handleEndWorkout = () => {
    if (__DEV__) console.log('handleEndWorkout called - showing modal');
    setShowEndWorkoutModal(true);
  };

  const confirmEndWorkout = () => {
    if (__DEV__) console.log('User confirmed end workout');
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

    // Sprawdź czy to był zaplanowany trening
    const scheduledWorkoutId = activeWorkout?.scheduledWorkoutId;

    const workoutData = {
      id: scheduledWorkoutId || Date.now(), // Użyj ID zaplanowanego treningu lub stwórz nowe
      date: targetDate || getLocalISOString(), // Użyj daty zaplanowanego treningu lub dzisiejszej
      duration: elapsedTime,
      title: title || activeWorkout?.title || 'Trening',
      type: workoutType,
      totalVolume: Math.round(totalVolume),
      scheduled: false, // Oznacz jako ukończony (nie zaplanowany)
      categories: activeWorkout?.categories || categories, // Zachowaj kategorie z zaplanowanego treningu
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
        if (scheduledWorkoutId) {
          // Jeśli to był zaplanowany trening, zaktualizuj go zamiast dodawać nowy
          const updated = prev.map(w =>
            w.id === scheduledWorkoutId ? workoutData : w
          );
          return updated;
        } else {
          // Jeśli to nowy trening, dodaj go do historii
          const updated = [...prev, workoutData];
          return updated;
        }
      });
    }

    // Wyczyść zapisane serie z AsyncStorage po zakończeniu treningu
    storage.removeItem('activeWorkoutSets').then(() => {
      if (__DEV__) console.log('🗑️ Wyczyszczono zapisane serie z AsyncStorage');
    }).catch(error => {
      if (__DEV__) console.error('Błąd czyszczenia zapisanych serii:', error);
    });

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
        onBeginWorkout={onBeginWorkout}
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
          {/* Licznik czasu na środku */}
          <View style={styles.timerSection}>
            <Text style={styles.timerLabel}>Czas treningu</Text>
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={32} color="#ffffff" />
              <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
            </View>
          </View>

          {/* Licznik ćwiczeń poniżej */}
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>Wykonane ćwiczenia</Text>
            <View style={styles.progressContainer}>
              <Ionicons name="fitness" size={28} color="#10b981" />
              <Text style={styles.progressText}>
                {completedExercises}/{totalExercises}
              </Text>
            </View>
          </View>

          {/* Przycisk STOP/WZNÓW */}
          <TouchableOpacity
            onPress={handleTogglePause}
            style={[styles.stopButton, isPaused && styles.resumeButton]}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isPaused ? "play-circle" : "pause-circle"}
              size={28}
              color="#ffffff"
            />
            <Text style={styles.stopButtonText}>
              {isPaused ? "WZNÓW" : "PAUZA"}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(exercisesByCategory).map(([category, exercises]) => {
          const isExpanded = expandedCategories[category] !== false;
          const isCompleted = isCategoryCompleted(category, exercises);

          return (
            <View key={category} style={styles.categorySection}>
              <TouchableOpacity
                onPress={() => toggleExpandCategory(category)}
                style={[
                  styles.categoryHeader,
                  isCompleted && styles.categoryHeaderCompleted
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.categoryHeaderLeft}>
                  <Text style={styles.categoryIcon}>{getCategoryIcon(category)}</Text>
                  <Text style={[
                    styles.categoryTitle,
                    isCompleted && styles.categoryTitleCompleted
                  ]}>
                    {getCategoryName(category)}
                  </Text>
                  <Text style={styles.categoryCount}>({exercises.length})</Text>
                  {isCompleted && (
                    <View style={styles.categoryCompletedBadge}>
                      <Text style={styles.categoryCompletedBadgeText}>Ukończono</Text>
                    </View>
                  )}
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={isCompleted ? '#10b981' : '#6b7280'}
                />
              </TouchableOpacity>

              {isExpanded && exercises.map((exercise) => {
              const isExerciseExpanded = expandedExercises[exercise.name];
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
                        {exercise.image ? (
                          <>
                            {imageLoadingStates[exercise.id || exercise.name] && !imageErrors[exercise.id || exercise.name] && (
                              <View style={styles.imageLoadingOverlay}>
                                <ActivityIndicator size="small" color="#9333ea" />
                              </View>
                            )}
                            {!imageErrors[exercise.id || exercise.name] && (
                              <Image
                                source={{ uri: exercise.image }}
                                style={styles.exerciseImage}
                                resizeMode="cover"
                                fadeDuration={0}
                                onLoad={() => {
                                  setImageLoadingStates(prev => ({ ...prev, [exercise.id || exercise.name]: false }));
                                }}
                                onError={(error) => {
                                  if (__DEV__) console.log('Image load error for', exercise.name, ':', exercise.image);
                                  setImageLoadingStates(prev => ({ ...prev, [exercise.id || exercise.name]: false }));
                                  setImageErrors(prev => ({ ...prev, [exercise.id || exercise.name]: true }));
                                }}
                              />
                            )}
                            {imageErrors[exercise.id || exercise.name] && (
                              <View style={styles.exerciseImagePlaceholder}>
                                <Ionicons name="barbell-outline" size={32} color="#d1d5db" />
                              </View>
                            )}
                          </>
                        ) : (
                          <View style={styles.exerciseImagePlaceholder}>
                            <Ionicons name="barbell-outline" size={32} color="#d1d5db" />
                          </View>
                        )}
                      </TouchableOpacity>

                      {/* Exercise Info */}
                      <View style={styles.exerciseHeaderLeft}>
                        <Text
                          style={[
                            styles.exerciseName,
                            allSetsCompleted && styles.exerciseNameCompleted
                          ]}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >{exercise.name}</Text>
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
                        onPress={() => removeExercise(exercise)}
                        style={styles.removeButton}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-circle" size={32} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {isExerciseExpanded && (
                    <View style={styles.setsContainer}>
                      {sets.map((set, idx) => (
                        <View key={idx} style={styles.setRow}>
                          <Text style={styles.setNumber}>{idx + 1})</Text>
                          
                          <TextInput
                            style={[styles.setInput, set.completed && styles.setInputCompleted]}
                            value={set.weight}
                            onChangeText={(value) => updateSet(exercise.name, idx, 'weight', value)}
                            placeholder="kg"
                            keyboardType="decimal-pad"
                          />

                          <Text style={styles.setX}>×</Text>

                          <TextInput
                            style={[styles.setInput, set.completed && styles.setInputCompleted]}
                            value={set.reps}
                            onChangeText={(value) => updateSet(exercise.name, idx, 'reps', value)}
                            placeholder="reps"
                            keyboardType="number-pad"
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

              {isExpanded && (
                workoutType === 'ai' ? (
                  <TouchableOpacity
                    onPress={() => handleAddAIExercise(category)}
                    style={styles.addExerciseButtonAI}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="sparkles" size={20} color="#7c3aed" />
                    <Text style={styles.addExerciseButtonTextAI}>Generuj ćwiczenie AI</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowSearchForCategory(category)}
                    style={styles.addExerciseButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#9333ea" />
                    <Text style={styles.addExerciseButtonText}>Dodaj ćwiczenie</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          );
        })}

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
            if (__DEV__) console.log('END BUTTON PRESSED!');
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
        <TouchableOpacity
          style={styles.searchModalOverlay}
          activeOpacity={1}
          onPress={() => setShowSearchForCategory(null)}
        >
          <TouchableOpacity
            style={styles.searchModal}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
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
                    <View style={styles.searchResultImageContainer}>
                      {exercise.image ? (
                        <>
                          {imageLoadingStates[`search-${exercise.name}`] && !imageErrors[`search-${exercise.name}`] && (
                            <View style={styles.searchImageLoadingOverlay}>
                              <ActivityIndicator size="small" color="#9333ea" />
                            </View>
                          )}
                          {!imageErrors[`search-${exercise.name}`] && (
                            <Image
                              source={{ uri: exercise.image }}
                              style={styles.searchResultImage}
                              resizeMode="cover"
                              fadeDuration={0}
                              onLoad={() => {
                                setImageLoadingStates(prev => ({ ...prev, [`search-${exercise.name}`]: false }));
                              }}
                              onError={() => {
                                if (__DEV__) console.log('Search image load error for', exercise.name, ':', exercise.image);
                                setImageLoadingStates(prev => ({ ...prev, [`search-${exercise.name}`]: false }));
                                setImageErrors(prev => ({ ...prev, [`search-${exercise.name}`]: true }));
                              }}
                            />
                          )}
                          {imageErrors[`search-${exercise.name}`] && (
                            <View style={styles.searchResultImagePlaceholder}>
                              <Ionicons name="barbell-outline" size={24} color="#d1d5db" />
                            </View>
                          )}
                        </>
                      ) : (
                        <View style={styles.searchResultImagePlaceholder}>
                          <Ionicons name="barbell-outline" size={24} color="#d1d5db" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.searchResultText}>{exercise.name}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noResultsText}>Brak dostępnych ćwiczeń</Text>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showMuscleGroupModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMuscleGroupModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMuscleGroupModal(false)}
        >
          <TouchableOpacity
            style={styles.muscleGroupModal}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
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
                      <View style={styles.muscleGroupImageContainer}>
                        {muscleGroupImages[type.id] ? (
                          <Image
                            source={{ uri: muscleGroupImages[type.id] }}
                            style={styles.muscleGroupImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Ionicons name="fitness" size={40} color="#9333ea" />
                        )}
                      </View>
                      <Text style={styles.muscleGroupName}>{type.name}</Text>
                      {alreadyExists && (
                        <Text style={styles.muscleGroupAlready}>Już w treningu</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
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
                  if (__DEV__) console.log('User cancelled');
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  timerSection: {
    alignItems: 'center',
    width: '100%',
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
  progressSection: {
    alignItems: 'center',
    width: '100%',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  resumeButton: {
    backgroundColor: '#10b981',
  },
  stopButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
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
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeaderCompleted: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  categoryTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#10b981',
  },
  categoryCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  categoryCompletedBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  categoryCompletedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
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
  imageLoadingOverlay: {
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
  addExerciseButtonAI: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#7c3aed',
    borderRadius: 12,
    backgroundColor: '#f3e8ff',
  },
  addExerciseButtonTextAI: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
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
  searchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  searchModal: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    minHeight: '50%',
    maxHeight: '70%',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
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
    paddingBottom: 24,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  searchResultImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#f3f4f6',
  },
  searchResultImage: {
    width: '100%',
    height: '100%',
  },
  searchImageLoadingOverlay: {
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
  searchResultImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  searchResultText: {
    flex: 1,
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
    minHeight: '60%',
    maxHeight: '85%',
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
  muscleGroupImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muscleGroupImage: {
    width: '100%',
    height: '100%',
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