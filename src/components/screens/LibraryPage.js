import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getExercises } from '../../utils/apiHelpers';
import { TRAINING_TYPES } from '../data/exercisesData';
import ExerciseCard from '../workout/ExerciseCard';
import storage from '../../utils/storage';

function LibraryPage() {
  const [allExercises, setAllExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadExercises(), loadFavorites()]);
  };

  const loadExercises = async () => {
    try {
      setLoading(true);
      const data = await getExercises();
      setAllExercises(data);
      setFilteredExercises(data);
    } catch (error) {
      console.error('Error loading exercises:', error);
      Alert.alert('Błąd', 'Nie udało się załadować ćwiczeń');
      setAllExercises([]);
      setFilteredExercises([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const saved = await storage.getItem('favoriteExercises');
      if (saved) setFavorites(JSON.parse(saved));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      await storage.setItem('favoriteExercises', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const toggleFavorite = (exerciseId) => {
    const newFavorites = favorites.includes(exerciseId)
      ? favorites.filter(id => id !== exerciseId)
      : [...favorites, exerciseId];
    saveFavorites(newFavorites);
  };

  useEffect(() => {
    filterExercises();
  }, [selectedCategory, searchQuery, allExercises]);

  const filterExercises = () => {
    let filtered = allExercises;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ex => {
        const categories = Array.isArray(ex.category) ? ex.category : [ex.category];
        return categories.some(cat =>
          cat.toLowerCase() === selectedCategory.toLowerCase()
        );
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(query) ||
        (ex.description && ex.description.toLowerCase().includes(query))
      );
    }

    setFilteredExercises(filtered);
  };

  const getCategoryCount = (categoryId) => {
    if (categoryId === 'all') return allExercises.length;

    return allExercises.filter(ex => {
      const categories = Array.isArray(ex.category) ? ex.category : [ex.category];
      return categories.some(cat =>
        cat.toLowerCase() === categoryId.toLowerCase()
      );
    }).length;
  };

  const handleToggleExpand = (exerciseId) => {
    setExpandedExercise(expandedExercise === exerciseId ? null : exerciseId);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9333ea" />
        <Text style={styles.loadingText}>Ładowanie biblioteki ćwiczeń...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Biblioteka Ćwiczeń</Text>
        <Text style={styles.headerSubtitle}>
          {filteredExercises.length} {filteredExercises.length === 1 ? 'ćwiczenie' : 'ćwiczeń'}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj ćwiczenia..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === 'all' && styles.categoryButtonActive
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === 'all' && styles.categoryButtonTextActive
          ]}>
            Wszystkie ({getCategoryCount('all')})
          </Text>
        </TouchableOpacity>

        {TRAINING_TYPES.filter(type => type.id !== 'fullbody').map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.categoryButton,
              selectedCategory === type.id && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(type.id)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === type.id && styles.categoryButtonTextActive
            ]}>
              {type.name} ({getCategoryCount(type.id)})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Exercise List */}
      <ScrollView style={styles.exerciseList}>
        {filteredExercises.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Nie znaleziono ćwiczeń' : 'Brak ćwiczeń w tej kategorii'}
            </Text>
          </View>
        ) : (
          filteredExercises.map((exercise, index) => {
            const uniqueId = `${exercise.id || exercise.name}-${index}`;
            return (
              <ExerciseCard
                key={uniqueId}
                exercise={exercise}
                exerciseId={uniqueId}
                isExpanded={expandedExercise === uniqueId}
                onToggle={() => handleToggleExpand(uniqueId)}
                onFavorite={() => toggleFavorite(exercise.id || exercise.name)}
                isFavorite={favorites.includes(exercise.id || exercise.name)}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
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
  categoryScroll: {
    maxHeight: 50,
    marginBottom: 8,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#9333ea',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  exerciseList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default LibraryPage;
