import React, { useState, useEffect, useRef, memo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ExerciseCard from './ExerciseCard';

function ExerciseSearchModal({
  visible,
  onClose,
  exercises,
  onAddExercise,
  onImageClick,
  isExerciseInPlan,
  title = 'Dodaj ćwiczenie',
  placeholder = 'Szukaj ćwiczeń...',
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      // Auto-focus on search input when modal opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      // Clear search when modal closes
      setSearchQuery('');
    }
  }, [visible]);

  const filteredExercises = searchQuery.length === 0 ? [] : exercises.filter(exercise => {
    if (!exercise || !exercise.name) return false;
    const query = searchQuery.toLowerCase();
    return exercise.name.toLowerCase().includes(query) ||
           exercise.description?.toLowerCase().includes(query);
  }).slice(0, 50); // Limit to 50 results

  const handleExercisePress = (exercise) => {
    onAddExercise(exercise);
    // Don't close modal automatically - let the parent handle it
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            autoFocus={true}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Results */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {searchQuery.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="search" size={64} color="#e5e7eb" />
              <Text style={styles.emptyStateTitle}>Wyszukaj ćwiczenia</Text>
              <Text style={styles.emptyStateText}>
                Zacznij wpisywać nazwę ćwiczenia aby zobaczyć wyniki
              </Text>
            </View>
          ) : filteredExercises.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="sad-outline" size={64} color="#e5e7eb" />
              <Text style={styles.emptyStateTitle}>Brak wyników</Text>
              <Text style={styles.emptyStateText}>
                Nie znaleziono ćwiczeń dla "{searchQuery}"
              </Text>
            </View>
          ) : (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsCount}>
                Znaleziono {filteredExercises.length} {filteredExercises.length === 1 ? 'ćwiczenie' : 'ćwiczeń'}
              </Text>
              {filteredExercises.map((exercise, idx) => {
                const { inPlan, groupName } = isExerciseInPlan
                  ? isExerciseInPlan(exercise.name)
                  : { inPlan: false, groupName: null };

                return (
                  <View
                    key={`search-modal-${exercise.name}-${idx}`}
                    style={[
                      styles.exerciseItem,
                      inPlan && styles.exerciseItemInPlan
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
                        onToggle={() => onImageClick(exercise)}
                        onAdd={() => handleExercisePress(exercise)}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20 || 40,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
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
  clearButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  exerciseItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    position: 'relative',
  },
  exerciseItemInPlan: {
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

export default memo(ExerciseSearchModal);
