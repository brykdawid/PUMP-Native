import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CompletedWorkoutDetails from '../workout/CompletedWorkoutDetails';
import { fetchExercises } from '../../services/api';
import { TRAINING_TYPES } from '../data/exercisesData';

function StatsPage({ userStats, setUserStats, workoutHistory = [], onSaveCompletedWorkoutAsTemplate, onRemoveCompletedWorkoutAsTemplate, isWorkoutSavedAsTemplate }) {
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [activeTab, setActiveTab] = useState('body'); // 'body', 'volume', 'workouts'
  const [showVolumeDetails, setShowVolumeDetails] = useState(false);
  const [showWorkoutDetails, setShowWorkoutDetails] = useState(false);
  const [volumePeriod, setVolumePeriod] = useState('weekly'); // 'weekly' or 'monthly'
  const [workoutPeriod, setWorkoutPeriod] = useState('weekly'); // 'weekly' or 'monthly'
  const [expandedExercises, setExpandedExercises] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showWeightHistoryModal, setShowWeightHistoryModal] = useState(false);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [showExercisePickerModal, setShowExercisePickerModal] = useState(false);
  const [newRecordExercise, setNewRecordExercise] = useState('');
  const [newRecordWeight, setNewRecordWeight] = useState('');
  const [selectedExerciseFromApi, setSelectedExerciseFromApi] = useState(null);
  const [exercisesList, setExercisesList] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Pobierz ćwiczenia z API przy pierwszym otwarciu modal'a
  useEffect(() => {
    if (showExercisePickerModal && exercisesList.length === 0) {
      loadExercises();
    }
  }, [showExercisePickerModal]);

  // Filtruj ćwiczenia po zmianie search query lub kategorii
  useEffect(() => {
    filterExercises();
  }, [searchQuery, selectedCategory, exercisesList]);

  const loadExercises = async () => {
    try {
      const exercises = await fetchExercises();
      setExercisesList(exercises);
      setFilteredExercises(exercises);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    }
  };

  const filterExercises = () => {
    let filtered = [...exercisesList];

    // Filtruj po kategorii
    if (selectedCategory) {
      filtered = filtered.filter(ex => ex.category === selectedCategory);
    }

    // Filtruj po wyszukiwanej frazie
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(query)
      );
    }

    setFilteredExercises(filtered);
  };

  const startEdit = (field, currentValue) => {
    setEditingField(field);
    setTempValue(currentValue.toString());
  };

  const saveEdit = () => {
    const numValue = parseFloat(tempValue);
    if (!isNaN(numValue) && numValue > 0) {
      if (editingField === 'weight' || editingField === 'height') {
        const newStats = { ...userStats, [editingField]: numValue };
        if (editingField === 'weight' || editingField === 'height') {
          const weight = editingField === 'weight' ? numValue : userStats.weight;
          const height = editingField === 'height' ? numValue : userStats.height;
          newStats.bmi = parseFloat((weight / ((height / 100) ** 2)).toFixed(1));
        }

        // Jeśli zmienia się waga, dodaj do historii
        if (editingField === 'weight' && numValue !== userStats.weight) {
          const weightHistory = userStats.weightHistory || [];
          newStats.weightHistory = [...weightHistory, {
            date: new Date().toISOString(),
            weight: numValue
          }];
        }

        setUserStats(newStats);
      }
    }
    setEditingField(null);
  };

  const updateRecord = (index, newWeight) => {
    const numValue = parseFloat(newWeight);
    if (!isNaN(numValue) && numValue > 0) {
      const newRecords = [...userStats.records];
      newRecords[index].weight = numValue;
      setUserStats({ ...userStats, records: newRecords });
    }
  };

  const addRecord = () => {
    // Walidacja
    if (selectedExerciseFromApi) {
      // Dodawanie rekordu z listy API
      if (!newRecordWeight.trim()) {
        return;
      }
      const numValue = parseFloat(newRecordWeight);
      if (isNaN(numValue) || numValue <= 0) {
        return;
      }

      const newRecord = {
        exercise: selectedExerciseFromApi.name,
        weight: numValue,
        image: selectedExerciseFromApi.image,
        category: selectedExerciseFromApi.category
      };

      setUserStats({
        ...userStats,
        records: [...userStats.records, newRecord]
      });
    } else {
      // Dodawanie własnego rekordu
      if (newRecordExercise.trim() === '' || newRecordWeight.trim() === '') {
        return;
      }

      const numValue = parseFloat(newRecordWeight);
      if (isNaN(numValue) || numValue <= 0) {
        return;
      }

      const newRecord = {
        exercise: newRecordExercise.trim(),
        weight: numValue
      };

      setUserStats({
        ...userStats,
        records: [...userStats.records, newRecord]
      });
    }

    // Reset form
    setNewRecordExercise('');
    setNewRecordWeight('');
    setSelectedExerciseFromApi(null);
    setShowAddRecordModal(false);
  };

  const openCustomRecordModal = () => {
    setSelectedExerciseFromApi(null);
    setNewRecordExercise('');
    setNewRecordWeight('');
    setShowAddRecordModal(true);
  };

  const openExercisePickerModal = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setShowExercisePickerModal(true);
  };

  const handleSelectExercise = (exercise) => {
    setSelectedExerciseFromApi(exercise);
    setNewRecordWeight('');
    setShowExercisePickerModal(false);
    setShowAddRecordModal(true);
  };

  const deleteRecord = (index) => {
    const newRecords = userStats.records.filter((_, idx) => idx !== index);
    setUserStats({ ...userStats, records: newRecords });
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { text: 'Niedowaga', color: '#2563eb' };
    if (bmi < 25) return { text: 'Normalna', color: '#16a34a' };
    if (bmi < 30) return { text: 'Nadwaga', color: '#ca8a04' };
    return { text: 'Otyłość', color: '#dc2626' };
  };

  // Obliczanie statystyk wagi z historii
  const calculateWeightStats = useMemo(() => {
    const weightHistory = userStats.weightHistory || [];

    // Dodaj aktualną wagę do obliczeń
    const allWeights = [...weightHistory.map(entry => entry.weight), userStats.weight];

    if (allWeights.length === 0) {
      return { min: 0, max: 0, average: 0 };
    }

    const min = Math.min(...allWeights);
    const max = Math.max(...allWeights);
    const average = allWeights.reduce((sum, w) => sum + w, 0) / allWeights.length;

    return {
      min: parseFloat(min.toFixed(1)),
      max: parseFloat(max.toFixed(1)),
      average: parseFloat(average.toFixed(1))
    };
  }, [userStats.weight, userStats.weightHistory]);

  // Calculate training volume from pre-calculated totalVolume field
  const calculateTrainingVolume = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    let weeklyVolume = 0;
    let monthlyVolume = 0;

    workoutHistory.forEach((workout) => {
      // Skip scheduled workouts - only count completed workouts
      if (workout.scheduled) return;

      const workoutDate = new Date(workout.date);
      const volume = workout.totalVolume || 0;

      if (workoutDate >= weekAgo) {
        weeklyVolume += volume;
      }
      if (workoutDate >= monthAgo) {
        monthlyVolume += volume;
      }
    });

    return {
      weekly: Math.round(weeklyVolume),
      monthly: Math.round(monthlyVolume),
    };
  }, [workoutHistory]);

  // Calculate workout count
  const calculateWorkoutCount = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    let weeklyCount = 0;
    let monthlyCount = 0;

    workoutHistory.forEach((workout) => {
      // Skip scheduled workouts - only count completed workouts
      if (workout.scheduled) return;

      const workoutDate = new Date(workout.date);

      if (workoutDate >= weekAgo) {
        weeklyCount++;
      }
      if (workoutDate >= monthAgo) {
        monthlyCount++;
      }
    });

    return {
      weekly: weeklyCount,
      monthly: monthlyCount,
    };
  }, [workoutHistory]);

  // Filter workouts by period
  const getFilteredWorkouts = (period) => {
    const now = new Date();
    const cutoffDate = new Date(now);
    if (period === 'weekly') {
      cutoffDate.setDate(cutoffDate.getDate() - 7);
    } else {
      cutoffDate.setMonth(cutoffDate.getMonth() - 1);
    }
    // Skip scheduled workouts - only return completed workouts
    return workoutHistory.filter(workout => !workout.scheduled && new Date(workout.date) >= cutoffDate);
  };

  // Get all exercises with their sets from filtered workouts
  const getExercisesWithSets = (period) => {
    const filtered = getFilteredWorkouts(period);
    const exerciseMap = {};

    filtered.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        if (!exerciseMap[exercise.name]) {
          exerciseMap[exercise.name] = {
            name: exercise.name,
            category: exercise.category,
            image: exercise.image, // Store exercise image
            allSets: []
          };
        }
        // Check if sets is an array before iterating
        if (Array.isArray(exercise.sets)) {
          exercise.sets.forEach(set => {
            if (set.completed) {
              exerciseMap[exercise.name].allSets.push({
                ...set,
                workoutDate: workout.date,
                workoutTitle: workout.title
              });
            }
          });
        }
      });
    });

    return Object.values(exerciseMap);
  };

  const bmiCategory = getBMICategory(userStats.bmi);

  const toggleExerciseExpand = (exerciseName) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseName]: !prev[exerciseName]
    }));
  };

  const handleSaveWorkout = (workout) => {
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

  const renderTabButton = (tab, icon, label) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={20}
        color={activeTab === tab ? '#9333ea' : '#6b7280'}
      />
      <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderBodyMetrics = () => (
    <>
      {/* Body Stats */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trending-up" size={20} color="#9333ea" />
          <Text style={styles.sectionTitle}>Parametry ciała</Text>
        </View>

        <View style={styles.metricsGrid}>
          {/* Weight */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Waga</Text>
            {editingField === 'weight' ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={tempValue}
                  onChangeText={setTempValue}
                  keyboardType="decimal-pad"
                  autoFocus
                  onBlur={saveEdit}
                />
                <TouchableOpacity onPress={saveEdit} style={styles.checkButton}>
                  <Ionicons name="checkmark" size={16} color="#16a34a" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => startEdit('weight', userStats.weight)}
                style={styles.metricValueContainer}
                activeOpacity={0.7}
              >
                <Text style={styles.metricValue}>{userStats.weight}</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.metricUnit}>kg</Text>
          </View>

          {/* Height */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Wzrost</Text>
            {editingField === 'height' ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={tempValue}
                  onChangeText={setTempValue}
                  keyboardType="decimal-pad"
                  autoFocus
                  onBlur={saveEdit}
                />
                <TouchableOpacity onPress={saveEdit} style={styles.checkButton}>
                  <Ionicons name="checkmark" size={16} color="#16a34a" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => startEdit('height', userStats.height)}
                style={styles.metricValueContainer}
                activeOpacity={0.7}
              >
                <Text style={styles.metricValue}>{userStats.height}</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.metricUnit}>cm</Text>
          </View>

          {/* BMI */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>BMI</Text>
            <Text style={styles.metricValue}>{userStats.bmi}</Text>
            <Text style={[styles.bmiCategory, { color: bmiCategory.color }]}>
              {bmiCategory.text}
            </Text>
          </View>
        </View>

        {/* Przycisk Historia */}
        <TouchableOpacity
          onPress={() => setShowWeightHistoryModal(true)}
          style={styles.historyButton}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={18} color="#9333ea" />
          <Text style={styles.historyButtonText}>Historia wagi</Text>
        </TouchableOpacity>
      </View>

      {/* Personal Records */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trophy" size={20} color="#facc15" />
          <Text style={styles.sectionTitle}>Rekordy osobiste</Text>
        </View>

        {/* Informacja - pokazuj tylko gdy brak rekordów */}
        {userStats.records.length === 0 && (
          <View style={styles.recordsInfoContainer}>
            <Ionicons name="information-circle-outline" size={48} color="#9333ea" />
            <Text style={styles.recordsInfoTitle}>Śledź swoje rekordy</Text>
            <Text style={styles.recordsInfoText}>
              Dodaj własne ćwiczenia i zapisuj swoje najlepsze wyniki w kilogramach.
              Śledź postępy i miej zawsze pod ręką swoje osiągnięcia!
            </Text>
          </View>
        )}

        {/* Lista dodanych rekordów */}
        {userStats.records.length > 0 && (
          <>
            {/* Rekordy z aplikacji */}
            {userStats.records.filter(r => r.image || r.category).length > 0 && (
              <View style={styles.recordsCategory}>
                <View style={styles.recordsCategoryHeader}>
                  <Ionicons name="cloud-download-outline" size={18} color="#3b82f6" />
                  <Text style={styles.recordsCategoryTitle}>Z aplikacji</Text>
                </View>
                <View style={styles.recordsList}>
                  {userStats.records.map((record, idx) => {
                    const isFromApi = record.image || record.category;
                    if (!isFromApi) return null;

                    return (
                      <View key={idx} style={styles.recordCard}>
                        {record.image && (
                          <Image
                            source={{ uri: record.image }}
                            style={styles.recordImage}
                            resizeMode="cover"
                          />
                        )}

                        <View style={styles.recordInfo}>
                          <Text style={styles.recordExercise}>{record.exercise}</Text>
                          <Text style={styles.recordLabel}>Najlepszy wynik</Text>
                        </View>

                        <View style={styles.recordActions}>
                          <View style={styles.recordValueContainer}>
                            <Text style={styles.recordValue}>{record.weight}</Text>
                            <Text style={styles.recordUnit}>kg</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => deleteRecord(idx)}
                            style={styles.deleteRecordButton}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="trash-outline" size={20} color="#dc2626" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Rekordy własne */}
            {userStats.records.filter(r => !r.image && !r.category).length > 0 && (
              <View style={styles.recordsCategory}>
                <View style={styles.recordsCategoryHeader}>
                  <Ionicons name="pencil-outline" size={18} color="#9333ea" />
                  <Text style={styles.recordsCategoryTitle}>Własne</Text>
                </View>
                <View style={styles.recordsList}>
                  {userStats.records.map((record, idx) => {
                    const isFromApi = record.image || record.category;
                    if (isFromApi) return null;

                    return (
                      <View key={idx} style={styles.recordCard}>
                        <View style={styles.recordInfo}>
                          <Text style={styles.recordExercise}>{record.exercise}</Text>
                          <Text style={styles.recordLabel}>Najlepszy wynik</Text>
                        </View>

                        <View style={styles.recordActions}>
                          <View style={styles.recordValueContainer}>
                            <Text style={styles.recordValue}>{record.weight}</Text>
                            <Text style={styles.recordUnit}>kg</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => deleteRecord(idx)}
                            style={styles.deleteRecordButton}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="trash-outline" size={20} color="#dc2626" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        {/* Przyciski dodawania */}
        <View style={styles.addButtonsContainer}>
          <TouchableOpacity
            onPress={openCustomRecordModal}
            style={[styles.addRecordButton, styles.addRecordButtonCustom]}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color="#ffffff" />
            <Text style={styles.addRecordButtonText}>Dodaj własny rekord</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openExercisePickerModal}
            style={[styles.addRecordButton, styles.addRecordButtonFromList]}
            activeOpacity={0.7}
          >
            <Ionicons name="list-outline" size={20} color="#ffffff" />
            <Text style={styles.addRecordButtonText}>Dodaj z listy ćwiczeń</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderVolumeDetails = () => {
    const exercises = getExercisesWithSets(volumePeriod);

    return (
      <View style={styles.detailsContainer}>
        {exercises.map((exercise, idx) => {
          const isExpanded = expandedExercises[exercise.name];
          const totalVolume = exercise.allSets.reduce((sum, set) => {
            const weight = parseFloat(set.weight) || 0;
            const reps = parseFloat(set.reps) || 0;
            return sum + (weight * reps);
          }, 0);

          // Only show exercises with volume > 0
          if (totalVolume === 0) {
            return null;
          }

          // Get exercise image
          const exerciseImage = exercise.image;
          const hasImageError = imageErrors[exercise.name];

          return (
            <View key={idx} style={styles.exerciseCard}>
              <TouchableOpacity
                onPress={() => toggleExerciseExpand(exercise.name)}
                style={styles.exerciseHeader}
                activeOpacity={0.7}
              >
                {/* Exercise GIF/Image */}
                <View style={styles.exerciseImageContainer}>
                  {exerciseImage && !hasImageError ? (
                    <Image
                      source={{ uri: exerciseImage }}
                      style={styles.exerciseImage}
                      resizeMode="cover"
                      onError={() => {
                        setImageErrors(prev => ({ ...prev, [exercise.name]: true }));
                      }}
                    />
                  ) : (
                    <View style={styles.exerciseImagePlaceholder}>
                      <Ionicons name="barbell-outline" size={28} color="#d1d5db" />
                    </View>
                  )}
                </View>

                <View style={styles.exerciseHeaderLeft}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseVolume}>
                    {totalVolume.toLocaleString()} kg total
                  </Text>
                </View>
                <View style={styles.exerciseExpandButton}>
                  <Text style={styles.exerciseExpandText}>
                    {isExpanded ? 'Ukryj' : 'Pokaż'} serie
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up-circle' : 'chevron-down-circle'}
                    size={24}
                    color="#9333ea"
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.setsContainer}>
                  {exercise.allSets.map((set, setIdx) => (
                    <View key={setIdx} style={styles.detailSetRow}>
                      <Text style={styles.detailSetNumber}>{setIdx + 1}</Text>
                      <View style={styles.detailSetInput}>
                        <Text style={styles.detailSetText}>{set.weight} kg</Text>
                      </View>
                      <Text style={styles.setX}>×</Text>
                      <View style={styles.detailSetInput}>
                        <Text style={styles.detailSetText}>{set.reps} powt.</Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderTrainingVolume = () => (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="barbell" size={20} color="#9333ea" />
          <Text style={styles.sectionTitle}>Objętość treningu</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Całkowity podniesiony ciężar (ciężar × powtórzenia)
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="calendar" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.statLabel}>Tygodniowo</Text>
            <Text style={styles.statValue}>
              {calculateTrainingVolume.weekly.toLocaleString()}
            </Text>
            <Text style={styles.statUnit}>kg</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="calendar-outline" size={24} color="#8b5cf6" />
            </View>
            <Text style={styles.statLabel}>Miesięcznie</Text>
            <Text style={styles.statValue}>
              {calculateTrainingVolume.monthly.toLocaleString()}
            </Text>
            <Text style={styles.statUnit}>kg</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowVolumeDetails(!showVolumeDetails)}
          style={styles.detailsButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showVolumeDetails ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color="#9333ea"
          />
          <Text style={styles.detailsButtonText}>
            {showVolumeDetails ? 'Ukryj szczegóły' : 'Pokaż szczegóły'}
          </Text>
        </TouchableOpacity>
      </View>

      {showVolumeDetails && (
        <View style={styles.section}>
          <View style={styles.periodToggle}>
            <TouchableOpacity
              onPress={() => setVolumePeriod('weekly')}
              style={[styles.periodButton, volumePeriod === 'weekly' && styles.periodButtonActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodButtonText, volumePeriod === 'weekly' && styles.periodButtonTextActive]}>
                Tygodniowo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setVolumePeriod('monthly')}
              style={[styles.periodButton, volumePeriod === 'monthly' && styles.periodButtonActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodButtonText, volumePeriod === 'monthly' && styles.periodButtonTextActive]}>
                Miesięcznie
              </Text>
            </TouchableOpacity>
          </View>

          {renderVolumeDetails()}
        </View>
      )}
    </>
  );

  const renderWorkoutDetails = () => {
    const workouts = getFilteredWorkouts(workoutPeriod);

    return (
      <View style={styles.detailsContainer}>
        {workouts.map((workout, idx) => {
          const date = new Date(workout.date);
          const dateStr = date.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          const timeStr = date.toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit'
          });
          const duration = Math.floor(workout.duration / 60);

          return (
            <View key={idx} style={styles.workoutCard}>
              <View style={styles.workoutCardHeader}>
                <View style={styles.workoutCardHeaderLeft}>
                  <Text style={styles.workoutTitle} numberOfLines={1} ellipsizeMode="tail">{workout.title}</Text>
                  <Text style={styles.workoutDate}>
                    {dateStr} o {timeStr}
                  </Text>
                </View>
                <View style={styles.workoutStats}>
                  <View style={styles.workoutStatItem}>
                    <Ionicons name="time-outline" size={16} color="#6b7280" />
                    <Text style={styles.workoutStatText}>{duration} min</Text>
                  </View>
                  {workout.totalVolume > 0 && (
                    <View style={styles.workoutStatItem}>
                      <Ionicons name="barbell-outline" size={16} color="#6b7280" />
                      <Text style={styles.workoutStatText}>
                        {workout.totalVolume.toLocaleString()} kg
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.workoutExercisesList}>
                {workout.exercises?.map((ex, exIdx) => {
                  // Handle both array and number types for exercise.sets
                  const completedSets = Array.isArray(ex.sets)
                    ? ex.sets.filter(s => s.completed).length
                    : (typeof ex.sets === 'number' ? ex.sets : 0);
                  return (
                    <Text key={exIdx} style={styles.workoutExerciseItem}>
                      • {ex.name} ({completedSets} serii)
                    </Text>
                  );
                })}
              </View>
              <View style={styles.workoutActions}>
                <TouchableOpacity
                  onPress={() => handleSaveWorkout(workout)}
                  style={styles.starIconButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isWorkoutSavedAsTemplate && isWorkoutSavedAsTemplate(workout) ? "star" : "star-outline"}
                    size={24}
                    color={isWorkoutSavedAsTemplate && isWorkoutSavedAsTemplate(workout) ? "#fbbf24" : "#9ca3af"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedWorkout(workout)}
                  style={styles.workoutDetailsButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="list-outline" size={18} color="#9333ea" />
                  <Text style={styles.workoutDetailsButtonText}>Szczegóły</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderWorkoutCount = () => (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="checkmark-done" size={20} color="#16a34a" />
          <Text style={styles.sectionTitle}>Ukończone treningi</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Całkowita liczba ukończonych sesji treningowych
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="flame" size={24} color="#f59e0b" />
            </View>
            <Text style={styles.statLabel}>Tygodniowo</Text>
            <Text style={styles.statValue}>
              {calculateWorkoutCount.weekly}
            </Text>
            <Text style={styles.statUnit}>treningi</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="trophy" size={24} color="#facc15" />
            </View>
            <Text style={styles.statLabel}>Miesięcznie</Text>
            <Text style={styles.statValue}>
              {calculateWorkoutCount.monthly}
            </Text>
            <Text style={styles.statUnit}>treningi</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowWorkoutDetails(!showWorkoutDetails)}
          style={styles.detailsButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showWorkoutDetails ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color="#16a34a"
          />
          <Text style={styles.detailsButtonText}>
            {showWorkoutDetails ? 'Ukryj szczegóły' : 'Pokaż szczegóły'}
          </Text>
        </TouchableOpacity>
      </View>

      {showWorkoutDetails && (
        <View style={styles.section}>
          <View style={styles.periodToggle}>
            <TouchableOpacity
              onPress={() => setWorkoutPeriod('weekly')}
              style={[styles.periodButton, workoutPeriod === 'weekly' && styles.periodButtonActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodButtonText, workoutPeriod === 'weekly' && styles.periodButtonTextActive]}>
                Tygodniowo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setWorkoutPeriod('monthly')}
              style={[styles.periodButton, workoutPeriod === 'monthly' && styles.periodButtonActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodButtonText, workoutPeriod === 'monthly' && styles.periodButtonTextActive]}>
                Miesięcznie
              </Text>
            </TouchableOpacity>
          </View>

          {renderWorkoutDetails()}
        </View>
      )}
    </>
  );

  // Show workout details if a workout is selected
  if (selectedWorkout) {
    return (
      <CompletedWorkoutDetails
        workout={selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
        onSaveCompletedWorkoutAsTemplate={onSaveCompletedWorkoutAsTemplate}
        onRemoveCompletedWorkoutAsTemplate={onRemoveCompletedWorkoutAsTemplate}
        isWorkoutSavedAsTemplate={isWorkoutSavedAsTemplate}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>PUMP</Text>
          <Text style={styles.subtitle}>Twoje statystyki</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {renderTabButton('body', 'body', 'Ciało')}
          {renderTabButton('volume', 'barbell', 'Objętość')}
          {renderTabButton('workouts', 'fitness', 'Treningi')}
        </View>

        {/* Tab Content */}
        {activeTab === 'body' && renderBodyMetrics()}
        {activeTab === 'volume' && renderTrainingVolume()}
        {activeTab === 'workouts' && renderWorkoutCount()}
      </ScrollView>

      {/* Modal historii wagi */}
      <Modal
        visible={showWeightHistoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWeightHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Statystyki wagi</Text>
              <TouchableOpacity
                onPress={() => setShowWeightHistoryModal(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.weightStatsGrid}>
              <View style={styles.weightStatCard}>
                <Ionicons name="arrow-down-circle" size={32} color="#16a34a" />
                <Text style={styles.weightStatLabel}>Najmniejsza waga</Text>
                <Text style={styles.weightStatValue}>{calculateWeightStats.min}</Text>
                <Text style={styles.weightStatUnit}>kg</Text>
              </View>

              <View style={styles.weightStatCard}>
                <Ionicons name="analytics" size={32} color="#3b82f6" />
                <Text style={styles.weightStatLabel}>Średnia waga</Text>
                <Text style={styles.weightStatValue}>{calculateWeightStats.average}</Text>
                <Text style={styles.weightStatUnit}>kg</Text>
              </View>

              <View style={styles.weightStatCard}>
                <Ionicons name="arrow-up-circle" size={32} color="#dc2626" />
                <Text style={styles.weightStatLabel}>Największa waga</Text>
                <Text style={styles.weightStatValue}>{calculateWeightStats.max}</Text>
                <Text style={styles.weightStatUnit}>kg</Text>
              </View>
            </View>

            <View style={styles.modalInfo}>
              <Ionicons name="information-circle" size={20} color="#6b7280" />
              <Text style={styles.modalInfoText}>
                Statystyki są automatycznie obliczane na podstawie historii pomiarów wagi
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal wyboru ćwiczenia z listy */}
      <Modal
        visible={showExercisePickerModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowExercisePickerModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.exercisePickerContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.exercisePickerHeader}>
            <TouchableOpacity
              onPress={() => setShowExercisePickerModal(false)}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#9333ea" />
              <Text style={styles.backButtonText}>Wróć</Text>
            </TouchableOpacity>
            <Text style={styles.exercisePickerTitle}>Wybierz ćwiczenie</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Wyszukaj ćwiczenie..."
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScrollView}
            contentContainerStyle={styles.categoriesContainer}
          >
            <TouchableOpacity
              onPress={() => setSelectedCategory(null)}
              style={[styles.categoryButton, selectedCategory === null && styles.categoryButtonActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryButtonText, selectedCategory === null && styles.categoryButtonTextActive]}>
                Wszystkie
              </Text>
            </TouchableOpacity>
            {TRAINING_TYPES.filter(type => type.id !== 'fullbody').map(type => (
              <TouchableOpacity
                key={type.id}
                onPress={() => setSelectedCategory(type.id)}
                style={[styles.categoryButton, selectedCategory === type.id && styles.categoryButtonActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryButtonText, selectedCategory === type.id && styles.categoryButtonTextActive]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Info lub lista ćwiczeń */}
          {filteredExercises.length === 0 && exercisesList.length === 0 ? (
            <View style={styles.exercisePickerEmptyState}>
              <ActivityIndicator size="large" color="#9333ea" />
              <Text style={styles.exercisePickerEmptyText}>Ładowanie ćwiczeń...</Text>
            </View>
          ) : filteredExercises.length === 0 ? (
            <View style={styles.exercisePickerEmptyState}>
              <Ionicons name="search-outline" size={64} color="#d1d5db" />
              <Text style={styles.exercisePickerEmptyText}>Nie znaleziono ćwiczeń</Text>
              <Text style={styles.exercisePickerEmptySubtext}>
                Spróbuj zmienić kategorię lub wyszukiwaną frazę
              </Text>
            </View>
          ) : !searchQuery && !selectedCategory ? (
            <View style={styles.exercisePickerEmptyState}>
              <Ionicons name="information-circle-outline" size={64} color="#9333ea" />
              <Text style={styles.exercisePickerEmptyTitle}>Wyszukaj ćwiczenia</Text>
              <Text style={styles.exercisePickerEmptyText}>
                Użyj paska wyszukiwania lub wybierz kategorię
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.exercisesListScroll} showsVerticalScrollIndicator={false}>
              {filteredExercises.map((exercise, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSelectExercise(exercise)}
                  style={styles.exerciseListItem}
                  activeOpacity={0.7}
                >
                  {exercise.image ? (
                    <Image
                      source={{ uri: exercise.image }}
                      style={styles.exerciseListImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.exerciseListImagePlaceholder}>
                      <Ionicons name="barbell-outline" size={32} color="#d1d5db" />
                    </View>
                  )}
                  <View style={styles.exerciseListInfo}>
                    <Text style={styles.exerciseListName}>{exercise.name}</Text>
                    <Text style={styles.exerciseListCategory}>{exercise.category}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal dodawania rekordu */}
      <Modal
        visible={showAddRecordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddRecordModal(false);
          setSelectedExerciseFromApi(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dodaj rekord osobisty</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddRecordModal(false);
                  setNewRecordExercise('');
                  setNewRecordWeight('');
                  setSelectedExerciseFromApi(null);
                }}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              {/* Jeśli wybrano ćwiczenie z API, pokaż jego szczegóły */}
              {selectedExerciseFromApi ? (
                <View style={styles.selectedExerciseContainer}>
                  {selectedExerciseFromApi.image ? (
                    <Image
                      source={{ uri: selectedExerciseFromApi.image }}
                      style={styles.selectedExerciseImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.selectedExerciseImagePlaceholder}>
                      <Ionicons name="barbell-outline" size={48} color="#d1d5db" />
                    </View>
                  )}
                  <Text style={styles.selectedExerciseName}>{selectedExerciseFromApi.name}</Text>
                  <Text style={styles.selectedExerciseCategory}>{selectedExerciseFromApi.category}</Text>
                </View>
              ) : (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Nazwa ćwiczenia</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newRecordExercise}
                    onChangeText={setNewRecordExercise}
                    placeholder="np. Wyciskanie sztangi"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Rekord (kg)</Text>
                <TextInput
                  style={styles.formInput}
                  value={newRecordWeight}
                  onChangeText={setNewRecordWeight}
                  placeholder="np. 100"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                />
              </View>

              <TouchableOpacity
                onPress={addRecord}
                style={styles.submitButton}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-circle" size={22} color="#ffffff" />
                <Text style={styles.submitButtonText}>Dodaj rekord</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#f3e8ff',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabLabelActive: {
    color: '#9333ea',
  },
  section: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  metricValueContainer: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  metricUnit: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  bmiCategory: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editInput: {
    width: 64,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#9333ea',
    paddingVertical: 4,
  },
  checkButton: {
    padding: 4,
  },
  recordsCategory: {
    marginBottom: 16,
  },
  recordsCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  recordsCategoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  recordsList: {
    gap: 12,
  },
  recordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  recordImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  recordInfo: {
    flex: 1,
  },
  recordExercise: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  recordLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  recordValueContainer: {
    alignItems: 'flex-end',
  },
  recordValueButton: {
    alignItems: 'flex-end',
  },
  recordValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  recordUnit: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  recordEditInput: {
    width: 80,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'right',
    borderBottomWidth: 2,
    borderBottomColor: '#9333ea',
    paddingVertical: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statHeader: {
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statUnit: {
    fontSize: 12,
    color: '#6b7280',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#9333ea',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },
  detailsContainer: {
    gap: 12,
  },
  exerciseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  exerciseImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    flexShrink: 0,
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
  exerciseVolume: {
    fontSize: 14,
    color: '#9333ea',
    fontWeight: '500',
  },
  exerciseExpandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
  },
  exerciseExpandText: {
    fontSize: 13,
    color: '#9333ea',
    fontWeight: '600',
  },
  setsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 8,
  },
  detailSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  detailSetNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
    width: 20,
  },
  detailSetInput: {
    width: 70,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  detailSetText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  workoutCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  workoutCardHeader: {
    marginBottom: 12,
  },
  workoutCardHeaderLeft: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  workoutStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutStatText: {
    fontSize: 13,
    color: '#6b7280',
  },
  workoutExercisesList: {
    gap: 4,
    marginBottom: 12,
  },
  workoutExerciseItem: {
    fontSize: 14,
    color: '#4b5563',
  },
  workoutActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  starIconButton: {
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  workoutDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#faf5ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9d5ff',
    flex: 1,
  },
  workoutDetailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9333ea',
  },
  // Styles dla przycisku historii
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  // Styles dla modalu
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  weightStatsGrid: {
    gap: 16,
  },
  weightStatCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  weightStatLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  weightStatValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  weightStatUnit: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  modalInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  setX: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  // Styles dla sekcji informacyjnej o rekordach
  recordsInfoContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#faf5ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9d5ff',
    marginBottom: 16,
  },
  recordsInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  recordsInfoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Styles dla akcji w karcie rekordu
  recordActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteRecordButton: {
    padding: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  // Styles dla przycisków dodawania rekordu
  addButtonsContainer: {
    gap: 12,
    marginTop: 8,
  },
  addRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  addRecordButtonCustom: {
    backgroundColor: '#9333ea',
  },
  addRecordButtonFromList: {
    backgroundColor: '#3b82f6',
  },
  addRecordButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Styles dla formularza
  formContainer: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#9333ea',
    borderRadius: 12,
    marginTop: 12,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Styles dla modalu wyboru ćwiczenia
  exercisePickerContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  exercisePickerHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  exercisePickerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9333ea',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  categoriesScrollView: {
    maxHeight: 50,
    marginBottom: 8,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryButtonActive: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  exercisePickerEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  exercisePickerEmptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  exercisePickerEmptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
  },
  exercisePickerEmptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  exercisesListScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  exerciseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exerciseListImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  exerciseListImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseListInfo: {
    flex: 1,
    marginLeft: 12,
  },
  exerciseListName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  exerciseListCategory: {
    fontSize: 14,
    color: '#6b7280',
  },
  // Styles dla wybranego ćwiczenia w modalu dodawania
  selectedExerciseContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  selectedExerciseImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedExerciseImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedExerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  selectedExerciseCategory: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default StatsPage;
