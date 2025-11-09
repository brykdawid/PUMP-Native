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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getExercises } from '../../utils/apiHelpers';
import { TRAINING_TYPES, CATEGORY_TO_AI_LABELS } from '../data/exercisesData';
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
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [savedWorkouts, setSavedWorkouts] = useState([]);
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
      const exercisesToLoad = preloadedWorkout.exercises.map(ex => ({
        ...ex,
        id: ex.id || `${ex.name}-${Date.now()}-${Math.random()}`
      }));
      setSelectedExercises(exercisesToLoad);
      setIsFavorite(preloadedWorkout.isFavorite || false);
      
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
      const saved = await AsyncStorage.getItem('favoriteExercises');
      if (saved) setFavorites(JSON.parse(saved));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadSavedWorkouts = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedWorkouts');
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
      await AsyncStorage.setItem('favoriteExercises', JSON.stringify(newFavorites));
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
    const newExercise = {
      ...exercise,
      id: `${exercise.name}-${Date.now()}-${Math.random()}`,
    };
    setSelectedExercises(prev => [...prev, newExercise]);
    
    const category = getPrimaryCategory(newExercise);
    setExpandedCategories(prev => ({
      ...prev,
      [category]: true
    }));
  };

  const removeExercise = (exerciseId) => {
    setSelectedExercises(prev => prev.filter(ex => ex.id !== exerciseId));
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
          savedAt: new Date().toISOString()
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
    if (selectedExercises.length === 0) {
      Alert.alert('Info', 'Dodaj przynajmniej jedno ćwiczenie do treningu');
      return;
    }

    if (onSaveWorkout) {
      const categories = Object.keys(exercisesByCategory);
      const workoutData = {
        type: 'custom',
        exercises: selectedExercises,
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
    if (selectedExercises.length === 0) {
      Alert.alert('Info', 'Dodaj przynajmniej jedno ćwiczenie do treningu');
      return;
    }

    if (onBeginWorkout) {
      const categories = Object.keys(exercisesByCategory);
      const workoutData = {
        type: 'custom',
        exercises: selectedExercises,
        warmup: [],
        categories: categories
      };
      onBeginWorkout(workoutData, customDate, true);
    }
  };

  const handleScheduleWorkout = () => {
    if (selectedExercises.length === 0) {
      Alert.alert('Info', 'Dodaj przynajmniej jedno ćwiczenie do treningu');
      return;
    }

    if (!scheduleCalledRef.current && onScheduleWorkout) {
      scheduleCalledRef.current = true;
      const categories = Object.keys(exercisesByCategory);
      const workoutData = {
        id: Date.now(),
        type: 'custom',
        exercises: selectedExercises,
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
    const exercisesToLoad = workout.exercises.map(ex => ({
      ...ex,
      id: ex.id || `${ex.name}-${Date.now()}-${Math.random()}`
    }));
    setSelectedExercises(exercisesToLoad);
    setWorkoutTitle(workout.title || 'Mój Trening');
    setActiveTab('search');
    
    const categories = {};
    exercisesToLoad.forEach(ex => {
      const category = getPrimaryCategory(ex);
      categories[category] = true;
    });
    setExpandedCategories(categories);
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
    
    if (selectedMuscleGroups.length === 0) return matchesSearch;
    
    const exerciseCategories = exercise.labels || [];
    return matchesSearch && selectedMuscleGroups.some(group => {
      const groupLabels = CATEGORY_TO_AI_LABELS[group] || [];
      return groupLabels.some(label => exerciseCategories.includes(label));
    });
  });

  const toggleMuscleGroup = (groupId) => {
    setSelectedMuscleGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
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
          <View>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Szukaj ćwiczeń..."
              placeholderTextColor="#9ca3af"
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.muscleGroupsScroll}
              contentContainerStyle={styles.muscleGroupsContent}
            >
              {TRAINING_TYPES.filter(type => type.id !== 'fullbody').map(type => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => toggleMuscleGroup(type.id)}
                  style={[
                    styles.muscleGroupChip,
                    selectedMuscleGroups.includes(type.id) && styles.muscleGroupChipActive
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.muscleGroupChipText,
                    selectedMuscleGroups.includes(type.id) && styles.muscleGroupChipTextActive
                  ]}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.exerciseList}>
              {filteredExercises.map((exercise, idx) => (
                <View key={idx} style={styles.searchExerciseItem}>
                  <ExerciseCard
                    exercise={exercise}
                    exerciseId={idx}
                    isExpanded={false}
                    onToggle={() => handleImageClick(exercise)}
                  />
                  <TouchableOpacity
                    onPress={() => addExercise(exercise)}
                    style={styles.addButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle" size={24} color="#9333ea" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'favorites' && (
          <View style={styles.exerciseList}>
            {favorites.length === 0 ? (
              <Text style={styles.emptyText}>Brak ulubionych ćwiczeń</Text>
            ) : (
              favorites.map((exercise, idx) => (
                <View key={idx} style={styles.searchExerciseItem}>
                  <ExerciseCard
                    exercise={exercise}
                    exerciseId={idx}
                    isExpanded={false}
                    onToggle={() => handleImageClick(exercise)}
                  />
                  <TouchableOpacity
                    onPress={() => addExercise(exercise)}
                    style={styles.addButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle" size={24} color="#9333ea" />
                  </TouchableOpacity>
                </View>
              ))
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

        {selectedExercises.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.selectedTitle}>Wybrane ćwiczenia</Text>
            {Object.entries(exercisesByCategory).map(([category, exercises]) => (
              <View key={category} style={styles.categorySection}>
                <TouchableOpacity
                  onPress={() => toggleCategory(category)}
                  style={styles.categoryHeader}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryHeaderLeft}>
                    <Text style={styles.categoryIcon}>{getCategoryIcon(category)}</Text>
                    <Text style={styles.categoryTitle}>{getCategoryName(category)}</Text>
                    <Text style={styles.categoryCount}>({exercises.length})</Text>
                  </View>
                  <Ionicons
                    name={expandedCategories[category] ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#4b5563"
                  />
                </TouchableOpacity>

                {expandedCategories[category] && (
                  <View style={styles.categoryExercises}>
                    {exercises.map((exercise) => (
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
                            onPress={() => removeExercise(exercise.id)}
                            style={styles.removeButton}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="close-circle" size={20} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
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
  searchInput: {
    margin: 16,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
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
});

export default CustomWorkoutBuilder;