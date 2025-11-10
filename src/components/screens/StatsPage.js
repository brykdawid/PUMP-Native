import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

function StatsPage({ userStats, setUserStats, workoutHistory = [] }) {
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [activeTab, setActiveTab] = useState('body'); // 'body', 'volume', 'workouts'
  const [showVolumeDetails, setShowVolumeDetails] = useState(false);
  const [showWorkoutDetails, setShowWorkoutDetails] = useState(false);
  const [volumePeriod, setVolumePeriod] = useState('weekly'); // 'weekly' or 'monthly'
  const [workoutPeriod, setWorkoutPeriod] = useState('weekly'); // 'weekly' or 'monthly'
  const [expandedExercises, setExpandedExercises] = useState({});
  const [imageErrors, setImageErrors] = useState({});

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

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { text: 'Niedowaga', color: '#2563eb' };
    if (bmi < 25) return { text: 'Normalna', color: '#16a34a' };
    if (bmi < 30) return { text: 'Nadwaga', color: '#ca8a04' };
    return { text: 'Otyłość', color: '#dc2626' };
  };

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
    return workoutHistory.filter(workout => new Date(workout.date) >= cutoffDate);
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
        exercise.sets?.forEach(set => {
          if (set.completed) {
            exerciseMap[exercise.name].allSets.push({
              ...set,
              workoutDate: workout.date,
              workoutTitle: workout.title
            });
          }
        });
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
      </View>

      {/* Personal Records */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trophy" size={20} color="#facc15" />
          <Text style={styles.sectionTitle}>Rekordy osobiste</Text>
        </View>

        <View style={styles.recordsList}>
          {userStats.records.map((record, idx) => (
            <View key={idx} style={styles.recordCard}>
              <View style={styles.recordInfo}>
                <Text style={styles.recordExercise}>{record.exercise}</Text>
                <Text style={styles.recordLabel}>Najlepszy wynik</Text>
              </View>

              <View style={styles.recordValueContainer}>
                {editingField === `record-${idx}` ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.recordEditInput}
                      value={tempValue}
                      onChangeText={setTempValue}
                      keyboardType="decimal-pad"
                      autoFocus
                      onBlur={() => {
                        updateRecord(idx, tempValue);
                        setEditingField(null);
                      }}
                    />
                    <Text style={styles.recordUnit}>kg</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => startEdit(`record-${idx}`, record.weight)}
                    style={styles.recordValueButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.recordValue}>{record.weight}</Text>
                    <Text style={styles.recordUnit}>kg</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
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
                <View>
                  <Text style={styles.workoutTitle}>{workout.title}</Text>
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
                  const completedSets = ex.sets?.filter(s => s.completed).length || 0;
                  return (
                    <Text key={exIdx} style={styles.workoutExerciseItem}>
                      • {ex.name} ({completedSets} serii)
                    </Text>
                  );
                })}
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
  },
  workoutExerciseItem: {
    fontSize: 14,
    color: '#4b5563',
  },
});

export default StatsPage;
