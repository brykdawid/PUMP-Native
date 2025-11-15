// Automatyczna detekcja środowiska
const API_BASE_URL = 'https://ai-api-zljd-a.fly.dev';  // ✅ DOBRZE


export async function getExercises(categories = null) {
  try {
    let url = `${API_BASE_URL}/api/exercises`;

    if (categories && categories.length > 0) {
      const categoriesParam = Array.isArray(categories)
        ? categories.join(',')
        : categories;
      url += `?categories=${categoriesParam}`;
    }

    if (__DEV__) console.log('Fetching exercises from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (__DEV__) console.log('Exercises fetched:', data.length);

    return data;
  } catch (error) {
    if (__DEV__) console.error('Error fetching exercises:', error);
    throw error;
  }
}

export async function generateWorkout(categories) {
  try {
    const url = `${API_BASE_URL}/api/generate-workout`;

    if (__DEV__) console.log('Generating workout for categories:', categories);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categories }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (__DEV__) console.log('Workout generated:', data);

    return data;
  } catch (error) {
    if (__DEV__) console.error('Error generating workout:', error);
    throw error;
  }
}

export async function getCategories() {
  try {
    const url = `${API_BASE_URL}/api/categories`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    if (__DEV__) console.error('Error fetching categories:', error);
    throw error;
  }
}