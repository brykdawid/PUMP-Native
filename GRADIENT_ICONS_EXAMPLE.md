# Przykłady praktycznego użycia GradientIcon

Ten dokument pokazuje konkretne przykłady jak zastosować GradientIcon w różnych częściach aplikacji.

---

## Przykład 1: Nawigacja dolna z aktywnymi ikonami gradientowymi

### Plik: `src/App.js` (linie 577-689)

**PRZED:**
```javascript
<TouchableOpacity
  onPress={() => handleTabChange('library')}
  style={styles.navButton}
>
  <Ionicons
    name="library-outline"
    size={24}
    color={currentTab === 'library' ? '#9333ea' : '#9ca3af'}
  />
  <Text style={[
    styles.navText,
    currentTab === 'library' && styles.navTextActive
  ]}>
    Biblioteka
  </Text>
</TouchableOpacity>
```

**PO (z GradientIcon):**
```javascript
import { GradientIcon } from './components/common';
import { gradients } from './styles/theme';

<TouchableOpacity
  onPress={() => handleTabChange('library')}
  style={styles.navButton}
>
  {currentTab === 'library' ? (
    <GradientIcon
      name="library"
      size={20}
      gradientColors={gradients.primary}
      borderRadius={8}
      containerSize={36}
    />
  ) : (
    <Ionicons
      name="library-outline"
      size={24}
      color="#9ca3af"
    />
  )}
  <Text style={[
    styles.navText,
    currentTab === 'library' && styles.navTextActive
  ]}>
    Biblioteka
  </Text>
</TouchableOpacity>
```

**Efekt:**
- Aktywna zakładka ma ikonę z gradientem motywu
- Nieaktywna zakładka pozostaje szara (Ionicons)
- Lepszy kontrast wizualny dla aktywnej zakładki

---

## Przykład 2: Przyciski akcji w karcie treningu

### Nowy komponent: `WorkoutActionButtons.js`

```javascript
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { GradientIcon } from '../common';
import { gradients } from '../../styles/theme';

const WorkoutActionButtons = ({ onStart, onEdit, onDelete, onSchedule }) => {
  return (
    <View style={styles.container}>
      {/* Rozpocznij trening */}
      <TouchableOpacity onPress={onStart} style={styles.button}>
        <GradientIcon
          name="play-circle"
          size={28}
          gradientColors={gradients.success}
          borderRadius={12}
        />
        <Text style={styles.buttonText}>Rozpocznij</Text>
      </TouchableOpacity>

      {/* Edytuj */}
      <TouchableOpacity onPress={onEdit} style={styles.button}>
        <GradientIcon
          name="create"
          size={28}
          gradientColors={gradients.info}
          borderRadius={12}
        />
        <Text style={styles.buttonText}>Edytuj</Text>
      </TouchableOpacity>

      {/* Zaplanuj */}
      <TouchableOpacity onPress={onSchedule} style={styles.button}>
        <GradientIcon
          name="calendar"
          size={28}
          gradientColors={gradients.warning}
          borderRadius={12}
        />
        <Text style={styles.buttonText}>Zaplanuj</Text>
      </TouchableOpacity>

      {/* Usuń */}
      <TouchableOpacity onPress={onDelete} style={styles.button}>
        <GradientIcon
          name="trash"
          size={28}
          gradientColors={gradients.danger}
          borderRadius={12}
        />
        <Text style={styles.buttonText}>Usuń</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  button: {
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
});

export default WorkoutActionButtons;
```

**Efekt:**
- Każda akcja ma dedykowany gradient odpowiadający kontekstowi
- Zielony dla rozpoczęcia (sukces)
- Niebieski dla edycji (informacja)
- Pomarańczowy dla planowania (ostrzeżenie)
- Czerwony dla usunięcia (niebezpieczeństwo)

---

## Przykład 3: Karta treningu z ikonami statusu

### Komponent: `WorkoutStatusCard.js`

```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GradientIcon } from '../common';
import { gradients, iconSizes } from '../../styles/theme';

const WorkoutStatusCard = ({ workout }) => {
  const getStatusIcon = () => {
    if (workout.completed) {
      return {
        name: 'checkmark-circle',
        gradient: gradients.success,
      };
    }
    if (workout.scheduled) {
      return {
        name: 'time',
        gradient: gradients.warning,
      };
    }
    return {
      name: 'barbell',
      gradient: gradients.primary,
    };
  };

  const status = getStatusIcon();

  return (
    <View style={styles.card}>
      <GradientIcon
        name={status.name}
        size={iconSizes.xl}
        gradientColors={status.gradient}
        borderRadius={16}
      />
      <View style={styles.info}>
        <Text style={styles.title}>{workout.title}</Text>
        <Text style={styles.subtitle}>
          {workout.exercises.length} ćwiczeń
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default WorkoutStatusCard;
```

**Efekt:**
- Dynamiczny kolor ikony bazujący na statusie treningu
- Zielony (ukończony)
- Pomarańczowy (zaplanowany)
- Fioletowy (domyślny)

---

## Przykład 4: Ikony partii mięśniowych

### Zastosowanie w `MuscleGroupSelector.js`

**PRZED (linia ~43-50):**
```javascript
<LinearGradient
  colors={isFullBodySelected ? ['#16a34a', '#15803d'] : ['#9333ea', '#7e22ce']}
  style={styles.fbwGradient}
>
  <Ionicons
    name={isFullBodySelected ? "checkmark-circle" : "fitness"}
    size={24}
    color="#ffffff"
  />
</LinearGradient>
```

**Możliwe PO (jeśli chcesz inny styl):**
```javascript
import { GradientIcon } from '../common';
import { gradients } from '../../styles/theme';

<View style={styles.fbwContainer}>
  <GradientIcon
    name={isFullBodySelected ? "checkmark-circle" : "fitness"}
    size={24}
    gradientColors={isFullBodySelected ? gradients.success : gradients.primary}
    borderRadius={12}
  />
</View>
```

**UWAGA:** W tym przypadku ikona jest już na gradientowym tle, więc zmiana nie jest konieczna. To tylko przykład jak można by to zmienić jeśli gradient byłby używany tylko dla ikony.

---

## Przykład 5: Mniejsze ikony informacyjne

### Komponent: `ExerciseInfoTags.js`

```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GradientIcon } from '../common';
import { gradients, iconSizes } from '../../styles/theme';

const ExerciseInfoTags = ({ duration, sets, difficulty }) => {
  return (
    <View style={styles.container}>
      {/* Czas */}
      <View style={styles.tag}>
        <GradientIcon
          name="time-outline"
          size={iconSizes.sm}
          gradientColors={gradients.info}
          borderRadius={6}
          containerSize={28}
        />
        <Text style={styles.tagText}>{duration} min</Text>
      </View>

      {/* Serie */}
      <View style={styles.tag}>
        <GradientIcon
          name="barbell-outline"
          size={iconSizes.sm}
          gradientColors={gradients.primary}
          borderRadius={6}
          containerSize={28}
        />
        <Text style={styles.tagText}>{sets} serii</Text>
      </View>

      {/* Trudność */}
      <View style={styles.tag}>
        <GradientIcon
          name="trending-up"
          size={iconSizes.sm}
          gradientColors={gradients.warning}
          borderRadius={6}
          containerSize={28}
        />
        <Text style={styles.tagText}>{difficulty}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
});

export default ExerciseInfoTags;
```

**Efekt:**
- Małe, kolorowe ikony informacyjne
- Każda kategoria ma dedykowany kolor gradientu
- Spójny wygląd z motywem aplikacji

---

## Przykład 6: Empty State z dużą ikoną

### Komponent: `EmptyWorkoutState.js`

```javascript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GradientIcon } from '../common';
import { gradients, iconSizes } from '../../styles/theme';

const EmptyWorkoutState = ({ onCreateWorkout }) => {
  return (
    <View style={styles.container}>
      <GradientIcon
        name="barbell"
        size={iconSizes.xxl}
        gradientColors={gradients.primary}
        borderRadius={24}
        containerSize={120}
      />
      <Text style={styles.title}>Brak treningów</Text>
      <Text style={styles.subtitle}>
        Rozpocznij swoją podróż fitness tworząc pierwszy trening
      </Text>
      <TouchableOpacity
        onPress={onCreateWorkout}
        style={styles.button}
        activeOpacity={0.8}
      >
        <GradientIcon
          name="add-circle"
          size={24}
          gradientColors={gradients.success}
          borderRadius={10}
        />
        <Text style={styles.buttonText}>Stwórz trening</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});

export default EmptyWorkoutState;
```

**Efekt:**
- Duża, atrakcyjna ikona jako główny element empty state
- Mniejsza ikona akcji w przycisku
- Wizualnie atrakcyjny i zachęcający do akcji

---

## Przykład 7: Lista kategorii ćwiczeń

### Komponent: `ExerciseCategoryGrid.js`

```javascript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GradientIcon } from '../common';
import { gradients } from '../../styles/theme';

const CATEGORIES = [
  { id: 'chest', name: 'Klatka', icon: 'body', gradient: gradients.primary },
  { id: 'back', name: 'Plecy', icon: 'fitness', gradient: gradients.info },
  { id: 'legs', name: 'Nogi', icon: 'walk', gradient: gradients.success },
  { id: 'arms', name: 'Ramiona', icon: 'barbell', gradient: gradients.warning },
  { id: 'shoulders', name: 'Barki', icon: 'triangle', gradient: gradients.danger },
  { id: 'core', name: 'Brzuch', icon: 'ellipse', gradient: gradients.profile },
];

const ExerciseCategoryGrid = ({ onSelectCategory }) => {
  return (
    <View style={styles.grid}>
      {CATEGORIES.map(category => (
        <TouchableOpacity
          key={category.id}
          onPress={() => onSelectCategory(category.id)}
          style={styles.categoryCard}
          activeOpacity={0.7}
        >
          <GradientIcon
            name={category.icon}
            size={36}
            gradientColors={category.gradient}
            borderRadius={16}
          />
          <Text style={styles.categoryName}>{category.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
  },
  categoryCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});

export default ExerciseCategoryGrid;
```

**Efekt:**
- Siatka kolorowych kategorii
- Każda kategoria ma unikalny gradient
- Spójny system wizualny

---

## Wskazówki implementacji

### 1. Stopniowa migracja
Nie musisz zmieniać wszystkich ikon naraz. Zacznij od:
1. Nawigacji głównej
2. Przycisków akcji
3. Kart treningów
4. Pozostałe ikony

### 2. Testowanie
Po każdej zmianie sprawdź:
- Czy rozmiary są odpowiednie
- Czy kolory pasują do kontekstu
- Czy animacje (jeśli są) działają poprawnie

### 3. Konsystencja
Używaj tych samych gradientów dla podobnych akcji:
- `gradients.success` - zawsze dla pozytywnych akcji (rozpocznij, potwierdź, zapisz)
- `gradients.danger` - zawsze dla destrukcyjnych akcji (usuń, anuluj)
- `gradients.info` - zawsze dla informacyjnych akcji (edytuj, szczegóły)
- `gradients.primary` - dla głównych elementów aplikacji

### 4. Rozmiary
Trzymaj się standardowych rozmiarów z `iconSizes`:
```javascript
iconSizes.xs   // 16px - bardzo małe ikony
iconSizes.sm   // 20px - małe tagi, badges
iconSizes.md   // 24px - standardowe ikony (domyślne)
iconSizes.lg   // 32px - większe przyciski akcji
iconSizes.xl   // 48px - główne elementy, hero sections
iconSizes.xxl  // 64px - empty states, splash screens
```

---

## Podsumowanie

Kluczowe zasady stosowania GradientIcon:

1. ✅ **Używaj** dla samodzielnych ikon (przyciski akcji, karty, nawigacja)
2. ❌ **Nie używaj** gdy ikona jest już na gradientowym tle
3. ✅ **Używaj** spójnych gradientów dla podobnych akcji
4. ✅ **Używaj** standardowych rozmiarów z `iconSizes`
5. ✅ **Używaj** odpowiedniego `borderRadius` dla rozmiaru ikony

Dzięki GradientIcon Twoja aplikacja będzie miała:
- 🎨 Spójny system wizualny
- 🚀 Łatwą możliwość zmiany motywu
- ✨ Profesjonalny, nowoczesny wygląd
- 📱 Lepsze UX dzięki kolorowym wskaźnikom akcji
