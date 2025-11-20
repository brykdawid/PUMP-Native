// PLIK: utils/workoutHelpers.js

/**
 * Zwraca lokalną datę w formacie YYYY-MM-DD
 */
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Zwraca lokalną datę i czas w formacie ISO ale z lokalną datą
 * Format: YYYY-MM-DDTHH:mm:ss.sssZ (ale z lokalnym czasem)
 */
export function getLocalISOString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`;
}

/**
 * Zunifikowany format treningu
 *
 * {
 *   id: number,
 *   title: string,
 *   type: 'ai' | 'custom',
 *   exercises: Array<Exercise>,  // Zawsze płaska lista
 *   metadata: {
 *     selectedTypes?: string[],   // Dla ai
 *     warmupExercises?: Exercise[], // Dla ai
 *     isFavorite?: boolean,       // Dla custom
 *   },
 *   savedAt: string (ISO date)
 * }
 */

/**
 * Normalizuje workout do zunifikowanego formatu
 */
export function normalizeWorkout(workout) {
  // Jeśli już znormalizowany (ma exercises ale nie ma workoutPlan)
  if (workout.exercises && Array.isArray(workout.exercises) && !workout.workoutPlan) {
    // Backward compatibility: zmień 'generated' na 'ai'
    if (workout.type === 'generated') {
      return { ...workout, type: 'ai' };
    }
    return workout;
  }

  // Ma workoutPlan - sprawdź czy to array (custom) czy object (generated)
  if (workout.workoutPlan) {
    const allExercises = [];

    // Custom workout - workoutPlan jest array'em grup mięśniowych
    if (Array.isArray(workout.workoutPlan)) {
      workout.workoutPlan.forEach(group => {
        if (group.exercises && Array.isArray(group.exercises)) {
          group.exercises.forEach(ex => {
            if (ex && ex.name) {
              allExercises.push({
                ...ex,
                name: ex.name || 'Bez nazwy',
                category: group.muscleGroup || 'inne',
                sets: ex.sets || ex.count || 3
              });
            }
          });
        }
      });

      return {
        id: workout.id,
        title: workout.title || workout.name || 'Custom Workout',
        type: 'custom',
        exercises: allExercises,
        workoutPlan: workout.workoutPlan, // ZACHOWAJ strukturę grup dla wczytywania
        metadata: {
          isFavorite: workout.isFavorite || false
        },
        savedAt: workout.savedAt
      };
    }

    // Generated workout - workoutPlan jest obiektem {category: [exercises]}
    Object.entries(workout.workoutPlan).forEach(([category, exercises]) => {
      if (Array.isArray(exercises)) {
        exercises.forEach(ex => {
          if (ex && ex.name) {
            allExercises.push({
              ...ex,
              name: ex.name || 'Bez nazwy',
              category: category,
              sets: ex.count || ex.sets || 3
            });
          }
        });
      }
    });

    return {
      id: workout.id,
      title: workout.title || 'Generated Workout',
      type: 'ai',
      exercises: allExercises,
      workoutPlan: workout.workoutPlan, // ZACHOWAJ dla wyświetlania
      aiGenerated: workout.aiGenerated,
      metadata: {
        selectedTypes: workout.selectedTypes || [],
      },
      savedAt: workout.savedAt
    };
  }

  // Custom workout (ma exercises, stara struktura)
  if (workout.exercises) {
    return {
      id: workout.id,
      title: workout.title || 'Custom Workout',
      type: 'custom',
      exercises: Array.isArray(workout.exercises)
        ? workout.exercises
            .filter(ex => ex && ex.name)
            .map(ex => ({
              ...ex,
              name: ex.name || 'Bez nazwy',
              sets: ex.sets || ex.count || 3
            }))
        : [],
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
    savedAt: workout.savedAt || getLocalISOString()
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
 * Grupuje ćwiczenia po kategoriach (dla ai workouts)
 */
export function groupExercisesByCategory(workout) {
  const normalized = normalizeWorkout(workout);

  if (normalized.type !== 'ai') {
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