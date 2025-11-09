import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

function MuscleGroupSelector({ onBack, onStartWorkout, TRAINING_TYPES }) {
  console.log('MuscleGroupSelector render');
  console.log('TRAINING_TYPES:', TRAINING_TYPES);
  
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [categoryImages, setCategoryImages] = useState({});

  useEffect(() => {
    // Pobierz reprezentatywne zdjęcie dla każdej kategorii
    const fetchCategoryImages = async () => {
      const images = {};
      
      for (const type of TRAINING_TYPES) {
        try {
          const response = await fetch(`http://localhost:5000/api/exercises?categories=${type.id}`);
          if (response.ok) {
            const exercises = await response.json();
            if (exercises.length > 0) {
              // Weź pierwsze ćwiczenie jako reprezentatywne zdjęcie
              images[type.id] = exercises[0].image;
            }
          }
        } catch (error) {
          console.error(`Error fetching image for ${type.id}:`, error);
        }
      }
      
      setCategoryImages(images);
    };

    fetchCategoryImages();
  }, [TRAINING_TYPES]);

  const toggleGroup = (groupId) => {
    console.log('Toggle group:', groupId);
    
    // Jeśli kliknięto fullbody, zaznacz wszystkie grupy
    if (groupId === 'fullbody') {
      const allGroups = TRAINING_TYPES
        .filter(type => type.id !== 'fullbody')
        .map(type => type.id);
      
      // Jeśli fullbody już był zaznaczony, odznacz wszystko
      if (selectedGroups.length === allGroups.length) {
        setSelectedGroups([]);
      } else {
        // Zaznacz wszystkie grupy
        setSelectedGroups(allGroups);
      }
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
  };

  const handleContinue = () => {
    console.log('Continue with groups:', selectedGroups);
    if (selectedGroups.length === 0) {
      alert('Wybierz przynajmniej jedną grupę mięśniową');
      return;
    }
    onStartWorkout(selectedGroups);
  };

  const isFullBodySelected = () => {
    const allGroups = TRAINING_TYPES
      .filter(type => type.id !== 'fullbody')
      .map(type => type.id);
    return selectedGroups.length === allGroups.length;
  };

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
              ? isFullBodySelected() 
              : selectedGroups.includes(type.id);
            
            return (
              <TouchableOpacity
                key={type.id}
                onPress={() => toggleGroup(type.id)}
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
                
                {categoryImages[type.id] ? (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: categoryImages[type.id] }}
                      style={styles.muscleImage}
                      resizeMode="cover"
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