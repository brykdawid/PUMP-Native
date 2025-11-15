const API_BASE_URL = 'http://localhost:5000';

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

    console.log('Fetching exercises from:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Exercises fetched:', data.length);

    return data;
  } catch (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }
}

export async function generateWorkout(categories) {
  try {
    const url = `${API_BASE_URL}/api/generate-workout`;
    
    console.log('Generating workout for categories:', categories);
    
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
    console.log('Workout generated:', data);
    
    return data;
  } catch (error) {
    console.error('Error generating workout:', error);
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
    console.error('Error fetching categories:', error);
    throw error;
  }
}