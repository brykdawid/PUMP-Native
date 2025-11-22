// PLIK: components/ProfilePage.js - React Native

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Modal,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import storage, { alertDialog } from '../../utils/storage';

function ProfilePage({ userStats, workoutHistory, onUpdateUserStats }) {
  const [profileImage, setProfileImage] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    birthDate: '',
    gender: '',
    goal: '',
    targetWeight: '',
    experienceLevel: '',
    weeklyWorkouts: '3-4',
    workoutDuration: '60',
    equipment: 'gym',
    units: 'metric',
    language: 'pl',
    notifications: true
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEditField, setCurrentEditField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);

  const isLoadedRef = useRef(false);

  // Load profile data from storage on mount
  useEffect(() => {
    loadProfileData();
  }, []);

  // Save profile image to storage whenever it changes
  useEffect(() => {
    if (!isLoadedRef.current) return;
    if (profileImage !== null) {
      if (__DEV__) console.log('💾 Saving profile image to storage');
      storage.setItem('profileImage', profileImage);
    }
  }, [profileImage]);

  // Save profile data whenever it changes
  useEffect(() => {
    if (!isLoadedRef.current) return;
    if (__DEV__) console.log('💾 Saving profile data to storage');
    storage.setItem('profileData', JSON.stringify(profileData));
  }, [profileData]);

  const loadProfileData = async () => {
    try {
      if (__DEV__) console.log('🔍 Loading profile data from storage...');
      const savedImage = await storage.getItem('profileImage');
      const savedData = await storage.getItem('profileData');

      if (savedImage) {
        setProfileImage(savedImage);
      }
      if (savedData) {
        setProfileData(JSON.parse(savedData));
      }

      isLoadedRef.current = true;
      if (__DEV__) console.log('✅ Profile data loaded, auto-save enabled');
    } catch (error) {
      if (__DEV__) console.error('❌ Error loading profile data:', error);
      isLoadedRef.current = true;
    }
  };

  const handleImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        alertDialog('Brak uprawnień', 'Musisz zezwolić na dostęp do zdjęć');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;

        if (uri.startsWith('blob:') || uri.startsWith('http')) {
          if (__DEV__) console.log('🔄 Converting image to base64 for web storage...');
          try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const reader = new FileReader();

            reader.onloadend = () => {
              const base64data = reader.result;
              setProfileImage(base64data);
            };

            reader.readAsDataURL(blob);
          } catch (conversionError) {
            if (__DEV__) console.error('❌ Error converting image:', conversionError);
            setProfileImage(uri);
          }
        } else {
          setProfileImage(uri);
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Error picking image:', error);
      alertDialog('Błąd', 'Nie udało się wybrać zdjęcia');
    }
  };

  const openEditModal = (field, currentValue) => {
    setCurrentEditField(field);
    setTempValue(currentValue || '');
    setEditModalVisible(true);
  };

  const saveEdit = () => {
    if (currentEditField) {
      setProfileData({ ...profileData, [currentEditField]: tempValue });
    }
    setEditModalVisible(false);
    setCurrentEditField(null);
    setTempValue('');
  };

  const calculateAge = () => {
    if (!profileData.birthDate) return null;
    const birth = new Date(profileData.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? age : null;
  };

  const calculateWorkoutStreak = () => {
    if (!workoutHistory || workoutHistory.length === 0) return 0;

    const sortedHistory = [...workoutHistory]
      .filter(w => w.date && !w.scheduled)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sortedHistory.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedHistory.length; i++) {
      const workoutDate = new Date(sortedHistory[i].date);
      workoutDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today - workoutDate) / (1000 * 60 * 60 * 24));

      if (i === 0 && daysDiff > 1) {
        break; // Seria przerwana
      }

      if (i === 0) {
        streak = 1;
      } else {
        const prevWorkoutDate = new Date(sortedHistory[i - 1].date);
        prevWorkoutDate.setHours(0, 0, 0, 0);
        const prevDaysDiff = Math.floor((prevWorkoutDate - workoutDate) / (1000 * 60 * 60 * 24));

        if (prevDaysDiff === 1) {
          streak++;
        } else {
          break;
        }
      }
    }

    return streak;
  };

  const getTotalWorkoutTime = () => {
    if (!workoutHistory || workoutHistory.length === 0) return 0;
    return workoutHistory
      .filter(w => !w.scheduled && w.duration)
      .reduce((sum, w) => sum + (w.duration || 0), 0);
  };

  const getTopRecords = () => {
    if (!userStats || !userStats.records) return [];
    return [...userStats.records]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);
  };

  const handleResetData = async () => {
    try {
      if (__DEV__) console.log('🗑️ Resetowanie wszystkich danych aplikacji...');

      // Usuń wszystkie klucze storage
      await storage.removeItem('profileData');
      await storage.removeItem('profileImage');
      await storage.removeItem('userStats');
      await storage.removeItem('workoutHistory');
      await storage.removeItem('savedWorkouts');
      await storage.removeItem('favoriteExercises');
      await storage.removeItem('selectedTargetDate');

      if (__DEV__) console.log('✅ Wszystkie dane zostały usunięte');

      // Zresetuj lokalny stan
      setProfileData({
        name: '',
        birthDate: '',
        gender: '',
        goal: '',
        targetWeight: '',
        experienceLevel: '',
        weeklyWorkouts: '3-4',
        workoutDuration: '60',
        equipment: 'gym',
        units: 'metric',
        language: 'pl',
        notifications: true
      });
      setProfileImage(null);

      // Zamknij modal i pokaż komunikat
      setResetModalVisible(false);

      setTimeout(() => {
        alertDialog(
          'Gotowe',
          'Wszystkie dane zostały usunięte. Odśwież aplikację, aby zobaczyć zmiany.'
        );
      }, 300);
    } catch (error) {
      if (__DEV__) console.error('❌ Błąd podczas resetowania danych:', error);
      alertDialog('Błąd', 'Nie udało się zresetować wszystkich danych');
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  };

  const completedWorkouts = workoutHistory ? workoutHistory.filter(w => !w.scheduled).length : 0;
  const totalTime = getTotalWorkoutTime();
  const streak = calculateWorkoutStreak();
  const topRecords = getTopRecords();
  const age = calculateAge();

  // Goal translations
  const goalLabels = {
    'muscle': 'Budowanie masy',
    'strength': 'Zwiększenie siły',
    'fat_loss': 'Redukcja tłuszczu',
    'endurance': 'Poprawa kondycji',
    '': 'Nie ustawiono'
  };

  const experienceLabels = {
    'beginner': 'Początkujący',
    'intermediate': 'Średniozaawansowany',
    'advanced': 'Zaawansowany',
    '': 'Nie ustawiono'
  };

  const equipmentLabels = {
    'gym': 'Siłownia pełna',
    'home': 'Siłownia domowa',
    'bodyweight': 'Bez sprzętu',
    '': 'Nie ustawiono'
  };

  const genderLabels = {
    'male': 'Mężczyzna',
    'female': 'Kobieta',
    '': 'Nie podano'
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.logo}>PUMP</Text>
        <Text style={styles.subtitle}>Profil</Text>
      </View>

      {/* Profile Picture & Name Section */}
      <View style={styles.profileSection}>
        <View style={styles.profilePictureContainer}>
          <LinearGradient
            colors={['#a855f7', '#ec4899']}
            style={styles.profilePicture}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <Text style={styles.profileEmoji}>👤</Text>
            )}
          </LinearGradient>
        </View>

        <TouchableOpacity onPress={handleImagePick} style={styles.changePhotoButton}>
          <Ionicons name="camera" size={20} color="white" />
          <Text style={styles.changePhotoText}>Zmień zdjęcie</Text>
        </TouchableOpacity>

        <Text style={styles.profileName}>
          {profileData.name || 'Dodaj imię'}
        </Text>
        {age && (
          <Text style={styles.profileAge}>{age} lat</Text>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>📊 Podsumowanie</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedWorkouts}</Text>
            <Text style={styles.statLabel}>Treningów</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatTime(totalTime)}</Text>
            <Text style={styles.statLabel}>Łączny czas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streak} 🔥</Text>
            <Text style={styles.statLabel}>Seria dni</Text>
          </View>
        </View>

        {/* Top Records */}
        {topRecords.length > 0 && (
          <View style={styles.topRecordsContainer}>
            <Text style={styles.subsectionTitle}>🏆 Najlepsze rekordy</Text>
            {topRecords.map((record, idx) => (
              <View key={idx} style={styles.recordItem}>
                <Text style={styles.recordExercise}>{record.exercise}</Text>
                <Text style={styles.recordWeight}>{record.weight} kg</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Dane osobiste</Text>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => openEditModal('name', profileData.name)}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="person-outline" size={20} color="#9333ea" />
            <Text style={styles.settingLabel}>Imię</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>{profileData.name || 'Dodaj'}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => openEditModal('birthDate', profileData.birthDate)}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="calendar-outline" size={20} color="#9333ea" />
            <Text style={styles.settingLabel}>Data urodzenia</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>{profileData.birthDate || 'Dodaj'}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => openEditModal('gender', profileData.gender)}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="male-female-outline" size={20} color="#9333ea" />
            <Text style={styles.settingLabel}>Płeć</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>{genderLabels[profileData.gender]}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Training Goals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Cele treningowe</Text>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => openEditModal('goal', profileData.goal)}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="trophy-outline" size={20} color="#9333ea" />
            <Text style={styles.settingLabel}>Główny cel</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>{goalLabels[profileData.goal]}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => openEditModal('targetWeight', profileData.targetWeight)}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="speedometer-outline" size={20} color="#9333ea" />
            <Text style={styles.settingLabel}>Docelowa waga</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>
              {profileData.targetWeight ? `${profileData.targetWeight} kg` : 'Dodaj'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => openEditModal('experienceLevel', profileData.experienceLevel)}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="bar-chart-outline" size={20} color="#9333ea" />
            <Text style={styles.settingLabel}>Poziom zaawansowania</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>{experienceLabels[profileData.experienceLevel]}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Training Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Preferencje treningowe</Text>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => openEditModal('weeklyWorkouts', profileData.weeklyWorkouts)}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="fitness-outline" size={20} color="#9333ea" />
            <Text style={styles.settingLabel}>Treningi w tygodniu</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>{profileData.weeklyWorkouts}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => openEditModal('workoutDuration', profileData.workoutDuration)}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="time-outline" size={20} color="#9333ea" />
            <Text style={styles.settingLabel}>Czas treningu</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>{profileData.workoutDuration} min</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => openEditModal('equipment', profileData.equipment)}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="barbell-outline" size={20} color="#9333ea" />
            <Text style={styles.settingLabel}>Dostępny sprzęt</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>{equipmentLabels[profileData.equipment]}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Akcje</Text>

        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => setAboutModalVisible(true)}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
            <Text style={styles.actionLabel}>O aplikacji</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={() => setResetModalVisible(true)}>
          <View style={styles.settingLeft}>
            <Ionicons name="trash-outline" size={20} color="#dc2626" />
            <Text style={[styles.actionLabel, { color: '#dc2626' }]}>Resetuj dane</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {currentEditField === 'name' && 'Imię'}
              {currentEditField === 'birthDate' && 'Data urodzenia'}
              {currentEditField === 'gender' && 'Płeć'}
              {currentEditField === 'goal' && 'Główny cel'}
              {currentEditField === 'targetWeight' && 'Docelowa waga (kg)'}
              {currentEditField === 'experienceLevel' && 'Poziom zaawansowania'}
              {currentEditField === 'weeklyWorkouts' && 'Treningi w tygodniu'}
              {currentEditField === 'workoutDuration' && 'Czas treningu (min)'}
              {currentEditField === 'equipment' && 'Dostępny sprzęt'}
            </Text>

            {/* Text fields */}
            {['name', 'birthDate', 'targetWeight', 'weeklyWorkouts', 'workoutDuration'].includes(currentEditField) && (
              <TextInput
                style={styles.modalInput}
                value={tempValue}
                onChangeText={setTempValue}
                placeholder={
                  currentEditField === 'birthDate' ? 'RRRR-MM-DD' :
                  currentEditField === 'targetWeight' ? 'np. 75' :
                  currentEditField === 'weeklyWorkouts' ? 'np. 3-4' :
                  currentEditField === 'workoutDuration' ? 'np. 60' :
                  'Wpisz wartość'
                }
                keyboardType={
                  ['targetWeight', 'workoutDuration'].includes(currentEditField) ? 'numeric' : 'default'
                }
              />
            )}

            {/* Gender picker */}
            {currentEditField === 'gender' && (
              <View style={styles.pickerContainer}>
                {['male', 'female'].map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.pickerOption, tempValue === option && styles.pickerOptionSelected]}
                    onPress={() => setTempValue(option)}
                  >
                    <Text style={[styles.pickerOptionText, tempValue === option && styles.pickerOptionTextSelected]}>
                      {genderLabels[option]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Goal picker */}
            {currentEditField === 'goal' && (
              <View style={styles.pickerContainer}>
                {['muscle', 'strength', 'fat_loss', 'endurance'].map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.pickerOption, tempValue === option && styles.pickerOptionSelected]}
                    onPress={() => setTempValue(option)}
                  >
                    <Text style={[styles.pickerOptionText, tempValue === option && styles.pickerOptionTextSelected]}>
                      {goalLabels[option]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Experience picker */}
            {currentEditField === 'experienceLevel' && (
              <View style={styles.pickerContainer}>
                {['beginner', 'intermediate', 'advanced'].map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.pickerOption, tempValue === option && styles.pickerOptionSelected]}
                    onPress={() => setTempValue(option)}
                  >
                    <Text style={[styles.pickerOptionText, tempValue === option && styles.pickerOptionTextSelected]}>
                      {experienceLabels[option]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Equipment picker */}
            {currentEditField === 'equipment' && (
              <View style={styles.pickerContainer}>
                {['gym', 'home', 'bodyweight'].map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.pickerOption, tempValue === option && styles.pickerOptionSelected]}
                    onPress={() => setTempValue(option)}
                  >
                    <Text style={[styles.pickerOptionText, tempValue === option && styles.pickerOptionTextSelected]}>
                      {equipmentLabels[option]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={saveEdit}
              >
                <Text style={styles.modalButtonTextSave}>Zapisz</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal
        visible={aboutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.aboutHeader}>
              <Text style={styles.aboutLogo}>PUMP</Text>
              <Text style={styles.aboutVersion}>Wersja 1.0.0</Text>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>O aplikacji</Text>
              <Text style={styles.aboutText}>
                PUMP to kompleksowa aplikacja do śledzenia treningów siłowych, która pomaga w osiąganiu celów fitness.
              </Text>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>Funkcje</Text>
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#9333ea" />
                  <Text style={styles.featureText}>Generowanie treningów AI</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#9333ea" />
                  <Text style={styles.featureText}>Tworzenie własnych treningów</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#9333ea" />
                  <Text style={styles.featureText}>Śledzenie postępów</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#9333ea" />
                  <Text style={styles.featureText}>Rekordy osobiste</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#9333ea" />
                  <Text style={styles.featureText}>Biblioteka ćwiczeń</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#9333ea" />
                  <Text style={styles.featureText}>Statystyki treningowe</Text>
                </View>
              </View>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.aboutCopyright}>© 2025 PUMP. Wszystkie prawa zastrzeżone.</Text>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonFull, styles.modalButtonSave]}
              onPress={() => setAboutModalVisible(false)}
            >
              <Text style={styles.modalButtonTextSave}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal
        visible={resetModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.resetWarningIcon}>
              <Ionicons name="warning" size={60} color="#dc2626" />
            </View>

            <Text style={styles.modalTitle}>Resetuj wszystkie dane</Text>

            <View style={styles.resetWarningBox}>
              <Text style={styles.resetWarningTitle}>⚠️ Uwaga! Ta operacja jest nieodwracalna!</Text>
              <Text style={styles.resetWarningText}>
                Po potwierdzeniu zostaną trwale usunięte:
              </Text>
              <View style={styles.resetList}>
                <Text style={styles.resetListItem}>• Wszystkie treningi z historii</Text>
                <Text style={styles.resetListItem}>• Zapisane szablony treningów</Text>
                <Text style={styles.resetListItem}>• Ulubione ćwiczenia</Text>
                <Text style={styles.resetListItem}>• Rekordy osobiste</Text>
                <Text style={styles.resetListItem}>• Historia pomiarów wagi</Text>
                <Text style={styles.resetListItem}>• Dane profilu i ustawienia</Text>
                <Text style={styles.resetListItem}>• Zdjęcie profilowe</Text>
              </View>
              <Text style={styles.resetWarningFooter}>
                Aplikacja zostanie zresetowana do stanu początkowego.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setResetModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={handleResetData}
              >
                <Text style={styles.modalButtonTextDanger}>Resetuj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    maxWidth: 896,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 96,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: '900',
    color: '#111827',
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  profileSection: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  profilePictureContainer: {
    marginBottom: 16,
  },
  profilePicture: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileEmoji: {
    fontSize: 60,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#9333ea',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  changePhotoText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  profileAge: {
    fontSize: 16,
    color: '#6b7280',
  },
  statsSection: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#9333ea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  topRecordsContainer: {
    marginTop: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  recordExercise: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  recordWeight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9333ea',
  },
  section: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  settingLabel: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  settingValue: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
    maxWidth: 150,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  actionLabel: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9fafb',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerOption: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  pickerOptionSelected: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
  },
  pickerOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonSave: {
    backgroundColor: '#9333ea',
  },
  modalButtonTextCancel: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSave: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonFull: {
    flex: 'none',
    width: '100%',
  },
  modalButtonDanger: {
    backgroundColor: '#dc2626',
  },
  modalButtonTextDanger: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // About Modal styles
  aboutHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  aboutLogo: {
    fontSize: 48,
    fontWeight: '900',
    color: '#9333ea',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  aboutVersion: {
    fontSize: 14,
    color: '#6b7280',
  },
  aboutSection: {
    marginBottom: 20,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#111827',
  },
  aboutCopyright: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Reset Modal styles
  resetWarningIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resetWarningBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  resetWarningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  resetWarningText: {
    fontSize: 14,
    color: '#991b1b',
    marginBottom: 12,
    fontWeight: '600',
  },
  resetList: {
    marginBottom: 12,
  },
  resetListItem: {
    fontSize: 13,
    color: '#7f1d1d',
    marginBottom: 6,
    lineHeight: 18,
  },
  resetWarningFooter: {
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ProfilePage;
