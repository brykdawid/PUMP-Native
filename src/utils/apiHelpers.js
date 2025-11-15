// Automatyczna detekcja środowiska
const API_BASE_URL = 'https://ai-api-zljd-a.fly.dev';  // ✅ DOBRZE


export async function getExercises(categories = null, limit = null) {
  try {
    let url = `${API_BASE_URL}/api/exercises`;
    const params = new URLSearchParams();

    if (categories && categories.length > 0) {
      const categoriesParam = Array.isArray(categories)
        ? categories.join(',')
        : categories;
      params.append('categories', categoriesParam);
    }

    if (limit) {
      params.append('limit', limit);
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    if (__DEV__) console.log('Fetching exercises from:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (__DEV__) console.log('Exercises fetched:', data.length);

    // Debug: sprawdź przykładowy URL obrazka
    if (__DEV__ && data.length > 0) {
      console.log('Sample exercise image URL:', data[0].image);
      console.log('Sample exercise:', {
        name: data[0].name,
        image: data[0].image,
        category: data[0].category
      });
    }

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