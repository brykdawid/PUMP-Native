import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import storage from '../../utils/storage';
import { getExercises } from '../../utils/apiHelpers';
import { TRAINING_TYPES, CATEGORY_TO_AI_LABELS } from '../data/exercisesData';
import { getLocalISOString } from '../../utils/workoutHelpers';
import GifModal from './GifModal';
import ExerciseCard from './ExerciseCard';

const translateCategory = (category) => {
  const translations = {
    'shoulders': 'barki',
    'biceps': 'biceps',
    'abs': 'brzuch',
    'chest': 'klatka',
    'legs': 'nogi',
    'back': 'plecy',
    'glutes': 'posladki',
    'forearms': 'przedramiona',
    'triceps': 'triceps',
  };
  return translations[category?.toLowerCase()] || category;
};

const categoryToMuscleGroup = (category) => {
  // TRAINING_TYPES używa polskich ID, więc zwracamy kategorię bezpośrednio
  // jeśli jest zgodna z TRAINING_TYPES
  const validGroups = ['barki', 'biceps', 'brzuch', 'klatka', 'nogi', 'plecy', 'posladki', 'przedramiona', 'triceps'];
  return validGroups.includes(category?.toLowerCase()) ? category.toLowerCase() : null;
};

function CustomWorkoutBuilder({ 
  onBack, 
  onSaveWorkout, 
  onBeginWorkout, 
  targetDate, 
  preloadedWorkout, 
  onScheduleWorkout 
}) {
  const [allExercises, setAllExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [workoutTitle, setWorkoutTitle] = useState('Mój Trening');
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [workoutPlan, setWorkoutPlan] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [addingExerciseToGroup, setAddingExerciseToGroup] = useState(null);
  const [groupSearchQueries, setGroupSearchQueries] = useState({});
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [showExerciseList, setShowExerciseList] = useState(false);
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
    loadSavedWorkouts();
    loadExercises();
  }, []);

  useEffect(() => {
    if (preloadedWorkout) {
      setWorkoutTitle(preloadedWorkout.title || 'Mój Trening');
      setIsFavorite(preloadedWorkout.isFavorite || false);

      // Załaduj workoutPlan jeśli istnieje, w przeciwnym razie użyj starej struktury
      if (preloadedWorkout.workoutPlan && preloadedWorkout.workoutPlan.length > 0) {
        setWorkoutPlan(preloadedWorkout.workoutPlan);
        setSelectedExercises([]);
      } else {
        const exercisesToLoad = preloadedWorkout.exercises.map(ex => ({
          ...ex,
          id: ex.id || `${ex.name}-${Date.now()}-${Math.random()}`
        }));
        setSelectedExercises(exercisesToLoad);

        const categories = {};
        exercisesToLoad.forEach(ex => {
          let category = 'inne';
          if (ex.category) {
            category = translateCategory(ex.category);
          } else if (ex.labels && ex.labels.length > 0) {
            category = translateCategory(ex.labels[0]);
          }
          categories[category] = true;
        });
        setExpandedCategories(categories);
      }
    }
  }, [preloadedWorkout]);

  useEffect(() => {
    if (targetDate) {
      setCustomDate(targetDate);
    }
  }, [targetDate]);

  useEffect(() => {
    scheduleCalledRef.current = false;
  }, [customDate]);

  const loadFavorites = async () => {
    try {
      const saved = await storage.getItem('favoriteExercises');
      if (saved) setFavorites(JSON.parse(saved));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadSavedWorkouts = async () => {
    try {
      const saved = await storage.getItem('savedWorkouts');
      if (saved) setSavedWorkouts(JSON.parse(saved));
    } catch (error) {
      console.error('Error loading saved workouts:', error);
    }
  };

  const loadExercises = async () => {
    try {
      const data = await getExercises();
      setAllExercises(data);
    } catch (error) {
      console.error('Error loading exercises:', error);
      Alert.alert('Błąd', 'Nie udało się połączyć z serwerem');
    }
  };

  const saveFavoritesToStorage = async (newFavorites) => {
    try {
      await storage.setItem('favoriteExercises', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const getCategoryName = (category) => {
    const categoryNames = {
      'barki': 'Barki',
      'biceps': 'Biceps',
      'brzuch': 'Brzuch',
      'klatka': 'Klatka piersiowa',
      'nogi': 'Nogi',
      'plecy': 'Plecy',
      'posladki': 'Pośladki',
      'przedramiona': 'Przedramiona',
      'triceps': 'Triceps',
      'inne': 'Inne',
    };
    return categoryNames[category] || category;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'barki': '💪',
      'biceps': '💪',
      'brzuch': '🔥',
      'klatka': '🦾',
      'nogi': '🦵',
      'plecy': '🏋️',
      'posladki': '🍑',
      'przedramiona': '✊',
      'triceps': '💪',
      'inne': '⚙️',
    };
    return icons[category] || '💪';
  };

  const getPrimaryCategory = (exercise) => {
    if (exercise.category) {
      return translateCategory(exercise.category);
    }
    if (exercise.labels && exercise.labels.length > 0) {
      return translateCategory(exercise.labels[0]);
    }
    return 'inne';
  };

  const exercisesByCategory = selectedExercises.reduce((acc, exercise) => {
    const category = getPrimaryCategory(exercise);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(exercise);
    return acc;
  }, {});

  const addExercise = (exercise) => {
    // Określ kategorię i grupę mięśniową
    const category = getPrimaryCategory(exercise);
    const muscleGroup = categoryToMuscleGroup(category);

    if (muscleGroup) {
      // Sprawdź czy grupa już istnieje
      const existingGroup = workoutPlan.find(g => g.muscleGroup === muscleGroup);

      // Sprawdź czy ćwiczenie już istnieje w tej grupie
      if (existingGroup) {
        const exerciseExists = existingGroup.exercises.some(ex => ex.name === exercise.name);
        if (exerciseExists) {
          Alert.alert('Info', `${exercise.name} jest już w tej grupie mięśniowej`, [{ text: 'OK' }]);
          return;
        }
      }

      const newExercise = {
        ...exercise,
        id: `${exercise.name}-${Date.now()}-${Math.random()}`,
      };

      if (existingGroup) {
        // Dodaj do istniejącej grupy
        setWorkoutPlan(prev => prev.map(group =>
          group.muscleGroup === muscleGroup
            ? { ...group, exercises: [...group.exercises, newExercise] }
            : group
        ));
      } else {
        // Utwórz nową grupę
        const newGroup = {
          id: `group-${Date.now()}`,
          muscleGroup: muscleGroup,
          exercises: [newExercise]
        };
        setWorkoutPlan(prev => [...prev, newGroup]);
      }

      // Zamknij search bar i wyniki
      setSearchQuery('');
      setShowExerciseList(false);

      // Pokaż informację o dodaniu
      Alert.alert('Dodano', `${exercise.name} został dodany do planu treningowego`, [{ text: 'OK' }], { cancelable: true });
    } else {
      // Jeśli nie można określić grupy, sprawdź duplikaty w selectedExercises
      const exerciseExists = selectedExercises.some(ex => ex.name === exercise.name);
      if (exerciseExists) {
        Alert.alert('Info', `${exercise.name} jest już w planie treningowym`, [{ text: 'OK' }]);
        return;
      }

      const newExercise = {
        ...exercise,
        id: `${exercise.name}-${Date.now()}-${Math.random()}`,
      };
      setSelectedExercises(prev => [...prev, newExercise]);

      // Zamknij search bar i wyniki
      setSearchQuery('');
      setShowExerciseList(false);

      // Pokaż informację o dodaniu
      Alert.alert('Dodano', `${exercise.name} został dodany do planu treningowego`, [{ text: 'OK' }], { cancelable: true });
    }
  };

  const removeExercise = (exerciseId) => {
    setSelectedExercises(prev => prev.filter(ex => ex.id !== exerciseId));
  };

  const addMuscleGroup = () => {
    const newGroup = {
      id: `group-${Date.now()}`,
      muscleGroup: null,
      exercises: []
    };
    setWorkoutPlan(prev => [...prev, newGroup]);
  };

  const setMuscleGroupType = (groupId, muscleGroupType) => {
    setWorkoutPlan(prev => prev.map(group =>
      group.id === groupId ? { ...group, muscleGroup: muscleGroupType } : group
    ));
  };

  const removeGroup = (groupId) => {
    setWorkoutPlan(prev => prev.filter(group => group.id !== groupId));
  };

  const addExerciseToGroup = (groupId, exercise) => {
    // Znajdź grupę i sprawdź czy ćwiczenie już istnieje
    const group = workoutPlan.find(g => g.id === groupId);
    if (group) {
      const exerciseExists = group.exercises.some(ex => ex.name === exercise.name);
      if (exerciseExists) {
        Alert.alert('Info', `${exercise.name} jest już w tej grupie`, [{ text: 'OK' }]);
        return;
      }
    }

    const newExercise = {
      ...exercise,
      id: `${exercise.name}-${Date.now()}-${Math.random()}`,
    };

    setWorkoutPlan(prev => prev.map(group =>
      group.id === groupId
        ? { ...group, exercises: [...group.exercises, newExercise] }
        : group
    ));

    // Zamknij search bar i wyniki
    setSearchQuery('');
    setShowExerciseList(false);
    setAddingExerciseToGroup(null);

    // Pokaż informację o dodaniu
    Alert.alert('Dodano', `${exercise.name} został dodany do grupy`, [{ text: 'OK' }], { cancelable: true });
  };

  const removeExerciseFromGroup = (groupId, exerciseId) => {
    setWorkoutPlan(prev => prev.map(group =>
      group.id === groupId
        ? { ...group, exercises: group.exercises.filter(ex => ex.id !== exerciseId) }
        : group
    ));
  };

  const toggleFavorite = (exercise) => {
    const newFavorites = favorites.some(ex => ex.name === exercise.name)
      ? favorites.filter(ex => ex.name !== exercise.name)
      : [...favorites, {
          name: exercise.name,
          image: exercise.image,
          description: exercise.description,
          tips: exercise.tips,
          labels: exercise.labels,
          category: exercise.category,
          savedAt: getLocalISOString()
        }];
    
    setFavorites(newFavorites);
    saveFavoritesToStorage(newFavorites);
  };

  const isFavoriteExercise = (exerciseName) => {
    return favorites.some(ex => ex.name === exerciseName);
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleExerciseDetails = (exerciseId) => {
    setExpandedExercise(prev => prev === exerciseId ? null : exerciseId);
  };

  const handleImageClick = (exercise) => {
    setSelectedExercise(exercise);
  };

  const closeModal = () => {
    setSelectedExercise(null);
  };

  const handleSaveWorkout = () => {
    // Zbierz wszystkie ćwiczenia z obu struktur
    const allExercises = [
      ...selectedExercises,
      ...workoutPlan.flatMap(group => group.exercises)
    ];

    if (allExercises.length === 0) {
      Alert.alert('Info', 'Dodaj przynajmniej jedno ćwiczenie do treningu');
      return;
    }

    if (onSaveWorkout) {
      const categories = Object.keys(exercisesByCategory);
      const workoutData = {
        type: 'custom',
        exercises: allExercises,
        workoutPlan: workoutPlan, // Dodaj nową strukturę
        warmup: [],
        categories: categories,
        name: workoutTitle,
        date: customDate,
        isFavorite: isFavorite
      };
      onSaveWorkout(workoutData);
      Alert.alert('Sukces', 'Trening został zapisany!');
    }
  };

  const handleBeginWorkout = () => {
    // Zbierz wszystkie ćwiczenia z obu struktur
    const allExercises = [
      ...selectedExercises,
      ...workoutPlan.flatMap(group => group.exercises)
    ];

    if (allExercises.length === 0) {
      Alert.alert('Info', 'Dodaj przynajmniej jedno ćwiczenie do treningu');
      return;
    }

    if (onBeginWorkout) {
      const categories = Object.keys(exercisesByCategory);
      const workoutData = {
        type: 'custom',
        exercises: allExercises,
        workoutPlan: workoutPlan, // Dodaj nową strukturę
        warmup: [],
        categories: categories
      };
      onBeginWorkout(workoutData, customDate, true);
    }
  };

  const handleScheduleWorkout = () => {
    // Zbierz wszystkie ćwiczenia z obu struktur
    const allExercises = [
      ...selectedExercises,
      ...workoutPlan.flatMap(group => group.exercises)
    ];

    if (allExercises.length === 0) {
      Alert.alert('Info', 'Dodaj przynajmniej jedno ćwiczenie do treningu');
      return;
    }

    if (!scheduleCalledRef.current && onScheduleWorkout) {
      scheduleCalledRef.current = true;
      const categories = Object.keys(exercisesByCategory);
      const workoutData = {
        id: Date.now(),
        type: 'custom',
        exercises: allExercises,
        workoutPlan: workoutPlan, // Dodaj nową strukturę
        warmup: [],
        categories: categories,
        name: workoutTitle,
        date: customDate,
        scheduled: true
      };
      onScheduleWorkout(workoutData);
      Alert.alert('Sukces', 'Trening został zaplanowany!');
    }
  };

  const loadWorkout = (workout) => {
    // Załaduj workoutPlan jeśli istnieje, w przeciwnym razie użyj starej struktury
    if (workout.workoutPlan && workout.workoutPlan.length > 0) {
      setWorkoutPlan(workout.workoutPlan);
      setSelectedExercises([]);
    } else {
      const exercisesToLoad = workout.exercises.map(ex => ({
        ...ex,
        id: ex.id || `${ex.name}-${Date.now()}-${Math.random()}`
      }));
      setSelectedExercises(exercisesToLoad);

      const categories = {};
      exercisesToLoad.forEach(ex => {
        const category = getPrimaryCategory(ex);
        categories[category] = true;
      });
      setExpandedCategories(categories);
    }

    setWorkoutTitle(workout.title || 'Mój Trening');
    setActiveTab('search');
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

  const filteredExercises = allExercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exercise.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const toggleMuscleGroup = (groupId) => {
    setSelectedMuscleGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const getFilteredExercisesForGroup = (muscleGroup, searchQuery) => {
    if (!searchQuery || searchQuery.length === 0) return [];

    return allExercises.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           exercise.description?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const exerciseCategories = exercise.labels || [];
      const groupLabels = CATEGORY_TO_AI_LABELS[muscleGroup] || [];
      return groupLabels.some(label => exerciseCategories.includes(label));
    });
  };

  const isExerciseInPlan = (exerciseName, excludeGroupId = null) => {
    // Sprawdź w workoutPlan
    for (const group of workoutPlan) {
      if (excludeGroupId && group.id === excludeGroupId) continue;
      if (group.exercises.some(ex => ex.name === exerciseName)) {
        return { inPlan: true, groupName: TRAINING_TYPES.find(t => t.id === group.muscleGroup)?.name || 'Nieznana grupa' };
      }
    }

    // Sprawdź w selectedExercises
    if (selectedExercises.some(ex => ex.name === exerciseName)) {
      return { inPlan: true, groupName: 'Plan treningowy' };
    }

    return { inPlan: false, groupName: null };
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#9333ea" />
          <Text style={styles.backButtonText}>Wróć</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.titleInput}
          value={workoutTitle}
          onChangeText={setWorkoutTitle}
          placeholder="Nazwa treningu"
          placeholderTextColor="#9ca3af"
        />

        <TouchableOpacity
          onPress={() => setIsFavorite(!isFavorite)}
          style={styles.favoriteButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isFavorite ? 'star' : 'star-outline'}
            size={24}
            color={isFavorite ? '#facc15' : '#9ca3af'}
          />
        </TouchableOpacity>
      </View>

      {selectedExercises.length > 0 && (
        <View style={styles.actionButtons}>
          {dateType === 'today' && (
            <TouchableOpacity
              onPress={handleBeginWorkout}
              style={styles.actionButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#16a34a', '#15803d']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="play-circle" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Rozpocznij</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {dateType === 'future' && (
            <TouchableOpacity
              onPress={handleScheduleWorkout}
              style={styles.actionButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#ea580c', '#c2410c']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="calendar" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Zaplanuj</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleSaveWorkout}
            style={styles.saveButton}
            activeOpacity={0.8}
          >
            <Ionicons name="bookmark" size={20} color="#7c3aed" />
            <Text style={styles.saveButtonText}>Zapisz</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setActiveTab('search')}
          style={[styles.tab, activeTab === 'search' && styles.tabActive]}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={20} color={activeTab === 'search' ? '#9333ea' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>
            Szukaj
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('favorites')}
          style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
          activeOpacity={0.7}
        >
          <Ionicons name="star" size={20} color={activeTab === 'favorites' ? '#9333ea' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
            Ulubione
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('saved')}
          style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
          activeOpacity={0.7}
        >
          <Ionicons name="bookmark" size={20} color={activeTab === 'saved' ? '#9333ea' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            Zapisane
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'search' && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setShowExerciseList(text.length > 0);
              }}
              placeholder="Szukaj ćwiczeń..."
              placeholderTextColor="#9ca3af"
            />

            {showExerciseList && (
              <>
                <Pressable
                  style={styles.searchBackdrop}
                  onPress={() => {
                    setSearchQuery('');
                    setShowExerciseList(false);
                  }}
                />
                <View style={styles.searchResultsOverlay}>
                  <ScrollView
                    style={styles.searchResultsScrollView}
                    contentContainerStyle={styles.searchResultsContent}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {filteredExercises.map((exercise, idx) => {
                      const { inPlan, groupName } = isExerciseInPlan(exercise.name);
                      return (
                        <View
                          key={`search-${exercise.name}-${idx}`}
                          style={[
                            styles.searchExerciseItem,
                            inPlan && styles.searchExerciseItemInPlan
                          ]}
                        >
                          {inPlan && (
                            <View style={styles.inPlanBadge}>
                              <Ionicons name="checkmark-circle" size={16} color="#ef4444" />
                              <Text style={styles.inPlanBadgeText}>W planie: {groupName}</Text>
                            </View>
                          )}
                          <View style={inPlan ? styles.exerciseCardDimmed : null}>
                            <ExerciseCard
                              exercise={exercise}
                              exerciseId={idx}
                              isExpanded={false}
                              onToggle={() => handleImageClick(exercise)}
                            />
                          </View>
                          <TouchableOpacity
                            onPress={() => addExercise(exercise)}
                            style={styles.addButton}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={inPlan ? "add-circle-outline" : "add-circle"}
                              size={24}
                              color={inPlan ? "#9ca3af" : "#9333ea"}
                            />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              </>
            )}
          </View>
        )}

        {activeTab === 'favorites' && (
          <View style={styles.exerciseList}>
            {favorites.length === 0 ? (
              <Text style={styles.emptyText}>Brak ulubionych ćwiczeń</Text>
            ) : (
              favorites.map((exercise, idx) => {
                const { inPlan, groupName } = isExerciseInPlan(exercise.name);
                return (
                  <View
                    key={`favorite-${exercise.name}-${idx}`}
                    style={[
                      styles.searchExerciseItem,
                      inPlan && styles.searchExerciseItemInPlan
                    ]}
                  >
                    {inPlan && (
                      <View style={styles.inPlanBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#ef4444" />
                        <Text style={styles.inPlanBadgeText}>W planie: {groupName}</Text>
                      </View>
                    )}
                    <View style={inPlan ? styles.exerciseCardDimmed : null}>
                      <ExerciseCard
                        exercise={exercise}
                        exerciseId={idx}
                        isExpanded={false}
                        onToggle={() => handleImageClick(exercise)}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => addExercise(exercise)}
                      style={styles.addButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={inPlan ? "add-circle-outline" : "add-circle"}
                        size={24}
                        color={inPlan ? "#9ca3af" : "#9333ea"}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'saved' && (
          <View style={styles.savedWorkoutsList}>
            {savedWorkouts.length === 0 ? (
              <Text style={styles.emptyText}>Brak zapisanych treningów</Text>
            ) : (
              savedWorkouts.map((workout) => (
                <View key={workout.id} style={styles.savedWorkoutItem}>
                  <View style={styles.savedWorkoutHeader}>
                    <View style={styles.savedWorkoutInfo}>
                      <Text style={styles.savedWorkoutTitle}>{workout.title}</Text>
                      <Text style={styles.savedWorkoutDate}>
                        {workout.date ? new Date(workout.date + 'T00:00:00').toLocaleDateString('pl-PL') : ''}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => loadWorkout(workout)}
                      style={styles.loadButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="barbell" size={20} color="#ffffff" />
                      <Text style={styles.loadButtonText}>Wczytaj</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={styles.selectedSection}>
          <Text style={styles.selectedTitle}>Plan treningowy</Text>

          {/* Grupy mięśniowe */}
          {workoutPlan.map((group) => (
              <View key={group.id} style={styles.muscleGroupSection}>
                <View style={styles.muscleGroupHeader}>
                  {group.muscleGroup ? (
                    <View style={styles.muscleGroupHeaderContent}>
                      <Text style={styles.muscleGroupIcon}>
                        {TRAINING_TYPES.find(t => t.id === group.muscleGroup)?.name || 'Grupa'}
                      </Text>
                      <Text style={styles.muscleGroupCount}>({group.exercises.length})</Text>
                    </View>
                  ) : (
                    <View style={styles.muscleGroupSelector}>
                      <Text style={styles.muscleGroupSelectorLabel}>Wybierz grupę mięśniową:</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.muscleGroupOptions}
                      >
                        {TRAINING_TYPES.filter(type => type.id !== 'fullbody').map(type => (
                          <TouchableOpacity
                            key={type.id}
                            onPress={() => setMuscleGroupType(group.id, type.id)}
                            style={styles.muscleGroupOption}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.muscleGroupOptionText}>{type.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => removeGroup(group.id)}
                    style={styles.removeGroupButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                {group.muscleGroup && (
                  <>
                    {group.exercises.map((exercise) => (
                      <View key={exercise.id} style={styles.selectedExerciseItem}>
                        <ExerciseCard
                          exercise={exercise}
                          exerciseId={exercise.id}
                          isExpanded={expandedExercise === exercise.id}
                          onToggle={() => toggleExerciseDetails(exercise.id)}
                        />
                        <View style={styles.selectedExerciseActions}>
                          <TouchableOpacity
                            onPress={() => toggleFavorite(exercise)}
                            style={styles.smallButton}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={isFavoriteExercise(exercise.name) ? 'star' : 'star-outline'}
                              size={20}
                              color={isFavoriteExercise(exercise.name) ? '#facc15' : '#9ca3af'}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => removeExerciseFromGroup(group.id, exercise.id)}
                            style={styles.removeButton}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="close-circle" size={20} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}

                    {/* Lokalny search bar dla grupy */}
                    <View style={[
                      styles.groupSearchSection,
                      groupSearchQueries[group.id] && groupSearchQueries[group.id].length > 0 && styles.groupSearchSectionExpanded
                    ]}>
                      <TextInput
                        style={styles.groupSearchInput}
                        value={groupSearchQueries[group.id] || ''}
                        onChangeText={(text) => {
                          setGroupSearchQueries(prev => ({
                            ...prev,
                            [group.id]: text
                          }));
                        }}
                        placeholder="Szukaj ćwiczeń do dodania..."
                        placeholderTextColor="#9ca3af"
                      />

                      {groupSearchQueries[group.id] && groupSearchQueries[group.id].length > 0 && (
                        <>
                          <Pressable
                            style={styles.groupSearchBackdrop}
                            onPress={() => {
                              setGroupSearchQueries(prev => ({
                                ...prev,
                                [group.id]: ''
                              }));
                            }}
                          />
                          <View style={styles.groupSearchResultsOverlay}>
                            <ScrollView
                              style={styles.groupSearchResultsScrollView}
                              contentContainerStyle={styles.groupSearchResultsContent}
                              showsVerticalScrollIndicator={true}
                              nestedScrollEnabled={true}
                            >
                              {getFilteredExercisesForGroup(group.muscleGroup, groupSearchQueries[group.id]).map((exercise, idx) => {
                                const { inPlan, groupName } = isExerciseInPlan(exercise.name);
                                return (
                                  <View
                                    key={`group-search-${group.id}-${exercise.name}-${idx}`}
                                    style={[
                                      styles.groupSearchResultItem,
                                      inPlan && styles.searchExerciseItemInPlan
                                    ]}
                                  >
                                    {inPlan && (
                                      <View style={styles.inPlanBadge}>
                                        <Ionicons name="checkmark-circle" size={16} color="#ef4444" />
                                        <Text style={styles.inPlanBadgeText}>W planie: {groupName}</Text>
                                      </View>
                                    )}
                                    <View style={inPlan ? styles.exerciseCardDimmed : null}>
                                      <ExerciseCard
                                        exercise={exercise}
                                        exerciseId={`group-${group.id}-${idx}`}
                                        isExpanded={false}
                                        onToggle={() => handleImageClick(exercise)}
                                      />
                                    </View>
                                    <TouchableOpacity
                                      onPress={() => {
                                        addExerciseToGroup(group.id, exercise);
                                        setGroupSearchQueries(prev => ({
                                          ...prev,
                                          [group.id]: ''
                                        }));
                                      }}
                                      style={styles.addButton}
                                      activeOpacity={0.7}
                                    >
                                      <Ionicons
                                        name={inPlan ? "add-circle-outline" : "add-circle"}
                                        size={24}
                                        color={inPlan ? "#9ca3af" : "#9333ea"}
                                      />
                                    </TouchableOpacity>
                                  </View>
                                );
                              })}
                            </ScrollView>
                          </View>
                        </>
                      )}
                    </View>
                  </>
                )}
              </View>
            ))}

            <TouchableOpacity
              onPress={addMuscleGroup}
              style={styles.addMuscleGroupButton}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={24} color="#ffffff" />
              <Text style={styles.addMuscleGroupButtonText}>Dodaj grupę mięśniową</Text>
            </TouchableOpacity>
          </View>
      </ScrollView>

      <GifModal
        exercise={selectedExercise}
        onClose={closeModal}
        onToggleFavorite={() => selectedExercise && toggleFavorite(selectedExercise)}
        isFavorite={selectedExercise ? isFavoriteExercise(selectedExercise.name) : false}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    color: '#9333ea',
    fontSize: 16,
    fontWeight: '500',
  },
  titleInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    paddingVertical: 8,
  },
  favoriteButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f3e8ff',
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#9333ea',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#9333ea',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  searchContainer: {
    position: 'relative',
    zIndex: 10,
  },
  searchInput: {
    margin: 16,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
    zIndex: 1,
  },
  searchBackdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    height: 10000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 50,
  },
  searchResultsOverlay: {
    position: 'absolute',
    top: 68,
    left: 16,
    right: 16,
    zIndex: 100,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 500,
  },
  searchResultsScrollView: {
    maxHeight: 500,
  },
  searchResultsContent: {
    padding: 8,
    gap: 12,
  },
  muscleGroupsScroll: {
    maxHeight: 50,
  },
  muscleGroupsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  muscleGroupChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  muscleGroupChipActive: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  muscleGroupChipText: {
    fontSize: 14,
    color: '#4b5563',
  },
  muscleGroupChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  exerciseList: {
    padding: 16,
    gap: 12,
  },
  searchExerciseItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  addButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 40,
  },
  savedWorkoutsList: {
    padding: 16,
    gap: 12,
  },
  savedWorkoutItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  savedWorkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedWorkoutInfo: {
    flex: 1,
  },
  savedWorkoutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  savedWorkoutDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  loadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#9333ea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedSection: {
    padding: 16,
    borderTopWidth: 2,
    borderTopColor: '#e9d5ff',
  },
  selectedTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 16,
  },
  categorySection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  categoryCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  categoryExercises: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  selectedExerciseItem: {
    backgroundColor: '#f9fafb',
  },
  selectedExerciseActions: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    justifyContent: 'flex-end',
  },
  smallButton: {
    padding: 8,
  },
  removeButton: {
    padding: 8,
  },
  legacyExercisesSection: {
    marginBottom: 16,
  },
  legacyTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  ungroupedExercisesSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    overflow: 'hidden',
  },
  ungroupedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  ungroupedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  ungroupedCount: {
    fontSize: 14,
    color: '#9ca3af',
  },
  muscleGroupSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9333ea',
    marginBottom: 12,
    overflow: 'hidden',
  },
  muscleGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f3e8ff',
  },
  muscleGroupHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  muscleGroupIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  muscleGroupCount: {
    fontSize: 14,
    color: '#7c3aed',
  },
  muscleGroupSelector: {
    flex: 1,
  },
  muscleGroupSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
    marginBottom: 8,
  },
  muscleGroupOptions: {
    maxHeight: 40,
  },
  muscleGroupOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#9333ea',
  },
  muscleGroupOptionText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
  },
  removeGroupButton: {
    padding: 8,
  },
  addExerciseToGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addExerciseToGroupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9333ea',
  },
  addMuscleGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#9333ea',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  addMuscleGroupButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addingToGroupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3e8ff',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9333ea',
  },
  addingToGroupContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  addingToGroupText: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
    flex: 1,
  },
  cancelAddingButton: {
    padding: 4,
  },
  groupSearchSection: {
    position: 'relative',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    zIndex: 5,
  },
  groupSearchSectionExpanded: {
    minHeight: 450,
  },
  groupSearchInput: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 14,
    zIndex: 1,
  },
  groupSearchBackdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    height: 10000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 25,
  },
  groupSearchResultsOverlay: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    zIndex: 50,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 400,
  },
  groupSearchResultsScrollView: {
    maxHeight: 400,
  },
  groupSearchResultsContent: {
    padding: 8,
    gap: 8,
  },
  groupSearchResults: {
    marginTop: 12,
    gap: 8,
  },
  groupSearchResultItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    position: 'relative',
  },
  searchExerciseItemInPlan: {
    borderColor: '#fca5a5',
    borderWidth: 2,
    backgroundColor: '#fef2f2',
  },
  inPlanBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  inPlanBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  exerciseCardDimmed: {
    opacity: 0.6,
  },
});

export default CustomWorkoutBuilder;