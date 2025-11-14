import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { alertDialog } from '../../utils/storage';

// Skeleton loader z animacją shimmer
const SkeletonLoader = () => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={[styles.skeletonContainer, { opacity }]}>
      <View style={styles.skeletonImage} />
    </Animated.View>
  );
};

// Zmemoizowany komponent karty mięśni dla lepszej wydajności
const MuscleCard = React.memo(({ type, isSelected, onPress, imageUri, isLoading }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.muscleCard,
        isSelected && styles.muscleCardSelected
      ]}
      activeOpacity={0.7}
    >
      {isSelected && (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
        </View>
      )}

      {isLoading ? (
        <SkeletonLoader />
      ) : imageUri ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.muscleImage}
            resizeMode="cover"
            // Optymalizacje dla lepszej wydajności
            fadeDuration={100}
            progressiveRenderingEnabled={true}
          />
        </View>
      ) : (
        <Text style={styles.muscleEmoji}>💪</Text>
      )}

      <Text style={[
        styles.muscleName,
        isSelected && styles.muscleNameSelected
      ]}>
        {type.name}
      </Text>
    </TouchableOpacity>
  );
});

MuscleCard.displayName = 'MuscleCard';

function MuscleGroupSelector({ onBack, onStartWorkout, TRAINING_TYPES }) {
  console.log('MuscleGroupSelector render');
  console.log('TRAINING_TYPES:', TRAINING_TYPES);

  const [selectedGroups, setSelectedGroups] = useState([]);
  const [categoryImages, setCategoryImages] = useState({});
  const [loadingImages, setLoadingImages] = useState(new Set());

  useEffect(() => {
    // Pobierz reprezentatywne zdjęcie dla każdej kategorii - równolegle dla lepszej wydajności
    const fetchCategoryImages = async () => {
      // Zaznacz wszystkie jako ładujące się
      const allIds = new Set(TRAINING_TYPES.map(t => t.id));
      setLoadingImages(allIds);

      // Pobierz wszystkie obrazki równolegle
      TRAINING_TYPES.forEach(async (type) => {
        try {
          const response = await fetch(
            `http://localhost:5000/api/exercises?categories=${type.id}&limit=1`,
            {
              // Dodaj timeout dla szybszego failover
              signal: AbortSignal.timeout(5000),
            }
          );

          if (response.ok) {
            const exercises = await response.json();
            if (exercises.length > 0) {
              // Aktualizuj obrazek natychmiast po załadowaniu
              setCategoryImages(prev => ({
                ...prev,
                [type.id]: exercises[0].image
              }));

              // Usuń z listy ładujących się
              setLoadingImages(prev => {
                const next = new Set(prev);
                next.delete(type.id);
                return next;
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching image for ${type.id}:`, error);
          // Usuń z listy ładujących się nawet przy błędzie
          setLoadingImages(prev => {
            const next = new Set(prev);
            next.delete(type.id);
            return next;
          });
        }
      });
    };

    fetchCategoryImages();
  }, [TRAINING_TYPES]);

  // Prefetch obrazków dla lepszej wydajności
  useEffect(() => {
    Object.values(categoryImages).forEach(imageUri => {
      if (imageUri) {
        Image.prefetch(imageUri).catch(err => {
          console.log('Image prefetch failed:', err);
        });
      }
    });
  }, [categoryImages]);

  // Zmemoizowana funkcja sprawdzania czy fullbody jest zaznaczone
  const isFullBodySelected = useMemo(() => {
    const allGroups = TRAINING_TYPES
      .filter(type => type.id !== 'fullbody')
      .map(type => type.id);
    return selectedGroups.length === allGroups.length;
  }, [selectedGroups, TRAINING_TYPES]);

  // useCallback zapobiega re-renderom komponentów potomnych
  const toggleGroup = useCallback((groupId) => {
    console.log('Toggle group:', groupId);

    // Jeśli kliknięto fullbody, zaznacz wszystkie grupy
    if (groupId === 'fullbody') {
      const allGroups = TRAINING_TYPES
        .filter(type => type.id !== 'fullbody')
        .map(type => type.id);

      // Jeśli fullbody już był zaznaczony, odznacz wszystko
      setSelectedGroups(prev => {
        if (prev.length === allGroups.length) {
          return [];
        } else {
          return allGroups;
        }
      });
      return;
    }

    // Standardowe przełączanie dla pojedynczych grup
    setSelectedGroups(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  }, [TRAINING_TYPES]);

  const handleContinue = useCallback(() => {
    console.log('Continue with groups:', selectedGroups);
    if (selectedGroups.length === 0) {
      alertDialog('Uwaga', 'Wybierz przynajmniej jedną grupę mięśniową');
      return;
    }
    onStartWorkout(selectedGroups);
  }, [selectedGroups, onStartWorkout]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#9333ea" />
          <Text style={styles.backButtonText}>Wróć</Text>
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Text style={styles.title}>Wybierz Partie Mięśniowe</Text>
          <Text style={styles.subtitle}>
            Wybierz grupy mięśniowe które chcesz trenować
          </Text>
        </View>

        <View style={styles.muscleGrid}>
          {TRAINING_TYPES.map(type => {
            const isSelected = type.id === 'fullbody'
              ? isFullBodySelected
              : selectedGroups.includes(type.id);

            return (
              <MuscleCard
                key={type.id}
                type={type}
                isSelected={isSelected}
                onPress={() => toggleGroup(type.id)}
                imageUri={categoryImages[type.id]}
                isLoading={loadingImages.has(type.id)}
              />
            );
          })}
        </View>

        {selectedGroups.length > 0 && (
          <View style={styles.selectedContainer}>
            <Text style={styles.selectedTitle}>
              Wybrane: {selectedGroups.length} {selectedGroups.length === 1 ? 'grupa' : 'grup'}
            </Text>
            <TouchableOpacity
              onPress={handleContinue}
              style={styles.continueButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#16a34a', '#15803d']}
                style={styles.continueGradient}
              >
                <Text style={styles.continueText}>Dalej</Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 120,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  backButtonText: {
    color: '#9333ea',
    fontSize: 16,
    fontWeight: '500',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  muscleCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    minHeight: 160,
  },
  muscleCardSelected: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#f3f4f6',
  },
  muscleImage: {
    width: '100%',
    height: '100%',
  },
  skeletonContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
  },
  muscleEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  muscleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  muscleNameSelected: {
    color: '#16a34a',
  },
  selectedContainer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  selectedTitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  continueText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MuscleGroupSelector;