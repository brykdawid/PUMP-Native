import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = (SCREEN_WIDTH - 32) / 7; // 7 dni w tygodniu, 16px padding z każdej strony

const MONTHS_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

const DAYS_SHORT_PL = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

function CalendarTab({ workoutHistory, onGoToPlan }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStartDate, setWeekStartDate] = useState(getWeekStart(new Date()));

  // Pobierz poniedziałek dla danego dnia
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Jeśli niedziela (0), cofnij o 6 dni
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

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

  // Wygeneruj dni miesiąca dla widoku kalendarza
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Pierwszy dzień miesiąca
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Poniedziałek = 0

    // Ostatni dzień miesiąca
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const days = [];

    // Puste komórki przed pierwszym dniem miesiąca
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    // Dni miesiąca
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentDate]);

  // Sprawdź czy dany dzień ma ukończony trening
  const hasWorkoutOnDate = (date) => {
    if (!date) return false;
    const dateStr = formatDateToISO(date);
    return workoutHistory.some(workout => {
      if (!workout.date) return false;
      const workoutDateStr = workout.date.split('T')[0]; // Weź tylko część z datą (YYYY-MM-DD)
      return workoutDateStr === dateStr;
    });
  };

  // Format daty do ISO (YYYY-MM-DD)
  const formatDateToISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

  // Nawigacja miesiąca
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  // Nawigacja tygodnia
  const goToPreviousWeek = () => {
    const newWeekStart = new Date(weekStartDate);
    newWeekStart.setDate(weekStartDate.getDate() - 7);
    setWeekStartDate(newWeekStart);
  };

  const goToNextWeek = () => {
    const newWeekStart = new Date(weekStartDate);
    newWeekStart.setDate(weekStartDate.getDate() + 7);
    setWeekStartDate(newWeekStart);
  };

  // Obsługa wyboru dnia w week slider
  const handleWeekDayPress = (date) => {
    setSelectedDate(date);
    setCurrentDate(date); // Synchronizuj miesiąc kalendarza
  };

  // Obsługa wyboru dnia w kalendarzu miesięcznym
  const handleMonthDayPress = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setWeekStartDate(getWeekStart(date)); // Synchronizuj week slider
  };

  // Obsługa przycisku "Zaplanuj trening"
  const handlePlanWorkout = () => {
    if (onGoToPlan) {
      onGoToPlan(formatDateToISO(selectedDate));
    }
  };

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

      <ScrollView style={styles.scrollContainer}>
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
                    hasWorkout && styles.weekDayWithWorkout,
                  ]}>
                    <Text style={[
                      styles.weekDayNumber,
                      (isTodayDate || isSelectedDate || hasWorkout) && styles.weekDayNumberActive,
                    ]}>
                      {date.getDate()}
                    </Text>
                  </View>
                  {hasWorkout && !isSelectedDate && (
                    <View style={styles.workoutDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Kalendarz miesięczny */}
        <View style={styles.monthCalendarContainer}>
          <Text style={styles.sectionTitle}>Kalendarz treningów</Text>

          {/* Nagłówki dni tygodnia */}
          <View style={styles.calendarHeader}>
            {DAYS_SHORT_PL.map((day, index) => (
              <View key={index} style={styles.calendarHeaderDay}>
                <Text style={styles.calendarHeaderText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Siatka dni */}
          <View style={styles.calendarGrid}>
            {monthDays.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.calendarDay} />;
              }

              const hasWorkout = hasWorkoutOnDate(date);
              const isTodayDate = isToday(date);
              const isSelectedDate = isSelected(date);

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.calendarDay}
                  onPress={() => handleMonthDayPress(date)}
                >
                  <View style={[
                    styles.calendarDayCircle,
                    isTodayDate && styles.calendarDayToday,
                    isSelectedDate && styles.calendarDaySelected,
                    hasWorkout && styles.calendarDayWithWorkout,
                  ]}>
                    <Text style={[
                      styles.calendarDayNumber,
                      (isTodayDate || isSelectedDate) && styles.calendarDayNumberActive,
                      hasWorkout && !isSelectedDate && styles.calendarDayNumberWorkout,
                    ]}>
                      {date.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Informacja o wybranym dniu */}
        <View style={styles.selectedDateInfo}>
          <Text style={styles.selectedDateText}>
            Wybrana data: {selectedDate.toLocaleDateString('pl-PL', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>

          {hasWorkoutOnDate(selectedDate) ? (
            <View style={styles.workoutCompletedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.workoutCompletedText}>Trening ukończony</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.planWorkoutButton}
              onPress={handlePlanWorkout}
            >
              <LinearGradient
                colors={['#9333ea', '#7c3aed']}
                style={styles.planWorkoutGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.planWorkoutText}>Zaplanuj trening</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
  },
  weekDayItem: {
    alignItems: 'center',
    width: DAY_WIDTH,
  },
  weekDayLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  weekDayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  weekDayToday: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#fbbf24',
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
  workoutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginTop: 4,
  },
  monthCalendarContainer: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarHeaderDay: {
    width: DAY_WIDTH,
    alignItems: 'center',
  },
  calendarHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: DAY_WIDTH,
    height: DAY_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  calendarDayCircle: {
    width: DAY_WIDTH - 8,
    height: DAY_WIDTH - 8,
    borderRadius: (DAY_WIDTH - 8) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  calendarDayToday: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  calendarDaySelected: {
    backgroundColor: '#9333ea',
  },
  calendarDayWithWorkout: {
    backgroundColor: '#d1fae5',
  },
  calendarDayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  calendarDayNumberActive: {
    color: '#fff',
    fontWeight: '700',
  },
  calendarDayNumberWorkout: {
    color: '#10b981',
    fontWeight: '700',
  },
  selectedDateInfo: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  workoutCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  workoutCompletedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
  },
  planWorkoutButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  planWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  planWorkoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default CalendarTab;
