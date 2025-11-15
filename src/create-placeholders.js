const fs = require('fs');
const path = require('path');

const placeholder = (name) => `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ${name}() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🔧 ${name} - W przygotowaniu</Text>
      <Text style={styles.subtext}>Ten komponent wymaga konwersji z React do React Native</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f9fafb',
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
`;

const components = [
  { path: 'src/components/screens/MuscleGroupSelector.js', name: 'MuscleGroupSelector' },
  { path: 'src/components/screens/SavedWorkoutsPage.js', name: 'SavedWorkoutsPage' },
  { path: 'src/components/screens/StatsPage.js', name: 'StatsPage' },
  { path: 'src/components/workout/ActiveWorkout.js', name: 'ActiveWorkout' },
  { path: 'src/components/workout/GeneratedWorkout.js', name: 'GeneratedWorkout' },
  { path: 'src/components/workout/CustomWorkoutBuilder.js', name: 'CustomWorkoutBuilder' },
  { path: 'src/components/workout/ExerciseCard.js', name: 'ExerciseCard' },
  { path: 'src/components/workout/GifModal.js', name: 'GifModal' },
];

components.forEach(({ path: filePath, name }) => {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, placeholder(name));
  if (typeof __DEV__ !== 'undefined' && __DEV__) console.log(`✅ Created ${filePath}`);
});

if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('\n🎉 All placeholder components created!');