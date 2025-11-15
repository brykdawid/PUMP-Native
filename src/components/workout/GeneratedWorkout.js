import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import storage, { alertDialog } from '../../utils/storage';
import { getExercises } from '../../utils/apiHelpers';
import { getLocalISOString } from '../../utils/workoutHelpers';
import GifModal from './GifModal';
import ExerciseCard from './ExerciseCard';

function GeneratedWorkout({ 
  selectedTypes, 
  onBack, 
  onBeginWorkout, 
  onSaveWorkout, 
  targetDate, 
  onScheduleWorkout 
}) {
  console.log('GeneratedWorkout render - selectedTypes:', selectedTypes);
  
  const [workoutPlan, setWorkoutPlan] = useState({});
  const [allExercises, setAllExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState(
    selectedTypes.reduce((acc, type) => ({ ...acc, [type]: true }), {})
  );
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [customDate, setCustomDate] = useState(() => {
    if (targetDate) return targetDate;
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  
  const scheduleCalledRef = useRef(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const saved = await storage.getItem('favoriteExercises');
      if (saved) setFavorites(JSON.parse(saved));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      await storage.setItem('favoriteExercises', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    async function loadExercises() {
      try {
        console.log('Loading exercises...');
        const data = await getExercises();
        console.log('Exercises loaded:', data.length);
        if (mounted) {
          setAllExercises(data);
        }
      } catch (error) {
        console.error('Error loading exercises:', error);
        if (mounted) {
          setAllExercises([]);
          alertDialog('Błąd', 'Nie udało się załadować ćwiczeń');
        }
      }
    }
    
    loadExercises();
    
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (allExercises.length > 0) {
      console.log('Generating workout...');
      generateWorkout();
    }
  }, [selectedTypes, allExercises]);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  useEffect(() => {
    scheduleCalledRef.current = false;
  }, [targetDate, selectedTypes, customDate]);

  useEffect(() => {
    if (targetDate) {
      setCustomDate(targetDate);
    }
  }, [targetDate]);

  const toggleFavorite = (exercise) => {
    setFavorites(prev => {
      const exists = prev.find(ex => ex.name === exercise.name);
      if (exists) {
        return prev.filter(ex => ex.name !== exercise.name);
      } else {
        return [...prev, {
          name: exercise.name,
          image: exercise.image,
          description: exercise.description,
          tips: exercise.tips,
          labels: exercise.labels,
          category: exercise.category,
          savedAt: getLocalISOString()
        }];
      }
    });
  };

  const isFavorite = (exerciseName) => favorites.some(ex => ex.name === exerciseName);

  const removeExercise = (category, exerciseToRemove) => {
    setWorkoutPlan(prev => ({
      ...prev,
      [category]: prev[category].filter(ex => ex.name !== exerciseToRemove.name)
    }));
  };

  const addNewExercise = (category) => {
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
    const usedNames = workoutPlan[category].map(ex => ex.name);

    const availableExercises = allExercises.filter(ex =>
      ex.labels &&
      ex.labels.includes(targetLabel) &&
      !usedNames.includes(ex.name)
    );

    if (availableExercises.length === 0) {
      alertDialog('Info', 'Brak innych ćwiczeń w tej kategorii!');
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableExercises.length);
    const selectedExercise = availableExercises[randomIndex];

    const newExercise = {
      ...selectedExercise,
      count: workoutPlan[category].length + 1,
      category: category,
    };

    setWorkoutPlan(prev => ({
      ...prev,
      [category]: [...prev[category], newExercise]
    }));
  };

  const replaceExercise = async (category, exerciseToReplace) => {
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
    const usedNames = workoutPlan[category].map(ex => ex.name);

    const availableExercises = allExercises.filter(ex =>
      ex.labels &&
      ex.labels.includes(targetLabel) &&
      !usedNames.includes(ex.name)
    );

    if (availableExercises.length === 0) {
      alertDialog('Info', 'Brak innych ćwiczeń w tej kategorii do wymiany!');
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableExercises.length);
    const selectedExercise = availableExercises[randomIndex];

    // POPRAWKA: Zachowaj kategorię podczas wymiany
    const newExercise = {
      ...selectedExercise,
      count: exerciseToReplace.count,
      category: category, // WAŻNE: Ustaw kategorię
    };

    setWorkoutPlan(prev => ({
      ...prev,
      [category]: prev[category].map(ex =>
        ex.name === exerciseToReplace.name ? newExercise : ex
      )
    }));
  };

  const generateWorkout = async () => {
    console.log('generateWorkout called');
    setLoading(true);

    if (allExercises.length === 0) {
      console.log('No exercises available');
      setLoading(false);
      return;
    }

    fallbackGeneration();

    setLoading(false);
  };

  const fallbackGeneration = () => {
    console.log('Fallback generation - selectedTypes:', selectedTypes);
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

    // Sprawdź czy to trening FBW (wszystkie grupy mięśniowe zaznaczone)
    const allMuscleGroups = Object.keys(categoryLabels);
    const isFBW = selectedTypes.length === allMuscleGroups.length &&
                  allMuscleGroups.every(group => selectedTypes.includes(group));

    // Dla FBW używamy 2 ćwiczeń na grupę, dla innych 3
    const exercisesPerGroup = isFBW ? 2 : 3;

    console.log(`Is FBW: ${isFBW}, exercises per group: ${exercisesPerGroup}`);

    const plan = {};

    selectedTypes.forEach(category => {
      console.log(`Generating for category: ${category}`);
      const targetLabel = categoryLabels[category];
      const categoryExercises = allExercises.filter(ex =>
        ex.labels && ex.labels.includes(targetLabel)
      );

      console.log(`Found ${categoryExercises.length} exercises for ${category} (label: ${targetLabel})`);

      const shuffled = [...categoryExercises].sort(() => Math.random() - 0.5);

      // POPRAWKA: Dodaj kategorię do każdego ćwiczenia
      plan[category] = shuffled.slice(0, exercisesPerGroup).map((ex, idx) => ({
        ...ex,
        count: idx + 1,
        category: category // WAŻNE: Ustaw kategorię wybrana przez użytkownika
      }));

      console.log(`Generated ${plan[category].length} exercises for ${category}`);
    });

    console.log('Final generated plan:', Object.keys(plan).map(k => `${k}: ${plan[k].length}`));
    setWorkoutPlan(plan);
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleExercise = (exerciseName) => {
    setExpandedExercise(prev => prev === exerciseName ? null : exerciseName);
  };

  const handleImageClick = (exercise) => {
    setSelectedExercise(exercise);
  };

  const closeModal = () => {
    setSelectedExercise(null);
  };

  const getCategoryName = (id) => {
    const names = {
      'barki': 'Barki',
      'biceps': 'Biceps',
      'brzuch': 'Brzuch',
      'klatka': 'Klatka Piersiowa',
      'nogi': 'Nogi',
      'plecy': 'Plecy',
      'posladki': 'Pośladki',
      'przedramiona': 'Przedramiona',
      'triceps': 'Triceps'
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
      'triceps': '💪'
    };
    return icons[id] || '💪';
  };

  const getTotalExercisesCount = () => {
    return Object.values(workoutPlan).reduce((total, exercises) => total + exercises.length, 0);
  };

  const handleBeginWorkout = () => {
    if (onBeginWorkout) {
      // POPRAWKA: Flatten exercises z zachowaniem kategorii
      const allExercises = [];
      Object.entries(workoutPlan).forEach(([category, exercises]) => {
        exercises.forEach(ex => {
          allExercises.push({
            ...ex,
            category: category, // Upewnij się że kategoria jest przekazana
            sets: '3-4 serie × 8-12 powtórzeń', // Dodaj standardowy format serii i powtórzeń
            id: `${ex.name}-${Date.now()}-${Math.random()}`
          });
        });
      });

      if (allExercises.length === 0) {
        Alert.alert('Błąd', 'Nie możesz rozpocząć treningu bez ćwiczeń! Dodaj przynajmniej jedno ćwiczenie.');
        return;
      }

      console.log('Beginning workout with exercises:', allExercises.map(e => `${e.name} (${e.category})`));

      const workoutData = {
        type: 'generated',
        exercises: allExercises,
        categories: selectedTypes,
        title: selectedTypes.map(t => getShortCategoryName(t)).join('+')
      };
      onBeginWorkout(workoutData, customDate, true);
    }
  };

  const getShortCategoryName = (id) => {
    const names = {
      'barki': 'Barki',
      'biceps': 'Biceps',
      'brzuch': 'Brzuch',
      'klatka': 'Klatka',
      'nogi': 'Nogi',
      'plecy': 'Plecy',
      'posladki': 'Pośladki',
      'przedramiona': 'Przedramiona',
      'triceps': 'Triceps'
    };
    return names[id] || id;
  };

  const handleSaveWorkout = () => {
    if (onSaveWorkout) {
      // POPRAWKA: Flatten z zachowaniem kategorii
      const allExercises = [];
      Object.entries(workoutPlan).forEach(([category, exercises]) => {
        exercises.forEach(ex => {
          allExercises.push({
            ...ex,
            category: category, // Upewnij się że kategoria jest przekazana
            sets: '3-4 serie × 8-12 powtórzeń', // Dodaj standardowy format serii i powtórzeń
            id: `${ex.name}-${Date.now()}-${Math.random()}`
          });
        });
      });

      if (allExercises.length === 0) {
        Alert.alert('Błąd', 'Nie możesz zapisać treningu bez ćwiczeń! Dodaj przynajmniej jedno ćwiczenie.');
        return;
      }

      const workoutData = {
        type: 'generated',
        exercises: allExercises,
        categories: selectedTypes,
        name: selectedTypes.map(t => getShortCategoryName(t)).join('+'),
        date: customDate
      };
      onSaveWorkout(workoutData);
      Alert.alert('Sukces', 'Trening został zapisany!');
    }
  };

  const handleScheduleWorkout = () => {
    if (!scheduleCalledRef.current && onScheduleWorkout) {
      scheduleCalledRef.current = true;

      // POPRAWKA: Flatten z zachowaniem kategorii
      const allExercises = [];
      Object.entries(workoutPlan).forEach(([category, exercises]) => {
        exercises.forEach(ex => {
          allExercises.push({
            ...ex,
            category: category, // Upewnij się że kategoria jest przekazana
            sets: '3-4 serie × 8-12 powtórzeń', // Dodaj standardowy format serii i powtórzeń
            id: `${ex.name}-${Date.now()}-${Math.random()}`
          });
        });
      });

      if (allExercises.length === 0) {
        scheduleCalledRef.current = false; // Reset aby można było spróbować ponownie
        Alert.alert('Błąd', 'Nie możesz zaplanować treningu bez ćwiczeń! Dodaj przynajmniej jedno ćwiczenie.');
        return;
      }

      console.log('Scheduling workout with exercises:', allExercises.map(e => `${e.name} (${e.category})`));

      const workoutData = {
        id: Date.now(),
        type: 'generated',
        exercises: allExercises,
        categories: selectedTypes,
        name: selectedTypes.map(t => getShortCategoryName(t)).join('+'),
        title: selectedTypes.map(t => getShortCategoryName(t)).join('+'),
        date: customDate,
        scheduled: true
      };
      onScheduleWorkout(workoutData);
      Alert.alert('Sukces', 'Trening został zaplanowany!');
    }
  };

  const getDateType = () => {
    const today = new Date();
    const selected = new Date(customDate + 'T00:00:00');
    today.setHours(0, 0, 0, 0);
    
    if (selected.getTime() === today.getTime()) return 'today';
    if (selected > today) return 'future';
    return 'past';
  };

  const dateType = getDateType();
  const totalExercises = getTotalExercisesCount();
  const hasNoExercises = totalExercises === 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9333ea" />
        <Text style={styles.loadingText}>Generuję trening...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#9333ea" />
          <Text style={styles.backButtonText}>Wróć</Text>
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Text style={styles.title}>Twój Plan Treningowy</Text>
          <Text style={styles.subtitle}>
            Wygenerowany plan ćwiczeń
          </Text>
        </View>

        <View style={styles.actionButtons}>
          {dateType === 'today' && (
            <>
              <TouchableOpacity
                onPress={handleBeginWorkout}
                style={[styles.beginButton, hasNoExercises && styles.disabledButton]}
                activeOpacity={0.8}
                disabled={hasNoExercises}
              >
                <LinearGradient
                  colors={['#16a34a', '#15803d']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="play-circle" size={20} color="#ffffff" />
                  <Text style={styles.buttonText}>Rozpocznij Teraz</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleScheduleWorkout}
                style={[styles.beginButton, hasNoExercises && styles.disabledButton]}
                activeOpacity={0.8}
                disabled={hasNoExercises}
              >
                <LinearGradient
                  colors={['#ea580c', '#c2410c']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="calendar" size={20} color="#ffffff" />
                  <Text style={styles.buttonText}>Zaplanuj na Dzisiaj</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {dateType === 'future' && (
            <TouchableOpacity
              onPress={handleScheduleWorkout}
              style={[styles.beginButton, hasNoExercises && styles.disabledButton]}
              activeOpacity={0.8}
              disabled={hasNoExercises}
            >
              <LinearGradient
                colors={['#ea580c', '#c2410c']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="calendar" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>
                  Zaplanuj na {new Date(customDate + 'T00:00:00').toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {dateType === 'past' && (
            <View style={styles.pastDateInfo}>
              <Text style={styles.pastDateTitle}>
                ⏱️ To trening dla dnia w przeszłości ({new Date(customDate + 'T00:00:00').toLocaleDateString('pl-PL')})
              </Text>
              <Text style={styles.pastDateSubtitle}>
                Możesz tylko zapisać ten trening
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleSaveWorkout}
            style={[styles.saveButton, hasNoExercises && styles.disabledButton]}
            activeOpacity={0.8}
            disabled={hasNoExercises}
          >
            <Ionicons name="star" size={20} color="#7c3aed" />
            <Text style={styles.saveButtonText}>Zapisz Trening</Text>
          </TouchableOpacity>
        </View>

        {selectedTypes.map(category => (
          <View key={category} style={styles.section}>
            <TouchableOpacity
              onPress={() => toggleCategory(category)}
              style={styles.sectionHeader}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionIcon}>{getCategoryIcon(category)}</Text>
                <Text style={styles.sectionTitle}>{getCategoryName(category)}</Text>
                <Text style={styles.sectionCount}>({workoutPlan[category]?.length || 0} ćwiczeń)</Text>
              </View>
              <Ionicons
                name={expandedCategories[category] ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#4b5563"
              />
            </TouchableOpacity>

            {expandedCategories[category] && workoutPlan[category] && (
              <View style={styles.exerciseList}>
                {workoutPlan[category].map((exercise, idx) => (
                  <ExerciseCard
                    key={idx}
                    exercise={{
                      ...exercise,
                      sets: '3-4 serie × 8-12 powtórzeń'
                    }}
                    exerciseId={idx}
                    onToggle={() => handleImageClick(exercise)}
                    onFavorite={() => toggleFavorite(exercise)}
                    isFavorite={isFavorite(exercise.name)}
                    onRemove={() => removeExercise(category, exercise)}
                    onReplace={() => replaceExercise(category, exercise)}
                    replaceButtonText="Wymień"
                    showAITag={true}
                  />
                ))}
                <TouchableOpacity
                  onPress={() => addNewExercise(category)}
                  style={styles.addExerciseButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle" size={24} color="#9333ea" />
                  <Text style={styles.addExerciseButtonText}>Wygeneruj nowe ćwiczenie (AI)</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <GifModal
        exercise={selectedExercise}
        onClose={closeModal}
        onToggleFavorite={() => selectedExercise && toggleFavorite(selectedExercise)}
        isFavorite={selectedExercise ? isFavorite(selectedExercise.name) : false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 100,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  backButtonText: {
    color: '#9333ea',
    fontSize: 16,
    fontWeight: '500',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  actionButtons: {
    marginBottom: 24,
    gap: 12,
  },
  beginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pastDateInfo: {
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#93c5fd',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  pastDateTitle: {
    color: '#1e3a8a',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  pastDateSubtitle: {
    color: '#1e40af',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f3e8ff',
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#7c3aed',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIcon: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  sectionCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  exerciseList: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#f3e8ff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addExerciseButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9333ea',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default GeneratedWorkout;