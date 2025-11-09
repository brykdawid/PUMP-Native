// PLIK: utils/workoutHelpers.js

/**
 * Zunifikowany format treningu
 * 
 * {
 *   id: number,
 *   title: string,
 *   type: 'generated' | 'custom',
 *   exercises: Array<Exercise>,  // Zawsze płaska lista
 *   metadata: {
 *     selectedTypes?: string[],   // Dla generated
 *     warmupExercises?: Exercise[], // Dla generated
 *     isFavorite?: boolean,       // Dla custom
 *   },
 *   savedAt: string (ISO date)
 * }
 */

/**
 * Normalizuje workout do zunifikowanego formatu
 */
export function normalizeWorkout(workout) {
  // Jeśli już znormalizowany
  if (workout.exercises && Array.isArray(workout.exercises) && !workout.workoutPlan) {
    return workout;
  }

  // Generated workout (ma workoutPlan)
  if (workout.workoutPlan) {
    const allExercises = [];
    
    Object.entries(workout.workoutPlan).forEach(([category, exercises]) => {
      exercises.forEach(ex => {
        allExercises.push({
          ...ex,
          category: category,
          sets: ex.count || ex.sets || 3
        });
      });
    });

    return {
      id: workout.id,
      title: workout.title || 'Generated Workout',
      type: 'generated',
      exercises: allExercises,
      workoutPlan: workout.workoutPlan, // ZACHOWAJ dla wyświetlania
      aiGenerated: workout.aiGenerated,
      metadata: {
        selectedTypes: workout.selectedTypes || [],
      },
      savedAt: workout.savedAt
    };
  }

  // Custom workout (ma exercises)
  if (workout.exercises) {
    return {
      id: workout.id,
      title: workout.title || 'Custom Workout',
      type: 'custom',
      exercises: workout.exercises.map(ex => ({
        ...ex,
        sets: ex.sets || ex.count || 3
      })),
      metadata: {
        isFavorite: workout.isFavorite || false
      },
      savedAt: workout.savedAt
    };
  }

  // Fallback
  return {
    id: workout.id || Date.now(),
    title: workout.title || 'Workout',
    type: 'custom',
    exercises: [],
    metadata: {},
    savedAt: workout.savedAt || new Date().toISOString()
  };
}

/**
 * Zwraca liczbę ćwiczeń w workoucie
 */
export function getTotalExercises(workout) {
  const normalized = normalizeWorkout(workout);
  return normalized.exercises.length; // BEZ warmup
}

/**
 * Grupuje ćwiczenia po kategoriach (dla generated workouts)
 */
export function groupExercisesByCategory(workout) {
  const normalized = normalizeWorkout(workout);
  
  if (normalized.type !== 'generated') {
    return null;
  }

  const grouped = {};
  normalized.exercises.forEach(ex => {
    const cat = ex.category || 'other';
    if (!grouped[cat]) {
      grouped[cat] = [];
    }
    grouped[cat].push(ex);
  });

  return grouped;
}

/**
 * Konwertuje stary format do nowego
 */
export function migrateOldWorkouts(workouts) {
  return workouts.map(normalizeWorkout);
}