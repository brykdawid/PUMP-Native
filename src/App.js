import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import StatsPage from './components/screens/StatsPage';
import ProfilePage from './components/screens/ProfilePage';
import SavedWorkoutsPage from './components/screens/SavedWorkoutsPage';
import LandingPage from './components/screens/LandingPage';
import MuscleGroupSelector from './components/screens/MuscleGroupSelector';
import GeneratedWorkout from './components/workout/GeneratedWorkout';
import CustomWorkoutBuilder from './components/workout/CustomWorkoutBuilder';
import ActiveWorkout from './components/workout/ActiveWorkout';
import { normalizeWorkout } from './utils/workoutHelpers';
import { TRAINING_TYPES } from './components/data/exercisesData';

function App() {
  const [currentTab, setCurrentTab] = useState('calendar');
  const [planScreen, setPlanScreen] = useState('landing');
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [targetDate, setTargetDate] = useState(null);
  const [preloadedWorkout, setPreloadedWorkout] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [userStats, setUserStats] = useState({
    weight: 70,
    height: 175,
    bmi: 22.9,
    records: [
      { exercise: 'Bench Press', weight: 80 },
      { exercise: 'Squat', weight: 120 },
      { exercise: 'Deadlift', weight: 140 }
    ]
  });

  const scrollViewRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedWorkoutsData = await AsyncStorage.getItem('savedWorkouts');
      const workoutHistoryData = await AsyncStorage.getItem('workoutHistory');
      const targetDateData = await AsyncStorage.getItem('selectedTargetDate');
      const userStatsData = await AsyncStorage.getItem('userStats');

      if (savedWorkoutsData) setSavedWorkouts(JSON.parse(savedWorkoutsData));
      if (workoutHistoryData) setWorkoutHistory(JSON.parse(workoutHistoryData));
      if (targetDateData) setTargetDate(targetDateData);
      if (userStatsData) setUserStats(JSON.parse(userStatsData));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  }, [currentTab, planScreen]);

  useEffect(() => {
    AsyncStorage.setItem('savedWorkouts', JSON.stringify(savedWorkouts));
  }, [savedWorkouts]);

  useEffect(() => {
    AsyncStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
  }, [workoutHistory]);

  useEffect(() => {
    if (targetDate) {
      AsyncStorage.setItem('selectedTargetDate', targetDate);
    } else {
      AsyncStorage.removeItem('selectedTargetDate');
    }
  }, [targetDate]);

  useEffect(() => {
    AsyncStorage.setItem('userStats', JSON.stringify(userStats));
  }, [userStats]);

  const handleSaveWorkout = (workout) => {
    const rawWorkout = {
      id: Date.now(),
      ...workout,
      savedAt: new Date().toISOString()
    };
    const normalized = normalizeWorkout(rawWorkout);
    setSavedWorkouts(prev => [normalized, ...prev]);
  };

  const handleDeleteWorkout = (workoutId) => {
    setSavedWorkouts(prev => prev.filter(w => w.id !== workoutId));
  };

  const handleUpdateWorkout = (workoutId, updates) => {
    setSavedWorkouts(prev => prev.map(w => 
      w.id === workoutId ? { ...w, ...updates } : w
    ));
  };

  const handleStartFromSaved = (workoutData) => {
    setPreloadedWorkout(workoutData);
    setPlanScreen('custom-workout');
    setCurrentTab('workout-builder');
  };

  const handleSelectMode = (mode) => {
    if (mode === 'generated') {
      setPlanScreen('muscle-selector');
    } else if (mode === 'custom') {
      setPreloadedWorkout(null);
      setPlanScreen('custom-workout');
    }
  };

  const handleSelectMuscleGroups = (groups) => {
    setSelectedMuscleGroups(groups);
    setPlanScreen('generated-workout');
  };

  const handleBackToLanding = () => {
    setPlanScreen('landing');
    setSelectedMuscleGroups([]);
    setPreloadedWorkout(null);
  };

  const handleBackToSelector = () => {
    setPlanScreen('muscle-selector');
  };

  const handleScheduleWorkout = (workoutData) => {
    const existingWorkout = workoutHistory.find(w => w.id === workoutData.id);
    if (existingWorkout) {
      return;
    }
    
    setWorkoutHistory(prev => {
      const updated = [...prev, workoutData];
      AsyncStorage.setItem('workoutHistory', JSON.stringify(updated));
      return updated;
    });
    
    setPlanScreen('landing');
    setSelectedMuscleGroups([]);
    setPreloadedWorkout(null);
    setTargetDate(null);
    setCurrentTab('calendar');
  };

  const handleBeginWorkout = (workoutData, selectedDate = null, startImmediately = false) => {
    if (workoutData) {
      setActiveWorkout(workoutData);
      setTargetDate(selectedDate);
      
      if (startImmediately) {
        setWorkoutStartTime(Date.now());
        setCurrentTab('workout-active');
      } else {
        setWorkoutStartTime(null);
      }
    }
  };

  const handleEndWorkout = () => {
    setActiveWorkout(null);
    setWorkoutStartTime(null);
    setTargetDate(null);
    setCurrentTab('calendar');
  };

  const handleGoToPlan = (selectedDate = null) => {
    setTargetDate(selectedDate);
    setPlanScreen('landing');
    setSelectedMuscleGroups([]);
    setPreloadedWorkout(null);
    setCurrentTab('workout-builder');
  };

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    if (tab === 'calendar') {
      setActiveWorkout(null);
      setWorkoutStartTime(null);
      setPlanScreen('landing');
      setPreloadedWorkout(null);
    }
  };

  const renderContent = () => {
    if (currentTab === 'calendar') {
      return (
        <ActiveWorkout
          activeWorkout={null}
          workoutStartTime={null}
          targetDate={targetDate}
          onEndWorkout={handleEndWorkout}
          onGoToPlan={handleGoToPlan}
          onBeginWorkout={handleBeginWorkout}
          workoutHistory={workoutHistory}
          setWorkoutHistory={setWorkoutHistory}
          onSaveWorkout={handleSaveWorkout}
        />
      );
    }

    if (currentTab === 'workout-active') {
      return (
        <ActiveWorkout
          activeWorkout={activeWorkout}
          workoutStartTime={workoutStartTime}
          targetDate={targetDate}
          onEndWorkout={handleEndWorkout}
          onGoToPlan={handleGoToPlan}
          onBeginWorkout={handleBeginWorkout}
          workoutHistory={workoutHistory}
          setWorkoutHistory={setWorkoutHistory}
        />
      );
    }

    if (currentTab === 'body') {
      return (
        <StatsPage 
          userStats={userStats} 
          setUserStats={setUserStats}
        />
      );
    }

    if (currentTab === 'profile') {
      return <ProfilePage />;
    }

    if (currentTab === 'saved') {
      return (
        <SavedWorkoutsPage 
          savedWorkouts={savedWorkouts}
          onDeleteWorkout={handleDeleteWorkout}
          onBeginWorkout={handleStartFromSaved}
          onUpdateWorkout={handleUpdateWorkout}
        />
      );
    }

    if (currentTab === 'workout-builder') {
      if (planScreen === 'landing') {
        return (
          <LandingPage 
            onSelectMode={handleSelectMode}
            targetDate={targetDate}
          />
        );
      }

      if (planScreen === 'muscle-selector') {
        return (
          <MuscleGroupSelector
            onBack={handleBackToLanding}
            onStartWorkout={handleSelectMuscleGroups}
            TRAINING_TYPES={TRAINING_TYPES}
          />
        );
      }

      if (planScreen === 'generated-workout') {
        return (
          <GeneratedWorkout
            selectedTypes={selectedMuscleGroups}
            onBack={handleBackToSelector}
            onSaveWorkout={handleSaveWorkout}
            onBeginWorkout={handleBeginWorkout}
            targetDate={targetDate}
            onScheduleWorkout={handleScheduleWorkout}
          />
        );
      }

      if (planScreen === 'custom-workout') {
        return (
          <CustomWorkoutBuilder 
            onBack={handleBackToLanding}
            onSaveWorkout={handleSaveWorkout}
            onBeginWorkout={handleBeginWorkout}
            targetDate={targetDate}
            preloadedWorkout={preloadedWorkout}
            onScheduleWorkout={handleScheduleWorkout}
          />
        );
      }
    }

    return (
      <View style={styles.content}>
        <Text style={styles.title}>PUMP Native</Text>
        <Text style={styles.subtitle}>Aktywna zakładka: {currentTab}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {renderContent()}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          onPress={() => handleTabChange('calendar')}
          style={styles.navButton}
        >
          <Ionicons 
            name="calendar-outline" 
            size={24} 
            color={currentTab === 'calendar' || currentTab === 'workout-active' ? '#9333ea' : '#9ca3af'} 
          />
          <Text style={[
            styles.navText,
            (currentTab === 'calendar' || currentTab === 'workout-active') && styles.navTextActive
          ]}>
            Kalendarz
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange('workout-builder')}
          style={styles.navButton}
        >
          <Ionicons 
            name="barbell-outline" 
            size={24} 
            color={currentTab === 'workout-builder' ? '#9333ea' : '#9ca3af'} 
          />
          <Text style={[
            styles.navText,
            currentTab === 'workout-builder' && styles.navTextActive
          ]}>
            Trening
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange('saved')}
          style={styles.navButton}
        >
          <Ionicons 
            name="bookmark-outline" 
            size={24} 
            color={currentTab === 'saved' ? '#9333ea' : '#9ca3af'} 
          />
          <Text style={[
            styles.navText,
            currentTab === 'saved' && styles.navTextActive
          ]}>
            Zapisane
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange('body')}
          style={styles.navButton}
        >
          <Ionicons 
            name="body-outline" 
            size={24} 
            color={currentTab === 'body' ? '#9333ea' : '#9ca3af'} 
          />
          <Text style={[
            styles.navText,
            currentTab === 'body' && styles.navTextActive
          ]}>
            Ciało
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange('profile')}
          style={styles.navButton}
        >
          <Ionicons 
            name="person-outline" 
            size={24} 
            color={currentTab === 'profile' ? '#9333ea' : '#9ca3af'} 
          />
          <Text style={[
            styles.navText,
            currentTab === 'profile' && styles.navTextActive
          ]}>
            Profil
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9333ea',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 64,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
    marginTop: 4,
  },
  navTextActive: {
    color: '#9333ea',
  },
});

export default App;