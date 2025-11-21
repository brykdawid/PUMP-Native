# Przewodnik po Ikonach z Gradientem

Ten przewodnik pokazuje jak używać komponentu `GradientIcon` do nadania wszystkim ikonom w aplikacji jednolitego wyglądu z gradientem motywu.

## Spis treści

1. [Co zostało dodane](#co-zostało-dodane)
2. [Jak używać GradientIcon](#jak-używać-gradienticon)
3. [Przykłady użycia](#przykłady-użycia)
4. [Dostępne gradienty](#dostępne-gradienty)
5. [Jak zamienić istniejące ikony](#jak-zamienić-istniejące-ikony)

---

## Co zostało dodane

### 1. System motywu (`src/styles/theme.js`)

Scentralizowany system motywu zawierający:
- **Kolory** - wszystkie kolory używane w aplikacji
- **Gradienty** - predefiniowane gradienty dla różnych kontekstów
- **Rozmiary ikon** - standardowe rozmiary (xs, sm, md, lg, xl, xxl)
- **Kierunki gradientów** - vertical, horizontal, diagonal
- **Spacing i border radius** - standardowe wartości

```javascript
import { gradients, colors, iconSizes } from '../styles/theme';
```

### 2. Komponent GradientIcon (`src/components/common/GradientIcon.js`)

Komponent opakowujący ikony Ionicons w gradient z motywu.

**Właściwości:**
- `name` (string, wymagane) - nazwa ikony z Ionicons
- `size` (number) - rozmiar ikony (domyślnie: 24)
- `iconColor` (string) - kolor ikony (domyślnie: '#ffffff')
- `gradientColors` (array) - kolory gradientu (domyślnie: gradient główny)
- `gradientDirection` (object) - kierunek gradientu
- `containerSize` (number) - rozmiar kontenera
- `borderRadius` (number) - zaokrąglenie rogów (domyślnie: 12)
- `style` (object) - dodatkowe style kontenera
- `iconStyle` (object) - dodatkowe style ikony

### 3. Ekran demonstracyjny (`src/components/screens/GradientIconDemo.js`)

Pełny ekran pokazujący wszystkie możliwości komponentu z przykładami kodu.

---

## Jak używać GradientIcon

### Podstawowe użycie

```javascript
import { GradientIcon } from '../components/common';

// Najprostsze użycie - ikona z domyślnym gradientem motywu
<GradientIcon name="barbell" size={48} />
```

### Z niestandardowym gradientem

```javascript
import { GradientIcon } from '../components/common';
import { gradients } from '../styles/theme';

// Ikona z gradientem sukcesu (zielony)
<GradientIcon
  name="checkmark-circle"
  size={32}
  gradientColors={gradients.success}
/>

// Ikona z gradientem niebezpieczeństwa (czerwony)
<GradientIcon
  name="close-circle"
  size={32}
  gradientColors={gradients.danger}
/>
```

### Z niestandardowym kierunkiem

```javascript
import { GradientIcon } from '../components/common';
import { gradients, gradientDirections } from '../styles/theme';

<GradientIcon
  name="trending-up"
  size={48}
  gradientColors={gradients.primary}
  gradientDirection={gradientDirections.diagonal}
/>
```

---

## Przykłady użycia

### Przykład 1: Ikony w nawigacji dolnej (App.js)

**PRZED:**
```javascript
<Ionicons
  name="library-outline"
  size={24}
  color={currentTab === 'library' ? '#9333ea' : '#9ca3af'}
/>
```

**PO:**
```javascript
import { GradientIcon } from './components/common';
import { gradients } from './styles/theme';

{currentTab === 'library' ? (
  <GradientIcon
    name="library"
    size={24}
    gradientColors={gradients.primary}
    borderRadius={8}
    containerSize={40}
  />
) : (
  <Ionicons
    name="library-outline"
    size={24}
    color="#9ca3af"
  />
)}
```

### Przykład 2: Ikony w kartach treningowych

**PRZED:**
```javascript
<Ionicons name="barbell" size={32} color="#9333ea" />
```

**PO:**
```javascript
<GradientIcon name="barbell" size={32} />
```

### Przykład 3: Ikony akcji z różnymi gradientami

```javascript
// Rozpocznij trening - gradient sukcesu
<GradientIcon
  name="play-circle"
  size={48}
  gradientColors={gradients.success}
/>

// Usuń trening - gradient niebezpieczeństwa
<GradientIcon
  name="trash"
  size={24}
  gradientColors={gradients.danger}
/>

// Edytuj trening - gradient informacyjny
<GradientIcon
  name="create"
  size={24}
  gradientColors={gradients.info}
/>
```

---

## Dostępne gradienty

Import:
```javascript
import { gradients } from '../styles/theme';
```

### Gradienty główne:

| Gradient | Kolory | Użycie |
|----------|--------|--------|
| `gradients.primary` | Fioletowy (#9333ea → #7c3aed) | Główny motyw aplikacji |
| `gradients.success` | Zielony (#16a34a → #15803d) | Sukces, potwierdzenia |
| `gradients.danger` | Czerwony (#ef4444 → #dc2626) | Usuwanie, ostrzeżenia |
| `gradients.warning` | Pomarańczowy (#ea580c → #c2410c) | Planowanie, przypomnienia |
| `gradients.info` | Niebieski (#0891b2 → #0e7490) | Informacje, statystyki |
| `gradients.dark` | Ciemny (#1f2937 → #111827) | Nagłówki, kontrast |
| `gradients.light` | Jasny (#f3e8ff → #fce7f3) | Tła jasne, subtelne akcenty |
| `gradients.profile` | Różowo-fioletowy (#a855f7 → #ec4899) | Profil, personalizacja |

### Kierunki gradientów:

```javascript
import { gradientDirections } from '../styles/theme';

gradientDirections.vertical       // Góra → Dół
gradientDirections.horizontal     // Lewo → Prawo
gradientDirections.diagonal       // Lewy górny → Prawy dolny
gradientDirections.diagonalReverse // Prawy górny → Lewy dolny
```

---

## Jak zamienić istniejące ikony

### Krok 1: Znajdź ikony do zamiany

Użyj wyszukiwania w edytorze:
```
Szukaj: <Ionicons
```

### Krok 2: Dodaj import

Na początku pliku dodaj:
```javascript
import { GradientIcon } from '../common'; // lub odpowiednia ścieżka
import { gradients } from '../../styles/theme';
```

### Krok 3: Zastąp ikony

**Schemat zamiany:**

```javascript
// STARA IKONA:
<Ionicons name="flash" size={48} color="#9333ea" />

// NOWA IKONA:
<GradientIcon name="flash" size={48} />
```

**Dla ikon warunkowych:**

```javascript
// STARA IKONA:
<Ionicons
  name={isActive ? "checkmark-circle" : "circle-outline"}
  size={24}
  color={isActive ? '#16a34a' : '#9ca3af'}
/>

// NOWA IKONA:
{isActive ? (
  <GradientIcon
    name="checkmark-circle"
    size={24}
    gradientColors={gradients.success}
  />
) : (
  <Ionicons name="circle-outline" size={24} color="#9ca3af" />
)}
```

### Krok 4: Testuj

Uruchom aplikację i sprawdź czy ikony wyglądają dobrze:
```bash
npm start
```

---

## Kiedy NIE używać GradientIcon

Nie używaj GradientIcon gdy:

1. **Ikona jest już na gradientowym tle** (np. w LandingPage.js)
   ```javascript
   // NIE ZMIENIAJ - ikona jest już na gradiencie
   <LinearGradient colors={['#9333ea', '#7c3aed']} style={styles.modeGradient}>
     <Ionicons name="flash" size={48} color="#ffffff" />
   </LinearGradient>
   ```

2. **Ikona jest nieaktywna/szara** (np. w nawigacji)
   ```javascript
   // Zostaw jako normalną ikonę
   <Ionicons name="library-outline" size={24} color="#9ca3af" />
   ```

3. **Ikona jest małym akcentem** (np. strzałki, chevron)
   ```javascript
   // Małe ikony dekoracyjne - zostaw jako Ionicons
   <Ionicons name="chevron-forward" size={16} color="#6b7280" />
   ```

---

## Wskazówki

### 1. Konsystencja rozmiaru kontenera

Dla lepszego wyglądu, container powinien być ~1.8x większy niż ikona:
```javascript
<GradientIcon
  name="barbell"
  size={40}
  containerSize={72} // 40 * 1.8 = 72
/>
```

### 2. Zaokrąglenie dla różnych rozmiarów

| Rozmiar ikony | Sugerowane borderRadius |
|---------------|-------------------------|
| 16-24px | 8 |
| 24-32px | 12 |
| 32-48px | 16 |
| 48-64px | 20 |
| Okrągłe | 9999 |

### 3. Używanie z TouchableOpacity

```javascript
<TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
  <GradientIcon name="barbell" size={48} />
</TouchableOpacity>
```

---

## FAQ

**Q: Czy mogę zmienić główny gradient motywu?**
A: Tak! Edytuj `src/styles/theme.js` i zmień `gradients.primary`.

**Q: Czy mogę dodać własny gradient?**
A: Tak! Dodaj nowy gradient w `src/styles/theme.js`:
```javascript
export const gradients = {
  // ...
  myCustomGradient: ['#ff0000', '#00ff00'],
};
```

**Q: Jak zrobić ikonę okrągłą zamiast zaokrąglonych rogów?**
A: Ustaw `borderRadius={9999}`:
```javascript
<GradientIcon name="star" size={32} borderRadius={9999} />
```

**Q: Czy mogę użyć GradientIcon z innymi bibliotekami ikon?**
A: Nie bezpośrednio. GradientIcon jest zaprojektowany dla Ionicons. Możesz jednak zmodyfikować komponent.

---

## Ekran demonstracyjny

Aby zobaczyć wszystkie możliwości GradientIcon, możesz podejrzeć plik:
```
src/components/screens/GradientIconDemo.js
```

Ten plik zawiera pełne przykłady wszystkich wariantów użycia.

---

## Podsumowanie

System GradientIcon daje Ci:
- ✅ Jednolity wygląd ikon w całej aplikacji
- ✅ Łatwe stosowanie motywu aplikacji
- ✅ Elastyczność w dostosowywaniu
- ✅ Predefiniowane gradienty dla różnych kontekstów
- ✅ Łatwą zamianę istniejących ikon

**Zaczynając od podstaw:**
```javascript
// 1. Import
import { GradientIcon } from '../components/common';

// 2. Użycie
<GradientIcon name="barbell" size={48} />
```

To wszystko! Twoje ikony mają teraz piękny gradient z motywu aplikacji.
