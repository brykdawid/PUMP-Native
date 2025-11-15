import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getExercises } from '../../utils/apiHelpers';
import { TRAINING_TYPES } from '../data/exercisesData';
import ExerciseCard from '../workout/ExerciseCard';
import GifModal from '../workout/GifModal';
import storage, { alertDialog } from '../../utils/storage';

const ITEMS_PER_PAGE = 20;

function LibraryPage() {
  const [allExercises, setAllExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [displayedExercises, setDisplayedExercises] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('klatka');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
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
      alertDialog('Błąd', 'Nie udało się załadować ćwiczeń');
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

  const toggleFavorite = useCallback((exerciseId) => {
    const newFavorites = favorites.includes(exerciseId)
      ? favorites.filter(id => id !== exerciseId)
      : [...favorites, exerciseId];
    saveFavorites(newFavorites);
  }, [favorites]);

  useEffect(() => {
    filterExercises();
  }, [selectedCategory, searchQuery, allExercises]);

  useEffect(() => {
    // Reset pagination when filters change
    setCurrentPage(1);
    loadPage(1, filteredExercises);
  }, [filteredExercises]);

  const filterExercises = () => {
    let filtered = allExercises;

    // Filter by category
    filtered = filtered.filter(ex => {
      const categories = Array.isArray(ex.category) ? ex.category : [ex.category];
      return categories.some(cat =>
        cat.toLowerCase() === selectedCategory.toLowerCase()
      );
    });

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

  const loadPage = (page, exercises = filteredExercises) => {
    const startIndex = 0;
    const endIndex = page * ITEMS_PER_PAGE;
    const paginatedData = exercises.slice(startIndex, endIndex);
    setDisplayedExercises(paginatedData);
  };

  const loadMore = () => {
    if (loadingMore || displayedExercises.length >= filteredExercises.length) {
      return;
    }

    setLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);

    setTimeout(() => {
      loadPage(nextPage);
      setLoadingMore(false);
    }, 300); // Small delay for better UX
  };

  const getCategoryCount = (categoryId) => {
    return allExercises.filter(ex => {
      const categories = Array.isArray(ex.category) ? ex.category : [ex.category];
      return categories.some(cat =>
        cat.toLowerCase() === categoryId.toLowerCase()
      );
    }).length;
  };

  const handleImageClick = useCallback((exercise) => {
    setSelectedExercise(exercise);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedExercise(null);
  }, []);

  const handleToggleFavoriteModal = useCallback(() => {
    if (selectedExercise) {
      toggleFavorite(selectedExercise.id || selectedExercise.name);
    }
  }, [selectedExercise, toggleFavorite]);

  const isFavoriteSelected = useMemo(() => {
    return selectedExercise ? favorites.includes(selectedExercise.id || selectedExercise.name) : false;
  }, [selectedExercise, favorites]);

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
      <FlatList
        data={displayedExercises}
        keyExtractor={(item, index) => `${item.id || item.name}-${index}`}
        renderItem={({ item, index }) => {
          const uniqueId = `${item.id || item.name}-${index}`;
          return (
            <ExerciseCard
              exercise={item}
              exerciseId={uniqueId}
              onToggle={() => handleImageClick(item)}
              onFavorite={() => toggleFavorite(item.id || item.name)}
              isFavorite={favorites.includes(item.id || item.name)}
            />
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Nie znaleziono ćwiczeń' : 'Brak ćwiczeń w tej kategorii'}
            </Text>
          </View>
        )}
        ListFooterComponent={() => {
          if (displayedExercises.length >= filteredExercises.length) {
            return displayedExercises.length > 0 ? (
              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>
                  Wszystkie ćwiczenia załadowane ({displayedExercises.length})
                </Text>
              </View>
            ) : null;
          }

          if (loadingMore) {
            return (
              <View style={styles.footerContainer}>
                <ActivityIndicator size="small" color="#9333ea" />
              </View>
            );
          }

          return (
            <TouchableOpacity onPress={loadMore} style={styles.loadMoreButton}>
              <Text style={styles.loadMoreText}>
                Załaduj więcej ({displayedExercises.length} z {filteredExercises.length})
              </Text>
              <Ionicons name="chevron-down" size={16} color="#9333ea" />
            </TouchableOpacity>
          );
        }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        style={styles.exerciseList}
      />

      <GifModal
        exercise={selectedExercise}
        onClose={closeModal}
        onToggleFavorite={handleToggleFavoriteModal}
        isFavorite={isFavoriteSelected}
      />
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
  footerContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginVertical: 16,
    marginHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9333ea',
  },
});

export default LibraryPage;
