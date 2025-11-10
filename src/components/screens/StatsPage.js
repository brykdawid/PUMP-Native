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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

function StatsPage({ userStats, setUserStats, workoutHistory = [] }) {
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [activeTab, setActiveTab] = useState('body'); // 'body', 'volume', 'workouts'

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
    if (bmi < 18.5) return { text: 'Underweight', color: '#2563eb' };
    if (bmi < 25) return { text: 'Normal', color: '#16a34a' };
    if (bmi < 30) return { text: 'Overweight', color: '#ca8a04' };
    return { text: 'Obese', color: '#dc2626' };
  };

  // Calculate training volume (weight × reps)
  const calculateTrainingVolume = useMemo(() => {
    console.log('=== CALCULATING TRAINING VOLUME ===');
    console.log('workoutHistory:', workoutHistory);
    console.log('workoutHistory length:', workoutHistory.length);

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    console.log('Date ranges:', { now, weekAgo, monthAgo });

    let weeklyVolume = 0;
    let monthlyVolume = 0;

    workoutHistory.forEach((workout, workoutIdx) => {
      const workoutDate = new Date(workout.date);
      console.log(`\nWorkout ${workoutIdx}:`, {
        date: workout.date,
        parsedDate: workoutDate,
        title: workout.title,
        exercisesCount: workout.exercises?.length
      });

      workout.exercises?.forEach((exercise, exIdx) => {
        console.log(`  Exercise ${exIdx}: ${exercise.name}, sets:`, exercise.sets?.length);

        exercise.sets?.forEach((set, setIdx) => {
          console.log(`    Set ${setIdx}:`, {
            weight: set.weight,
            reps: set.reps,
            completed: set.completed,
            weightParsed: parseFloat(set.weight),
            repsParsed: parseFloat(set.reps)
          });

          if (set.completed) {
            const weight = parseFloat(set.weight) || 0;
            const reps = parseFloat(set.reps) || 0;
            const volume = weight * reps;

            console.log(`    -> Volume calculated: ${volume}kg (${weight}kg × ${reps} reps)`);

            if (workoutDate >= weekAgo) {
              weeklyVolume += volume;
            }
            if (workoutDate >= monthAgo) {
              monthlyVolume += volume;
            }
          } else {
            console.log(`    -> Set not completed, skipping`);
          }
        });
      });
    });

    console.log('\n=== FINAL VOLUMES ===');
    console.log('Weekly volume:', weeklyVolume);
    console.log('Monthly volume:', monthlyVolume);

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

  const bmiCategory = getBMICategory(userStats.bmi);

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
          <Text style={styles.sectionTitle}>Body Metrics</Text>
        </View>

        <View style={styles.metricsGrid}>
          {/* Weight */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Weight</Text>
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
            <Text style={styles.metricLabel}>Height</Text>
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
          <Text style={styles.sectionTitle}>Personal Records</Text>
        </View>

        <View style={styles.recordsList}>
          {userStats.records.map((record, idx) => (
            <View key={idx} style={styles.recordCard}>
              <View style={styles.recordInfo}>
                <Text style={styles.recordExercise}>{record.exercise}</Text>
                <Text style={styles.recordLabel}>Personal best</Text>
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

  const renderTrainingVolume = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="barbell" size={20} color="#9333ea" />
        <Text style={styles.sectionTitle}>Training Volume</Text>
      </View>
      <Text style={styles.sectionDescription}>
        Total weight lifted (weight × reps)
      </Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="calendar" size={24} color="#3b82f6" />
          </View>
          <Text style={styles.statLabel}>Weekly</Text>
          <Text style={styles.statValue}>
            {calculateTrainingVolume.weekly.toLocaleString()}
          </Text>
          <Text style={styles.statUnit}>kg</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="calendar-outline" size={24} color="#8b5cf6" />
          </View>
          <Text style={styles.statLabel}>Monthly</Text>
          <Text style={styles.statValue}>
            {calculateTrainingVolume.monthly.toLocaleString()}
          </Text>
          <Text style={styles.statUnit}>kg</Text>
        </View>
      </View>
    </View>
  );

  const renderWorkoutCount = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="checkmark-done" size={20} color="#16a34a" />
        <Text style={styles.sectionTitle}>Completed Workouts</Text>
      </View>
      <Text style={styles.sectionDescription}>
        Total number of completed training sessions
      </Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="flame" size={24} color="#f59e0b" />
          </View>
          <Text style={styles.statLabel}>Weekly</Text>
          <Text style={styles.statValue}>
            {calculateWorkoutCount.weekly}
          </Text>
          <Text style={styles.statUnit}>workouts</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="trophy" size={24} color="#facc15" />
          </View>
          <Text style={styles.statLabel}>Monthly</Text>
          <Text style={styles.statValue}>
            {calculateWorkoutCount.monthly}
          </Text>
          <Text style={styles.statUnit}>workouts</Text>
        </View>
      </View>
    </View>
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
          <Text style={styles.subtitle}>Your Stats</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {renderTabButton('body', 'body', 'Body')}
          {renderTabButton('volume', 'barbell', 'Volume')}
          {renderTabButton('workouts', 'fitness', 'Workouts')}
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
});

export default StatsPage;
