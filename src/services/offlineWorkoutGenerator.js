// src/services/offlineWorkoutGenerator.js
// Rule-based workout generator for offline mode
// Generates intelligent workouts without AI/API dependency

import exercisesDB from '../data/exercisesDatabase.json';
import { CATEGORY_TO_AI_LABELS } from '../components/data/exercisesData';

/**
 * Maps Polish category names to English database categories
 */
const CATEGORY_MAP = {
  'klatka': 'chest',
  'plecy': 'back',
  'nogi': 'legs',
  'barki': 'shoulders',
  'biceps': 'biceps',
  'triceps': 'triceps',
  'brzuch': 'abs',
  'posladki': 'glutes',
  'przedramiona': 'forearms'
};

/**
 * Exercise priority levels (compound exercises first)
 */
const EXERCISE_PRIORITY = {
  // Compound movements (high priority)
  'Bench Press': 1,
  'Deadlift': 1,
  'Barbell Squat': 1,
  'Pull-Ups': 1,
  'Overhead Press': 1,
  'Barbell Row': 1,

  // Secondary compounds
  'Incline Dumbbell Press': 2,
  'Leg Press': 2,
  'Lat Pulldown': 2,
  'Romanian Deadlift': 2,
  'Hip Thrust': 2,

  // Isolation and accessory (lower priority)
  // All others default to 3
};

/**
 * Gets exercises for specific categories
 */
function getExercisesByCategories(categories) {
  const englishCategories = categories.map(cat => CATEGORY_MAP[cat] || cat);

  const exercises = exercisesDB.filter(exercise => {
    // Check if exercise category matches or if it targets any of the selected muscles
    return englishCategories.includes(exercise.category) ||
           exercise.targetMuscles.some(muscle =>
             englishCategories.some(cat =>
               CATEGORY_TO_AI_LABELS[categories.find(c => CATEGORY_MAP[c] === cat)]?.includes(muscle)
             )
           );
  });

  return exercises;
}

/**
 * Sorts exercises by priority (compound first, then isolation)
 */
function sortByPriority(exercises) {
  return exercises.sort((a, b) => {
    const priorityA = EXERCISE_PRIORITY[a.name] || 3;
    const priorityB = EXERCISE_PRIORITY[b.name] || 3;

    if (priorityA !== priorityB) {
      return priorityA - priorityB; // Lower number = higher priority
    }

    // If same priority, sort by difficulty (beginner first for safety)
    const difficultyOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
    return (difficultyOrder[a.difficulty] || 2) - (difficultyOrder[b.difficulty] || 2);
  });
}

/**
 * Ensures variety in exercise selection (different equipment, movement patterns)
 */
function ensureVariety(exercises, count) {
  const selected = [];
  const usedEquipment = new Set();
  const usedMovementPatterns = new Set();

  // First pass: prioritize compound movements with different equipment
  for (const exercise of exercises) {
    if (selected.length >= count) break;

    const equipmentKey = exercise.equipment;
    const movementKey = exercise.name.split(' ').pop(); // Simple pattern detection

    // Prefer exercises with different equipment and patterns
    if (!usedEquipment.has(equipmentKey) || selected.length < count / 2) {
      selected.push(exercise);
      usedEquipment.add(equipmentKey);
      usedMovementPatterns.add(movementKey);
    }
  }

  // Second pass: fill remaining slots if needed
  for (const exercise of exercises) {
    if (selected.length >= count) break;
    if (!selected.includes(exercise)) {
      selected.push(exercise);
    }
  }

  return selected.slice(0, count);
}

/**
 * Generates workout tips based on selected categories
 */
function generateWorkoutTips(categories, exercises) {
  const tips = [];

  // General warm-up tip
  tips.push('🔥 Rozpocznij od 5-10 minut rozgrzewki kardio (bieżnia, rower, orbitrek)');

  // Category-specific tips
  if (categories.includes('klatka') || categories.includes('barki')) {
    tips.push('💪 Rozgrzej rotatory barków przed treningiem góry ciała');
  }

  if (categories.includes('nogi')) {
    tips.push('🦵 Upewnij się, że kolana są dobrze rozgrzane przed ciężkimi przysiadami');
  }

  if (categories.includes('plecy')) {
    tips.push('💪 Skup się na ściąganiu łopatek i pracy mięśni pleców, nie ramion');
  }

  // Check for heavy compound exercises
  const hasHeavyCompounds = exercises.some(ex =>
    ['Deadlift', 'Barbell Squat', 'Bench Press'].includes(ex.name)
  );

  if (hasHeavyCompounds) {
    tips.push('⚠️ Przy ciężkich ćwiczeniach wielostawowych użyj pasa treningowego dla bezpieczeństwa');
    tips.push('⏱️ Dłuższe przerwy (2-3 min) między seriami ciężkich ćwiczeń');
  } else {
    tips.push('⏱️ Krótsze przerwy (60-90s) zwiększą intensywność treningu');
  }

  // Progressive overload tip
  tips.push('📈 Staraj się każdy tydzień dodać małe obciążenie lub jedno powtórzenie więcej');

  // Hydration and form
  tips.push('💧 Pij wodę między seriami, utrzymuj nawodnienie');
  tips.push('✅ Technika ważniejsza niż ciężar - zawsze kontroluj ruch');

  return tips;
}

/**
 * Generates workout structure (sets, reps, rest periods)
 */
function generateWorkoutStructure(exercises) {
  return exercises.map((exercise, index) => ({
    ...exercise,
    order: index + 1,
    // Adjust sets/reps based on exercise type
    sets: exercise.sets || (EXERCISE_PRIORITY[exercise.name] <= 2 ? '3-4' : '3'),
    reps: exercise.reps || (EXERCISE_PRIORITY[exercise.name] === 1 ? '6-10' : '10-12'),
    rest: exercise.rest || (EXERCISE_PRIORITY[exercise.name] === 1 ? '120-180s' : '60-90s'),
    notes: generateExerciseNotes(exercise, index)
  }));
}

/**
 * Generates specific notes for each exercise in the workout
 */
function generateExerciseNotes(exercise, index) {
  const notes = [];

  if (index === 0) {
    notes.push('Pierwsze ćwiczenie - zacznij od kilku serii rozgrzewkowych z lżejszym ciężarem');
  }

  if (EXERCISE_PRIORITY[exercise.name] === 1) {
    notes.push('Ćwiczenie główne - skup maksymalną energię na perfekcyjnej technice');
  }

  if (exercise.difficulty === 'Advanced') {
    notes.push('Zaawansowane - rozważ asekurację lub nadzór trenera');
  }

  if (exercise.equipment === 'Bodyweight') {
    notes.push('Własny ciężar ciała - możesz dodać obciążenie gdy staniesz się silniejszy');
  }

  return notes.join(' | ');
}

/**
 * Generates warm-up exercises for the workout
 */
function generateWarmup(categories) {
  const warmup = [];

  // General cardio warm-up
  warmup.push({
    name: 'Kardio Rozgrzewka',
    description: 'Bieżnia, rower lub orbitrek w lekkim tempie',
    duration: '5-10 minut',
    intensity: 'Lekka - możesz prowadzić rozmowę'
  });

  // Dynamic stretching
  warmup.push({
    name: 'Jumping Jacks',
    description: 'Pajacyki - aktywacja całego ciała',
    sets: '2 serie',
    reps: '20 powtórzeń'
  });

  // Category-specific warm-up
  if (categories.includes('klatka') || categories.includes('barki') || categories.includes('triceps')) {
    warmup.push({
      name: 'Arm Circles',
      description: 'Okrężne ruchy ramionami - przód i tył',
      sets: '2 serie',
      reps: '15 w każdą stronę'
    });

    warmup.push({
      name: 'Push-ups (lekkie)',
      description: 'Pompki na kolanach lub od ściany',
      sets: '2 serie',
      reps: '10 powtórzeń'
    });
  }

  if (categories.includes('plecy')) {
    warmup.push({
      name: 'Scapular Pull-ups',
      description: 'Aktywacja mięśni łopatek',
      sets: '2 serie',
      reps: '10 powtórzeń'
    });

    warmup.push({
      name: 'Band Pull-aparts',
      description: 'Rozciąganie gumy oporowej (jeśli dostępna)',
      sets: '2 serie',
      reps: '15 powtórzeń'
    });
  }

  if (categories.includes('nogi') || categories.includes('posladki')) {
    warmup.push({
      name: 'Bodyweight Squats',
      description: 'Przysiady bez obciążenia',
      sets: '2 serie',
      reps: '15 powtórzeń'
    });

    warmup.push({
      name: 'Leg Swings',
      description: 'Machanie nogą przód-tył i bok-bok',
      sets: '2 serie',
      reps: '10 w każdym kierunku na nogę'
    });
  }

  if (categories.includes('brzuch')) {
    warmup.push({
      name: 'Dead Bug',
      description: 'Martwy robak - aktywacja core',
      sets: '2 serie',
      reps: '10 powtórzeń'
    });
  }

  return warmup;
}

/**
 * Main function: Generates a complete offline workout
 * @param {Array<string>} categories - Polish category names (e.g., ['klatka', 'triceps'])
 * @param {number} numExercises - Number of exercises to include (default: 5)
 * @returns {Object} Complete workout object
 */
export function generateOfflineWorkout(categories, numExercises = 5) {
  try {
    // Validate input
    if (!categories || categories.length === 0) {
      throw new Error('At least one category must be selected');
    }

    // Get relevant exercises
    let availableExercises = getExercisesByCategories(categories);

    if (availableExercises.length === 0) {
      throw new Error(`No exercises found for categories: ${categories.join(', ')}`);
    }

    // Sort by priority (compound movements first)
    availableExercises = sortByPriority(availableExercises);

    // Ensure variety and select appropriate number
    const selectedExercises = ensureVariety(availableExercises, numExercises);

    // Generate workout structure
    const workoutExercises = generateWorkoutStructure(selectedExercises);

    // Generate warm-up
    const warmup = generateWarmup(categories);

    // Generate tips
    const tips = generateWorkoutTips(categories, selectedExercises);

    // Calculate estimated duration
    const estimatedDuration = calculateWorkoutDuration(workoutExercises, warmup);

    // Build final workout object
    const workout = {
      id: `offline_${Date.now()}`,
      name: `Trening ${categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(' + ')}`,
      categories: categories,
      generatedBy: 'offline',
      generatedAt: new Date().toISOString(),
      warmup: warmup,
      exercises: workoutExercises,
      tips: tips,
      estimatedDuration: estimatedDuration,
      summary: {
        totalExercises: workoutExercises.length,
        muscleGroups: categories.length,
        difficulty: calculateOverallDifficulty(workoutExercises),
        equipment: [...new Set(workoutExercises.map(e => e.equipment))].join(', ')
      }
    };

    return workout;

  } catch (error) {
    console.error('[OfflineGenerator] Error generating workout:', error);
    throw error;
  }
}

/**
 * Calculates estimated workout duration
 */
function calculateWorkoutDuration(exercises, warmup) {
  // Warmup: ~10 minutes
  let totalMinutes = 10;

  // Each exercise: sets × (reps time + rest)
  // Estimate: ~30-40s per set + rest time
  exercises.forEach(exercise => {
    const sets = parseInt(exercise.sets?.split('-')[0] || '3');
    const restSeconds = parseInt(exercise.rest?.split('-')[1]?.replace('s', '') || '90');

    // ~30s per set + rest
    const exerciseTime = sets * (30 + restSeconds) / 60; // Convert to minutes
    totalMinutes += exerciseTime;
  });

  // Round to nearest 5 minutes
  totalMinutes = Math.round(totalMinutes / 5) * 5;

  return `${totalMinutes} minut`;
}

/**
 * Calculates overall workout difficulty
 */
function calculateOverallDifficulty(exercises) {
  const difficulties = exercises.map(e => e.difficulty);
  const advancedCount = difficulties.filter(d => d === 'Advanced').length;
  const intermediateCount = difficulties.filter(d => d === 'Intermediate').length;

  if (advancedCount >= 2) return 'Zaawansowany';
  if (advancedCount >= 1 || intermediateCount >= 3) return 'Średniozaawansowany';
  return 'Początkujący';
}

/**
 * Gets all available exercises (for library view)
 */
export function getAllOfflineExercises() {
  return exercisesDB;
}

/**
 * Gets exercises filtered by category
 */
export function getOfflineExercisesByCategory(category) {
  const englishCategory = CATEGORY_MAP[category] || category;
  return exercisesDB.filter(ex =>
    ex.category === englishCategory ||
    ex.targetMuscles.includes(englishCategory)
  );
}

/**
 * Searches exercises by name or description
 */
export function searchOfflineExercises(query) {
  const lowerQuery = query.toLowerCase();
  return exercisesDB.filter(ex =>
    ex.name.toLowerCase().includes(lowerQuery) ||
    ex.description.toLowerCase().includes(lowerQuery) ||
    ex.targetMuscles.some(m => m.toLowerCase().includes(lowerQuery))
  );
}

export default {
  generateOfflineWorkout,
  getAllOfflineExercises,
  getOfflineExercisesByCategory,
  searchOfflineExercises
};
