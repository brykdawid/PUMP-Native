export const TRAINING_TYPES = [
  { id: 'fullbody', name: 'FBW (Full Body)' },
  { id: 'klatka', name: 'Klatka Piersiowa' },
  { id: 'plecy', name: 'Plecy' },
  { id: 'nogi', name: 'Nogi' },
  { id: 'barki', name: 'Barki' },
  { id: 'biceps', name: 'Biceps' },
  { id: 'triceps', name: 'Triceps' },
  { id: 'brzuch', name: 'Brzuch' },
  { id: 'posladki', name: 'Pośladki' },
  { id: 'przedramiona', name: 'Przedramiona' }
];

export const CATEGORY_TO_AI_LABELS = {
  'barki': ['shoulders'],
  'biceps': ['biceps'],
  'brzuch': ['abs'],
  'klatka': ['chest'],
  'nogi': ['legs', 'quads', 'hamstrings', 'calves'],
  'plecy': ['back', 'lats'],
  'posladki': ['glutes'],
  'przedramiona': ['forearms'],
  'triceps': ['triceps']
};

export function getWarmupExercises(selectedTypes, allExercises) {
  const warmupExercises = [];
  
  const generalWarmup = [
    {
      name: 'Jumping Jacks',
      description: 'Klasyczne pajacyki',
      sets: '2-3 serie × 20 powtórzeń'
    },
    {
      name: 'High Knees',
      description: 'Bieg w miejscu z wysokim unoszeniem kolan',
      sets: '2-3 serie × 30 sekund'
    },
    {
      name: 'Arm Circles',
      description: 'Okrężne ruchy ramionami',
      sets: '2 serie × 15 powtórzeń w każdą stronę'
    }
  ];

  const specificWarmups = {
    'klatka': [
      { name: 'Push-ups (lekkie)', description: 'Pompki na kolanach', sets: '2 serie × 10 powtórzeń' }
    ],
    'plecy': [
      { name: 'Scapular Pull-ups', description: 'Uaktywnienie łopatek', sets: '2 serie × 10 powtórzeń' }
    ],
    'nogi': [
      { name: 'Bodyweight Squats', description: 'Przysiady bez obciążenia', sets: '2 serie × 15 powtórzeń' }
    ],
    'barki': [
      { name: 'Arm Circles', description: 'Okrężne ruchy ramionami', sets: '2 serie × 15 powtórzeń' }
    ],
    'brzuch': [
      { name: 'Dead Bug', description: 'Martwy robak', sets: '2 serie × 10 powtórzeń' }
    ]
  };

  warmupExercises.push(...generalWarmup.slice(0, 2));

  selectedTypes.forEach(type => {
    if (specificWarmups[type]) {
      warmupExercises.push(specificWarmups[type][0]);
    }
  });

  return warmupExercises;
}