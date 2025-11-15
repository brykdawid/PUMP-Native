import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getExercises } from '../../utils/apiHelpers';
import { getLocalISOString } from '../../utils/workoutHelpers';
import { confirmDialog, alertDialog } from '../../utils/storage';
import GifModal from './GifModal';

const MONTHS_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

const DAYS_SHORT_PL = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

function CalendarTab({ workoutHistory, setWorkoutHistory, onGoToPlan, onBeginWorkout, onSaveWorkout, onSaveCompletedWorkoutAsTemplate, onRemoveCompletedWorkoutAsTemplate, isWorkoutSavedAsTemplate }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStartDate, setWeekStartDate] = useState(getWeekStart(new Date()));
  const [selectedWorkoutForView, setSelectedWorkoutForView] = useState(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [allExercises, setAllExercises] = useState([]);
  const [selectedGifExercise, setSelectedGifExercise] = useState(null);

  // Pobierz poniedziałek dla danego dnia
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Jeśli niedziela (0), cofnij o 6 dni
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Załaduj ćwiczenia z API
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

  // Wygeneruj 7 dni tygodnia od poniedziałku
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() + i);
      days.push(date);
    }
    return days;
  }, [weekStartDate]);

  // Format daty do ISO (YYYY-MM-DD)
  const formatDateToISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Sprawdź czy dany dzień ma trening (ukończony lub zaplanowany)
  const hasWorkoutOnDate = (date) => {
    if (!date) return false;
    const dateStr = formatDateToISO(date);
    return workoutHistory.some(workout => {
      if (!workout.date) return false;
      const workoutDateStr = workout.date.split('T')[0]; // Weź tylko część z datą (YYYY-MM-DD)
      return workoutDateStr === dateStr;
    });
  };

  // Pobierz treningi dla wybranego dnia
  const selectedDayWorkouts = useMemo(() => {
    const dateStr = formatDateToISO(selectedDate);
    return workoutHistory.filter(workout => {
      if (!workout.date) return false;
      const workoutDateStr = workout.date.split('T')[0];
      return workoutDateStr === dateStr;
    });
  }, [selectedDate, workoutHistory]);

  // Sprawdź czy data jest dzisiaj
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Sprawdź czy data jest wybrana
  const isSelected = (date) => {
    if (!date) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  // Sprawdź czy zaplanowany trening można już rozpocząć (data treningu <= dzisiaj)
  const canStartScheduledWorkout = (workoutDate) => {
    if (!workoutDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scheduled = new Date(workoutDate.split('T')[0] + 'T00:00:00');
    return scheduled <= today;
  };

  // Nawigacja miesiąca
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
    setWeekStartDate(getWeekStart(newDate));
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
    setWeekStartDate(getWeekStart(newDate));
  };

  // Nawigacja tygodnia
  const goToPreviousWeek = () => {
    const newWeekStart = new Date(weekStartDate);
    newWeekStart.setDate(weekStartDate.getDate() - 7);
    setWeekStartDate(newWeekStart);
    setCurrentDate(newWeekStart); // Aktualizuj miesiąc
  };

  const goToNextWeek = () => {
    const newWeekStart = new Date(weekStartDate);
    newWeekStart.setDate(weekStartDate.getDate() + 7);
    setWeekStartDate(newWeekStart);
    setCurrentDate(newWeekStart); // Aktualizuj miesiąc
  };

  // Obsługa wyboru dnia w week slider
  const handleWeekDayPress = (date) => {
    setSelectedDate(date);
  };

  // Obsługa przycisku "Dodaj trening"
  const handleAddWorkout = () => {
    if (onGoToPlan) {
      onGoToPlan(formatDateToISO(selectedDate));
    }
  };

  // Obsługa podglądu treningu
  const handleViewWorkout = (workout) => {
    setSelectedWorkoutForView(workout);
    setShowWorkoutModal(true);
  };

  // Obsługa rozpoczęcia zaplanowanego treningu
  const handleStartScheduledWorkout = (workout) => {
    if (!onBeginWorkout) return;

    // Przygotuj dane treningu do rozpoczęcia
    // Przekazujemy ID zaplanowanego treningu aby później go zaktualizować zamiast tworzyć nowy
    const workoutData = {
      scheduledWorkoutId: workout.id, // ID zaplanowanego treningu do aktualizacji
      type: workout.type || 'generated',
      exercises: workout.exercises || [],
      categories: workout.categories || [],
      title: workout.title || workout.name || 'Trening'
    };

    // Rozpocznij trening natychmiast
    onBeginWorkout(workoutData, workout.date, true);
  };

  // Znajdź pełne dane ćwiczenia z API
  const getExerciseDetails = (exerciseName) => {
    return allExercises.find(ex => ex.name === exerciseName) || null;
  };

  // Zapisywanie treningu do zakładki zapisane (toggle - dodaj lub usuń)
  const handleSaveCompletedWorkout = () => {
    if (!selectedWorkoutForView) return;

    // Check if workout is already saved
    const isSaved = isWorkoutSavedAsTemplate && isWorkoutSavedAsTemplate(selectedWorkoutForView);

    if (isSaved) {
      // Remove from saved workouts
      if (onRemoveCompletedWorkoutAsTemplate) {
        const result = onRemoveCompletedWorkoutAsTemplate(selectedWorkoutForView);
        if (result.success) {
          alertDialog('Sukces', result.message);
        } else {
          alertDialog('Błąd', result.message);
        }
      }
    } else {
      // Add to saved workouts
      if (onSaveCompletedWorkoutAsTemplate) {
        const result = onSaveCompletedWorkoutAsTemplate(selectedWorkoutForView);
        if (result.success) {
          alertDialog('Sukces', result.message);
        } else {
          alertDialog('Informacja', result.message);
        }
      } else if (onSaveWorkout) {
        // Fallback to old method
        const workoutToSave = {
          id: Date.now(),
          title: selectedWorkoutForView.title || 'Trening',
          type: selectedWorkoutForView.type || 'custom',
          exercises: selectedWorkoutForView.exercises || [],
          date: formatDateToISO(selectedDate),
          savedAt: getLocalISOString()
        };
        onSaveWorkout(workoutToSave);
        alertDialog('Sukces', 'Trening został zapisany w zakładce Zapisane!');
      }
    }
  };

  // Usuwanie treningu z kalendarza
  const handleDeleteWorkout = (workout) => {
    console.log('🗑️ Calendar: Attempting to delete workout', workout.id);
    confirmDialog(
      'Usuń trening',
      'Czy na pewno chcesz usunąć ten trening z kalendarza?',
      () => {
        console.log('✅ Calendar: User confirmed deletion');
        if (setWorkoutHistory) {
          setWorkoutHistory(prev => {
            const filtered = prev.filter(w => w.id !== workout.id);
            console.log('📊 Calendar: Workouts before:', prev.length, 'after:', filtered.length);
            return filtered;
          });
        } else {
          console.error('❌ Calendar: setWorkoutHistory is not defined');
        }
      },
      () => {
        console.log('❌ Calendar: User cancelled deletion');
      }
    );
  };

  // Formatuj czas treningu
  const formatDuration = (seconds) => {
    if (!seconds) return '0 min';
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;

    if (hrs > 0) {
      return `${hrs}h ${remainingMins}min`;
    }
    return `${mins} min`;
  };

  // Oblicz całkowitą liczbę powtórzeń z ukończonych serii
  const calculateTotalReps = (workout) => {
    if (!workout || !workout.exercises) return 0;

    let totalReps = 0;
    workout.exercises.forEach(exercise => {
      if (Array.isArray(exercise.sets)) {
        exercise.sets.forEach(set => {
          if (set.completed && set.reps) {
            const reps = parseFloat(set.reps) || 0;
            totalReps += reps;
          }
        });
      }
    });

    return totalReps;
  };

  // Memoized callbacks for GifModal
  const handleCloseGifModal = useCallback(() => {
    setSelectedGifExercise(null);
  }, []);

  const handleToggleFavoriteGifModal = useCallback(() => {
    // No-op for calendar view
  }, []);

  return (
    <View style={styles.container}>
      {/* Header z miesiącem i rokiem */}
      <LinearGradient
        colors={['#9333ea', '#7c3aed']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.monthNavigation}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.monthYearText}>
            {MONTHS_PL[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>

          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Week Slider */}
        <View style={styles.weekSliderContainer}>
          <View style={styles.weekNavigation}>
            <TouchableOpacity onPress={goToPreviousWeek} style={styles.weekNavButton}>
              <Ionicons name="chevron-back" size={20} color="#9333ea" />
            </TouchableOpacity>

            <Text style={styles.weekLabel}>Tydzień</Text>

            <TouchableOpacity onPress={goToNextWeek} style={styles.weekNavButton}>
              <Ionicons name="chevron-forward" size={20} color="#9333ea" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDaysContainer}>
            {weekDays.map((date, index) => {
              const hasWorkout = hasWorkoutOnDate(date);
              const isTodayDate = isToday(date);
              const isSelectedDate = isSelected(date);

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.weekDayItem}
                  onPress={() => handleWeekDayPress(date)}
                >
                  <Text style={styles.weekDayLabel}>{DAYS_SHORT_PL[index]}</Text>
                  <View style={[
                    styles.weekDayCircle,
                    isTodayDate && styles.weekDayToday,
                    isSelectedDate && styles.weekDaySelected,
                    hasWorkout && !isSelectedDate && styles.weekDayWithWorkout,
                  ]}>
                    <Text style={[
                      styles.weekDayNumber,
                      (isTodayDate || isSelectedDate) && styles.weekDayNumberActive,
                      hasWorkout && !isSelectedDate && styles.weekDayNumberWorkout,
                    ]}>
                      {date.getDate()}
                    </Text>
                  </View>
                  <View style={[
                    styles.workoutDot,
                    (!hasWorkout || isSelectedDate) && styles.workoutDotHidden
                  ]} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Informacja o wybranym dniu */}
        <View style={styles.selectedDateHeader}>
          <Text style={styles.selectedDateText}>
            {selectedDate.toLocaleDateString('pl-PL', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        {/* Lista treningów lub przycisk dodaj */}
        {selectedDayWorkouts.length === 0 ? (
          // Brak treningów - pokaż przycisk "Dodaj Trening"
          <View style={styles.emptyStateContainer}>
            <Ionicons name="fitness-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>Brak treningów</Text>
            <Text style={styles.emptyStateSubtitle}>
              Zaplanuj trening na ten dzień
            </Text>

            <TouchableOpacity
              style={styles.addWorkoutButton}
              onPress={handleAddWorkout}
            >
              <LinearGradient
                colors={['#9333ea', '#7c3aed']}
                style={styles.addWorkoutGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.addWorkoutText}>Dodaj Trening</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          // Lista treningów
          <View style={styles.workoutListContainer}>
            {selectedDayWorkouts.map((workout, index) => {
              const isSaved = isWorkoutSavedAsTemplate && isWorkoutSavedAsTemplate(workout);

              return (
                <View key={index} style={styles.workoutCard}>
                  {/* Badge ze statusem w prawym górnym rogu */}
                  {workout.scheduled ? (
                    <View style={[styles.statusBadge, styles.statusBadgeAbsolute]}>
                      <Text style={styles.statusBadgeTextScheduled}>Zaplanowany</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, styles.statusBadgeCompleted, styles.statusBadgeAbsolute]}>
                      <Text style={styles.statusBadgeTextCompleted}>Ukończony</Text>
                    </View>
                  )}

                  <View style={styles.workoutCardHeader}>
                    <View style={styles.workoutTitleRow}>
                      <Ionicons
                        name={workout.scheduled ? "calendar" : "checkmark-circle"}
                        size={24}
                        color={workout.scheduled ? "#f59e0b" : "#10b981"}
                      />
                      <View style={styles.workoutTitleContainer}>
                        <View style={styles.titleWithStar}>
                          <Text style={styles.workoutTitle} numberOfLines={1} ellipsizeMode="tail">
                            {workout.title || workout.name || 'Trening'}
                          </Text>
                          {isSaved && (
                            <Ionicons name="star" size={16} color="#facc15" style={styles.savedStar} />
                          )}
                        </View>
                        <View style={styles.workoutTypeBadgeContainer}>
                          {workout.type === 'generated' ? (
                            <View style={styles.aiPoweredBadge}>
                              <Ionicons name="sparkles" size={12} color="#9333ea" />
                              <Text style={styles.aiPoweredText}>AI Powered</Text>
                            </View>
                          ) : (
                            <View style={styles.customBadge}>
                              <Ionicons name="construct" size={12} color="#0891b2" />
                              <Text style={styles.customText}>Custom</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                  {/* Dla ukończonych treningów: wyświetl czas, KG i powtórzenia */}
                  {!workout.scheduled && (
                    <View style={styles.completedWorkoutStats}>
                      {workout.duration && (
                        <View style={styles.statRow}>
                          <Ionicons name="time-outline" size={16} color="#6b7280" />
                          <Text style={styles.statText}>
                            {formatDuration(workout.duration)}
                          </Text>
                        </View>
                      )}

                      {workout.totalVolume > 0 && (
                        <View style={styles.statRow}>
                          <Ionicons name="barbell-outline" size={16} color="#6b7280" />
                          <Text style={styles.statText}>
                            {workout.totalVolume.toLocaleString()} kg
                          </Text>
                        </View>
                      )}

                      {calculateTotalReps(workout) > 0 && (
                        <View style={styles.statRow}>
                          <Ionicons name="refresh-outline" size={16} color="#6b7280" />
                          <Text style={styles.statText}>
                            {calculateTotalReps(workout)} powtórzeń
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Ilość ćwiczeń - dla wszystkich treningów */}
                {workout.exercises && workout.exercises.length > 0 && (
                  <View style={styles.exercisesSummary}>
                    <Text style={styles.exercisesCount}>
                      {workout.exercises.length} {workout.exercises.length === 1 ? 'ćwiczenie' : 'ćwiczeń'}
                    </Text>

                    {/* Lista ćwiczeń - tylko dla zaplanowanych lub jeśli chcemy pokazać nazwy */}
                    {!workout.scheduled && (
                      <View style={styles.exercisesList}>
                        {workout.exercises.slice(0, 3).map((exercise, idx) => (
                          <View key={idx} style={styles.exerciseTag}>
                            <Text style={styles.exerciseTagText} numberOfLines={1}>
                              {exercise.name}
                            </Text>
                          </View>
                        ))}
                        {workout.exercises.length > 3 && (
                          <View style={styles.exerciseTag}>
                            <Text style={styles.exerciseTagText}>
                              +{workout.exercises.length - 3}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.workoutActions}>
                  {/* Przycisk "Rozpocznij" dla zaplanowanych treningów, których data już nadeszła */}
                  {workout.scheduled && canStartScheduledWorkout(workout.date) && (
                    <TouchableOpacity
                      onPress={() => handleStartScheduledWorkout(workout)}
                      style={styles.startButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="play-circle" size={18} color="#16a34a" />
                      <Text style={styles.startButtonText}>Rozpocznij</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => handleViewWorkout(workout)}
                    style={styles.previewButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="eye-outline" size={18} color="#9333ea" />
                    <Text style={styles.previewButtonText}>Podgląd</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteWorkout(workout)}
                    style={styles.deleteButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
              );
            })}

            {/* Przycisk dodawania kolejnego treningu */}
            <TouchableOpacity
              style={styles.addAnotherWorkoutButton}
              onPress={handleAddWorkout}
            >
              <LinearGradient
                colors={['#9333ea', '#7c3aed']}
                style={styles.addWorkoutGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.addWorkoutText}>Dodaj Kolejny Trening</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal podglądu zakończonego treningu */}
      <Modal
        visible={showWorkoutModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.workoutModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitle}>
                  {selectedWorkoutForView?.title || 'Szczegóły treningu'}
                </Text>
                <TouchableOpacity
                  onPress={handleSaveCompletedWorkout}
                  style={styles.starButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isWorkoutSavedAsTemplate && isWorkoutSavedAsTemplate(selectedWorkoutForView) ? "star" : "star-outline"}
                    size={24}
                    color={isWorkoutSavedAsTemplate && isWorkoutSavedAsTemplate(selectedWorkoutForView) ? "#fbbf24" : "#9ca3af"}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => setShowWorkoutModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Info o czasie */}
              {selectedWorkoutForView?.duration && (
                <View style={styles.modalInfoCard}>
                  <Ionicons name="time-outline" size={20} color="#9333ea" />
                  <Text style={styles.modalInfoText}>
                    Czas treningu: {formatDuration(selectedWorkoutForView.duration)}
                  </Text>
                </View>
              )}

              {/* Lista ćwiczeń */}
              <Text style={styles.exercisesHeader}>Ćwiczenia</Text>
              {selectedWorkoutForView?.exercises?.map((exercise, idx) => {
                const exerciseDetails = getExerciseDetails(exercise.name);

                return (
                  <View key={idx} style={styles.modalExerciseCard}>
                    <View style={styles.exerciseRow}>
                      {/* Mały obrazek ćwiczenia */}
                      {exerciseDetails?.image && (
                        <TouchableOpacity
                          onPress={() => setSelectedGifExercise(exerciseDetails)}
                          style={styles.exerciseThumbnail}
                          activeOpacity={0.8}
                        >
                          <Image
                            source={{ uri: exerciseDetails.image }}
                            style={styles.thumbnailImage}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}

                      <View style={styles.exerciseInfo}>
                        <Text style={styles.modalExerciseName}>{exercise.name}</Text>

                        {/* Serie - różne wyświetlanie dla zaplanowanych i ukończonych treningów */}
                        {exercise.sets && (
                          <View style={styles.modalSetsContainer}>
                            {Array.isArray(exercise.sets) ? (
                              // Ukończony trening - szczegóły każdej serii
                              exercise.sets.map((set, setIdx) => (
                                <View key={setIdx} style={styles.modalSetRow}>
                                  <Text style={styles.modalSetNumber}>{setIdx + 1}.</Text>
                                  <Text style={styles.modalSetDetails}>
                                    {set.weight || '—'} kg × {set.reps || '—'} powtórzeń
                                  </Text>
                                  {set.completed && (
                                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                                  )}
                                </View>
                              ))
                            ) : (
                              // Zaplanowany trening - pokaż ilość serii i powtórzeń
                              <View style={styles.modalSetRow}>
                                <Text style={styles.modalSetDetails}>
                                  {typeof exercise.sets === 'string'
                                    ? exercise.sets
                                    : `${exercise.sets} ${exercise.sets === 1 ? 'seria' : 'serie'} × ${exercise.reps || '—'} powtórzeń`
                                  }
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Przycisk zapisz */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={handleSaveCompletedWorkout}
                style={styles.saveWorkoutButton}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#9333ea', '#7c3aed']}
                  style={styles.saveWorkoutGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="bookmark" size={20} color="#fff" />
                  <Text style={styles.saveWorkoutText}>Zapisz Trening</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* GifModal do animacji ćwiczeń */}
      <GifModal
        exercise={selectedGifExercise}
        onClose={handleCloseGifModal}
        onToggleFavorite={handleToggleFavoriteGifModal}
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
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  weekSliderContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekNavButton: {
    padding: 4,
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  weekDayItem: {
    alignItems: 'center',
    flex: 1,
  },
  weekDayLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 6,
  },
  weekDayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  weekDayToday: {
    backgroundColor: '#0891b2',
    borderWidth: 2,
    borderColor: '#0e7490',
  },
  weekDaySelected: {
    backgroundColor: '#9333ea',
  },
  weekDayWithWorkout: {
    backgroundColor: '#d1fae5',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  weekDayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  weekDayNumberActive: {
    color: '#fff',
  },
  weekDayNumberWorkout: {
    color: '#10b981',
    fontWeight: '700',
  },
  workoutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginTop: 4,
  },
  workoutDotHidden: {
    opacity: 0,
  },
  selectedDateHeader: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textTransform: 'capitalize',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 24,
  },
  addWorkoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '80%',
  },
  addAnotherWorkoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  addWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  addWorkoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  workoutListContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  workoutCard: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutCardHeader: {
    marginBottom: 12,
  },
  workoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutTitleContainer: {
    marginLeft: 12,
    flex: 1,
    paddingRight: 100,
  },
  titleWithStar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  savedStar: {
    marginLeft: 4,
  },
  workoutType: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  workoutTypeBadgeContainer: {
    marginTop: 6,
  },
  aiPoweredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d8b4fe',
    alignSelf: 'flex-start',
  },
  aiPoweredText: {
    color: '#9333ea',
    fontSize: 11,
    fontWeight: '700',
  },
  customBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#cffafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#67e8f9',
    alignSelf: 'flex-start',
  },
  customText: {
    color: '#0891b2',
    fontSize: 11,
    fontWeight: '700',
  },
  workoutDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  durationText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  completedWorkoutStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  exercisesSummary: {
    marginBottom: 12,
  },
  exercisesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  exercisesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exerciseTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: '45%',
  },
  exerciseTagText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  workoutActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fef3c7',
  },
  statusBadgeAbsolute: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  statusBadgeCompleted: {
    backgroundColor: '#d1fae5',
  },
  statusBadgeTextScheduled: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f59e0b',
  },
  statusBadgeTextCompleted: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3e8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8b4fe',
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9333ea',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  workoutModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  starButton: {
    padding: 4,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flexGrow: 0,
    flexShrink: 1,
  },
  modalContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  modalInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b21a8',
  },
  exercisesHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  modalExerciseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exerciseRow: {
    flexDirection: 'row',
    gap: 12,
  },
  exerciseThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
    flexShrink: 0,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  exerciseInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  modalExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalSetsContainer: {
    gap: 4,
  },
  modalSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalSetNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#9333ea',
    width: 20,
  },
  modalSetDetails: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveWorkoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  saveWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveWorkoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default CalendarTab;
