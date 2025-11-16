// Automatyczna detekcja środowiska
const API_BASE_URL = 'https://ai-api-bz4x-a-production.up.railway.app';  // ✅ Railway API

/**
 * Konwertuje względny URL obrazka na absolutny
 * @param {string} imageUrl - Względny lub absolutny URL obrazka
 * @returns {string} Absolutny URL obrazka
 */
export function getAbsoluteImageUrl(imageUrl) {
  if (!imageUrl) return null;

  // Jeśli URL jest już absolutny (zaczyna się od http:// lub https://), zwróć go bez zmian
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Jeśli URL jest względny (zaczyna się od /), dodaj bazowy URL
  if (imageUrl.startsWith('/')) {
    return `${API_BASE_URL}${imageUrl}`;
  }

  // W innych przypadkach, dodaj bazowy URL i /
  return `${API_BASE_URL}/${imageUrl}`;
}


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

    // Konwertuj wszystkie względne URL-e obrazków na absolutne
    const exercisesWithAbsoluteUrls = data.map(exercise => ({
      ...exercise,
      image: getAbsoluteImageUrl(exercise.image)
    }));

    // Debug: sprawdź przykładowy URL obrazka
    if (__DEV__ && exercisesWithAbsoluteUrls.length > 0) {
      console.log('Sample exercise image URL (after conversion):', exercisesWithAbsoluteUrls[0].image);
      console.log('Sample exercise:', {
        name: exercisesWithAbsoluteUrls[0].name,
        image: exercisesWithAbsoluteUrls[0].image,
        category: exercisesWithAbsoluteUrls[0].category
      });
    }

    return exercisesWithAbsoluteUrls;
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

    // Konwertuj URL-e obrazków w exercises na absolutne (jeśli workout zawiera exercises)
    if (data.exercises && Array.isArray(data.exercises)) {
      data.exercises = data.exercises.map(exercise => ({
        ...exercise,
        image: getAbsoluteImageUrl(exercise.image)
      }));
    }

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