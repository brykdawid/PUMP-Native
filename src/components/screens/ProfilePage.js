// PLIK: components/ProfilePage.js - React Native

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import storage from '../../utils/storage';

function ProfilePage() {
  const [profileImage, setProfileImage] = useState(null);
  const isLoadedRef = useRef(false); // Flag to prevent saving before loading

  // Load profile image from storage on mount
  useEffect(() => {
    loadProfileImage();
  }, []);

  // Save profile image to storage whenever it changes
  useEffect(() => {
    if (!isLoadedRef.current) return; // Don't save until data is loaded
    if (profileImage !== null) {
      console.log('💾 Saving profile image to storage');
      storage.setItem('profileImage', profileImage);
    }
  }, [profileImage]);

  const loadProfileImage = async () => {
    try {
      console.log('🔍 Loading profile image from storage...');
      const savedImage = await storage.getItem('profileImage');
      if (savedImage) {
        console.log('✅ Profile image found in storage');
        setProfileImage(savedImage);
      } else {
        console.log('ℹ️ No profile image in storage');
      }
      isLoadedRef.current = true;
      console.log('✅ Profile data loaded, auto-save enabled');
    } catch (error) {
      console.error('❌ Error loading profile image:', error);
      isLoadedRef.current = true; // Enable saving even on error
    }
  };

  const handleImagePick = async () => {
    try {
      // Zapytaj o pozwolenia
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Brak uprawnień', 'Musisz zezwolić na dostęp do zdjęć');
        return;
      }

      // Wybierz zdjęcie
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true, // Request base64 data
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;

        // In web environment, convert blob URL to base64 data URL for persistence
        if (uri.startsWith('blob:') || uri.startsWith('http')) {
          console.log('🔄 Converting image to base64 for web storage...');
          try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const reader = new FileReader();

            reader.onloadend = () => {
              const base64data = reader.result;
              console.log('✅ Image converted to base64, size:', Math.round(base64data.length / 1024), 'KB');
              setProfileImage(base64data);
            };

            reader.readAsDataURL(blob);
          } catch (conversionError) {
            console.error('❌ Error converting image:', conversionError);
            // Fallback to original URI if conversion fails
            setProfileImage(uri);
          }
        } else {
          // Native app or already a data URL
          setProfileImage(uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Błąd', 'Nie udało się wybrać zdjęcia');
    }
  };

  const options = [
    { id: 1, title: 'Option 1', description: 'Description for option 1' },
    { id: 2, title: 'Option 2', description: 'Description for option 2' },
    { id: 3, title: 'Option 3', description: 'Description for option 3' }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.logo}>PUMP</Text>
        <Text style={styles.subtitle}>Profil</Text>
      </View>

      {/* Profile Picture Section */}
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
      </View>

      {/* Options List */}
      <View style={styles.optionsList}>
        {options.map((option, idx) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionItem,
              idx !== options.length - 1 && styles.optionItemBorder
            ]}
            onPress={() => Alert.alert(option.title, option.description)}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>
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
  },
  changePhotoText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  optionsList: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  optionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default ProfilePage;