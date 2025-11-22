import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import storage from './utils/storage';
import { preloadWithMinDuration } from './services/preloadService';
import SplashScreen from './components/SplashScreen';
import StatsPage from './components/screens/StatsPage';
import ProfilePage from './components/screens/ProfilePage';
import SavedWorkoutsPage from './components/screens/SavedWorkoutsPage';
import LibraryPage from './components/screens/LibraryPage';
import LandingPage from './components/screens/LandingPage';
import MuscleGroupSelector from './components/screens/MuscleGroupSelector';
import GeneratedWorkout from './components/workout/GeneratedWorkout';
import CustomWorkoutBuilder from './components/workout/CustomWorkoutBuilder';
import ActiveWorkout from './components/workout/ActiveWorkout';
import { normalizeWorkout, getLocalISOString } from './utils/workoutHelpers';
import { TRAINING_TYPES } from './components/data/exercisesData';

function App() {
  // Splash screen states
  const [isAppReady, setIsAppReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Inicjalizacja...');

  const [currentTab, setCurrentTab] = useState('calendar');
  const [planScreen, setPlanScreen] = useState('landing');
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [targetDate, setTargetDate] = useState(null);
  const [preloadedWorkout, setPreloadedWorkout] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState(null);
  const [userStats, setUserStats] = useState({
    weight: 70,
    height: 175,
    bmi: 22.9,
    weightHistory: [], // Historia pomiarów wagi: { date: ISO string, weight: number }
    records: [
      { exercise: 'Bench Press', weight: 80 },
      { exercise: 'Squat', weight: 120 },
      { exercise: 'Deadlift', weight: 140 }
    ]
  });

  const scrollViewRef = useRef(null);
  const isLoadedRef = useRef(false); // Flag to prevent saving before loading

  // Initialize app with preloading
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      if (__DEV__) console.log('[APP] 🚀 Initializing app with preloading...');

      // Progress callback for splash screen
      const onProgress = (progress, message) => {
        setLoadingProgress(progress);
        setLoadingMessage(message);
      };

      // Preload API data with splash screen
      const preloadResults = await preloadWithMinDuration(onProgress);

      if (__DEV__) {
        console.log('[APP] 📊 Preload results:', {
          success: preloadResults.success,
          loadTime: preloadResults.loadTime,
          errors: preloadResults.errors.length,
        });
      }

      // Load local data
      await loadData();

      // Mark app as ready
      setIsAppReady(true);
      if (__DEV__) console.log('[APP] ✅ App initialization complete');

    } catch (error) {
      if (__DEV__) console.error('[APP] ❌ Initialization failed:', error);
      // Even if preload fails, still show the app
      setIsAppReady(true);
    }
  };

  // Timer dla aktywnego treningu
  useEffect(() => {
    if (!workoutStartTime || isPaused) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - workoutStartTime - totalPausedTime;
      setElapsedTime(Math.floor(elapsed / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [workoutStartTime, isPaused, totalPausedTime]);

  const loadData = async () => {
    try {
      if (__DEV__) console.log('🔍 Loading data from storage...');
      const savedWorkoutsData = await storage.getItem('savedWorkouts');
      const workoutHistoryData = await storage.getItem('workoutHistory');
      const targetDateData = await storage.getItem('selectedTargetDate');
      const userStatsData = await storage.getItem('userStats');

      if (__DEV__) console.log('📦 Loaded data:', {
        savedWorkouts: savedWorkoutsData ? 'found' : 'empty',
        workoutHistory: workoutHistoryData ? 'found' : 'empty',
        targetDate: targetDateData ? 'found' : 'empty',
        userStats: userStatsData ? 'found' : 'empty'
      });

      if (savedWorkoutsData) {
        const parsed = JSON.parse(savedWorkoutsData);
        // Filter out null/invalid workouts
        const validWorkouts = Array.isArray(parsed) ? parsed.filter(w => w && w.title && w.exercises) : [];
        setSavedWorkouts(validWorkouts);
      }
      if (workoutHistoryData) {
        const parsed = JSON.parse(workoutHistoryData);
        // Filter out null/invalid workouts
        const validHistory = Array.isArray(parsed) ? parsed.filter(w => w && w.title && w.exercises) : [];
        setWorkoutHistory(validHistory);
      }
      if (targetDateData) setTargetDate(targetDateData);
      if (userStatsData) setUserStats(JSON.parse(userStatsData));

      // Mark as loaded to enable saving
      isLoadedRef.current = true;

      if (__DEV__) console.log('✅ Data loaded, auto-save enabled');
    } catch (error) {
      if (__DEV__) console.error('❌ Error loading data:', error);
      isLoadedRef.current = true; // Enable saving even on error
    }
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  }, [currentTab, planScreen]);

  useEffect(() => {
    if (!isLoadedRef.current) return; // Don't save until data is loaded
    if (__DEV__) console.log('💾 Saving savedWorkouts:', savedWorkouts.length, 'workouts');
    storage.setItem('savedWorkouts', JSON.stringify(savedWorkouts));
  }, [savedWorkouts]);

  useEffect(() => {
    if (!isLoadedRef.current) return; // Don't save until data is loaded
    if (__DEV__) console.log('💾 Saving workoutHistory:', workoutHistory.length, 'workouts');
    storage.setItem('workoutHistory', JSON.stringify(workoutHistory));
  }, [workoutHistory]);

  useEffect(() => {
    if (!isLoadedRef.current) return; // Don't save until data is loaded
    if (targetDate) {
      storage.setItem('selectedTargetDate', targetDate);
    } else {
      storage.removeItem('selectedTargetDate');
    }
  }, [targetDate]);

  useEffect(() => {
    if (!isLoadedRef.current) return; // Don't save until data is loaded
    if (__DEV__) console.log('💾 Saving userStats:', userStats);
    storage.setItem('userStats', JSON.stringify(userStats));
  }, [userStats]);

  const handleSaveWorkout = (workout) => {
    const rawWorkout = {
      id: Date.now(),
      ...workout,
      savedAt: getLocalISOString()
    };
    const normalized = normalizeWorkout(rawWorkout);
    setSavedWorkouts(prev => [normalized, ...prev]);
  };

  const handleSaveCompletedWorkoutAsTemplate = (completedWorkout) => {
    // Validate input
    if (!completedWorkout || !completedWorkout.title || !completedWorkout.exercises) {
      return { success: false, message: 'Nieprawidłowe dane treningu' };
    }

    // Check if a workout with the same title and exercises already exists
    const alreadyExists = savedWorkouts.some(saved =>
      saved &&
      saved.title === completedWorkout.title &&
      saved.exercises &&
      saved.exercises.length === completedWorkout.exercises.length &&
      saved.exercises.every((ex, idx) =>
        ex && ex.name === completedWorkout.exercises[idx]?.name
      )
    );

    if (alreadyExists) {
      return { success: false, message: 'Ten trening jest już zapisany' };
    }

    // Convert completed workout to template format
    const template = {
      id: Date.now(),
      title: completedWorkout.title,
      type: completedWorkout.type || 'custom',
      exercises: completedWorkout.exercises.map(ex => ({
        name: ex.name,
        category: ex.category,
        image: ex.image,
        description: ex.description || '',
        tips: ex.tips || '',
        labels: ex.labels || [],
        // Convert sets to template format (number or keep structure without completed status)
        sets: Array.isArray(ex.sets)
          ? ex.sets.map(set => ({
              weight: set.weight || '',
              reps: set.reps || '',
              completed: false
            }))
          : (typeof ex.sets === 'number' ? ex.sets : 3)
      })),
      savedAt: getLocalISOString(),
      metadata: {
        isFavorite: false
      }
    };

    const normalized = normalizeWorkout(template);
    setSavedWorkouts(prev => [normalized, ...prev]);
    return { success: true, message: 'Trening zapisany!' };
  };

  const isWorkoutSavedAsTemplate = (completedWorkout) => {
    // Validate input
    if (!completedWorkout || !completedWorkout.title || !completedWorkout.exercises) {
      return false;
    }

    return savedWorkouts.some(saved =>
      saved &&
      saved.title === completedWorkout.title &&
      saved.exercises &&
      saved.exercises.length === completedWorkout.exercises.length &&
      saved.exercises.every((ex, idx) =>
        ex && ex.name === completedWorkout.exercises[idx]?.name
      )
    );
  };

  const handleRemoveCompletedWorkoutAsTemplate = (completedWorkout) => {
    // Validate input
    if (!completedWorkout || !completedWorkout.title || !completedWorkout.exercises) {
      return { success: false, message: 'Nieprawidłowe dane treningu' };
    }

    // Find and remove the matching workout
    const updatedWorkouts = savedWorkouts.filter(saved =>
      !(saved &&
        saved.title === completedWorkout.title &&
        saved.exercises &&
        saved.exercises.length === completedWorkout.exercises.length &&
        saved.exercises.every((ex, idx) =>
          ex && ex.name === completedWorkout.exercises[idx]?.name
        ))
    );

    if (updatedWorkouts.length === savedWorkouts.length) {
      return { success: false, message: 'Trening nie został znaleziony' };
    }

    setSavedWorkouts(updatedWorkouts);
    return { success: true, message: 'Trening usunięty z zapisanych' };
  };

  const handleDeleteWorkout = (workoutId) => {
    if (__DEV__) console.log('🗑️ Deleting workout with ID:', workoutId);
    setSavedWorkouts(prev => {
      const filtered = prev.filter(w => w.id !== workoutId);
      if (__DEV__) console.log('📊 Workouts before:', prev.length, 'after:', filtered.length);
      return filtered;
    });
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
      storage.setItem('workoutHistory', JSON.stringify(updated));
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
    setIsPaused(false);
    setTotalPausedTime(0);
    setElapsedTime(0);
    setPauseStartTime(null);
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
    // Jeśli użytkownik klika kalendarz podczas aktywnego treningu,
    // przekieruj go na ekran aktywnego treningu zamiast kalendarza
    if (tab === 'calendar' && activeWorkout && workoutStartTime) {
      setCurrentTab('workout-active');
      return;
    }

    setCurrentTab(tab);
    if (tab === 'calendar') {
      setPlanScreen('landing');
      setPreloadedWorkout(null);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          onSaveCompletedWorkoutAsTemplate={handleSaveCompletedWorkoutAsTemplate}
          onRemoveCompletedWorkoutAsTemplate={handleRemoveCompletedWorkoutAsTemplate}
          isWorkoutSavedAsTemplate={isWorkoutSavedAsTemplate}
          isPaused={false}
          setIsPaused={() => {}}
          totalPausedTime={0}
          setTotalPausedTime={() => {}}
          elapsedTime={0}
          setElapsedTime={() => {}}
          pauseStartTime={null}
          setPauseStartTime={() => {}}
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
          onSaveCompletedWorkoutAsTemplate={handleSaveCompletedWorkoutAsTemplate}
          onRemoveCompletedWorkoutAsTemplate={handleRemoveCompletedWorkoutAsTemplate}
          isWorkoutSavedAsTemplate={isWorkoutSavedAsTemplate}
          isPaused={isPaused}
          setIsPaused={setIsPaused}
          totalPausedTime={totalPausedTime}
          setTotalPausedTime={setTotalPausedTime}
          elapsedTime={elapsedTime}
          setElapsedTime={setElapsedTime}
          pauseStartTime={pauseStartTime}
          setPauseStartTime={setPauseStartTime}
        />
      );
    }

    if (currentTab === 'statistics') {
      return (
        <StatsPage
          userStats={userStats}
          setUserStats={setUserStats}
          workoutHistory={workoutHistory}
          onSaveCompletedWorkoutAsTemplate={handleSaveCompletedWorkoutAsTemplate}
          onRemoveCompletedWorkoutAsTemplate={handleRemoveCompletedWorkoutAsTemplate}
          isWorkoutSavedAsTemplate={isWorkoutSavedAsTemplate}
        />
      );
    }

    if (currentTab === 'library') {
      return <LibraryPage />;
    }

    if (currentTab === 'profile') {
      return (
        <ProfilePage
          userStats={userStats}
          workoutHistory={workoutHistory}
          onUpdateUserStats={setUserStats}
        />
      );
    }

    if (currentTab === 'saved') {
      return (
        <SavedWorkoutsPage
          savedWorkouts={savedWorkouts}
          onDeleteWorkout={handleDeleteWorkout}
          onBeginWorkout={handleStartFromSaved}
          onUpdateWorkout={handleUpdateWorkout}
          onScheduleWorkout={handleScheduleWorkout}
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

  // Show splash screen while app is loading
  if (!isAppReady) {
    return (
      <SplashScreen
        progress={loadingProgress}
        message={loadingMessage}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Render library tab without ScrollView to avoid VirtualizedList nesting */}
      {currentTab === 'library' ? (
        renderContent()
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {renderContent()}
        </ScrollView>
      )}

      <View style={styles.bottomNav}>
        {/* Library Tab - Leftmost */}
        <TouchableOpacity
          onPress={() => handleTabChange('library')}
          style={styles.navButton}
        >
          <Ionicons
            name="library-outline"
            size={24}
            color={currentTab === 'library' ? '#9333ea' : '#9ca3af'}
          />
          <Text style={[
            styles.navText,
            currentTab === 'library' && styles.navTextActive
          ]}>
            Biblioteka
          </Text>
        </TouchableOpacity>

        {/* Saved Tab */}
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

        {/* Calendar Tab - Middle, Larger */}
        <TouchableOpacity
          onPress={() => handleTabChange('calendar')}
          style={styles.navButtonLarge}
        >
          {activeWorkout && workoutStartTime ? (
            // Aktywny trening - pokaż timer
            <>
              <View style={styles.activeWorkoutIndicator}>
                <Ionicons
                  name="fitness-outline"
                  size={28}
                  color="#9333ea"
                />
              </View>
              <Text style={[
                styles.navText,
                styles.navTextActive,
                styles.timerText
              ]}>
                {formatTime(elapsedTime)}
              </Text>
            </>
          ) : (
            // Normalny przycisk kalendarza
            <>
              <Ionicons
                name="calendar-outline"
                size={28}
                color={currentTab === 'calendar' ? '#9333ea' : '#9ca3af'}
              />
              <Text style={[
                styles.navText,
                currentTab === 'calendar' && styles.navTextActive
              ]}>
                Kalendarz
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Statistics Tab - Renamed from Body */}
        <TouchableOpacity
          onPress={() => handleTabChange('statistics')}
          style={styles.navButton}
        >
          <Ionicons
            name="stats-chart-outline"
            size={24}
            color={currentTab === 'statistics' ? '#9333ea' : '#9ca3af'}
          />
          <Text style={[
            styles.navText,
            currentTab === 'statistics' && styles.navTextActive
          ]}>
            Statystyki
          </Text>
        </TouchableOpacity>

        {/* Profile Tab - Rightmost */}
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
  navButtonLarge: {
    flex: 1.3,
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
  activeWorkoutIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pausedIndicator: {
    fontSize: 10,
    color: '#f59e0b',
    fontWeight: '600',
    marginTop: 2,
  },
});

export default App;