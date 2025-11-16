# Usprawnienia wydajności API i ładowania GIF-ów

## Problem
Fly.io API charakteryzuje się niestabilną wydajnością - czasami wszystko ładuje się szybko, ale po chwili działa wolno lub GIF-y w ogóle się nie ładują.

## Rozwiązanie

### 1. **Wielowarstwowy system cache'owania** (`src/utils/apiCache.js`)

#### Memory Cache (RAM)
- Bardzo szybki dostęp do często używanych danych
- LRU (Least Recently Used) eviction - automatyczne usuwanie najstarszych wpisów
- Limit: 100 wpisów w pamięci

#### Persistent Cache (AsyncStorage/localStorage)
- Dane przetrwają restart aplikacji
- Automatyczne wygasanie (TTL - Time To Live):
  - Ćwiczenia: 30 minut
  - Workouty: 5 minut
  - Wyszukiwania: 10 minut

#### Stale-While-Revalidate
- Natychmiast zwraca dane z cache
- W tle odświeża jeśli wygasły
- Jeśli API nie odpowiada, używa przestarzałych danych (lepsze niż brak danych)

### 2. **Adaptive Timeouts** - Dynamiczne timeouty

System monitoruje jakość sieci i automatycznie dostosowuje timeouty:
- **FAST** (<1s): 5s timeout
- **NORMAL** (1-3s): 10s timeout
- **SLOW** (3-8s): 20s timeout
- **POOR** (>8s): 30s timeout

### 3. **Request Deduplication** - Zapobieganie duplikatom

Jeśli wysłano już żądanie do tego samego endpointu, kolejne żądania czekają na wynik pierwszego zamiast wysyłać nowe requesty.

### 4. **Image Prefetching** (`src/utils/imagePrefetch.js`)

#### Inteligentne ładowanie obrazków
- Automatyczne prefetch'owanie GIF-ów w tle
- Kolejka priorytetowa (ważniejsze obrazki jako pierwsze)
- Limit równoczesnych pobrań (3 jednocześnie)
- Retry logic z automatycznymi ponowieniami

#### Prefetch na starcie aplikacji
- `App.js`: Prefetch wszystkich ćwiczeń przy uruchomieniu
- `GeneratedWorkout.js`: Prefetch obrazków po załadowaniu listy ćwiczeń

### 5. **Optymalizacje API** (`src/services/api.js`)

#### Wszystkie główne funkcje teraz używają cache:
```javascript
fetchExercises()       // Cache: 30 min
generateWorkout()      // Cache: 5 min
fetchExerciseById()    // Cache: 30 min
searchExercises()      // Cache: 10 min
```

#### Nowe funkcje zarządzania cache:
```javascript
clearApiCache()        // Wyczyść cały cache
clearEndpointCache()   // Wyczyść konkretny endpoint
getCacheStats()        // Statystyki cache
prefetchExercises()    // Prefetch w tle
```

## Rezultaty

### ✅ Przed usprawnieniami:
- Każde żądanie API = nowe połączenie do Fly.io
- Timeout: stały 10s
- Brak cache - wszystko pobierane za każdym razem
- GIF-y ładowane on-demand
- Duplikaty requestów przy szybkim klikaniu

### ✅ Po usprawnieniach:
- **Pierwsze żądanie**: Normalne pobieranie z Fly.io
- **Kolejne żądania**: Instant z cache (0ms)
- **Adaptive timeout**: 5-30s w zależności od jakości sieci
- **Stale data**: Przestarzałe dane lepsze niż błąd
- **Prefetch**: GIF-y ładują się w tle przed wyświetleniem
- **Deduplication**: Zero duplikatów

## Użycie

### Automatyczne (nic nie trzeba robić)
Wszystkie usprawnienia działają automatycznie w tle.

### Manualne (opcjonalne)
```javascript
import { clearApiCache, getCacheStats } from './services/api';
import { clearImageCache, getImagePrefetchStats } from './utils/imagePrefetch';

// Wyczyść cache jeśli potrzeba świeżych danych
await clearApiCache();

// Zobacz statystyki
const stats = getCacheStats();
console.log(stats);
// {
//   memory: { size: 45, maxSize: 100, utilization: '45%' },
//   networkQuality: 'NORMAL',
//   adaptiveTimeout: 10000
// }
```

## Monitoring wydajności

W trybie DEV (`__DEV__`), wszystkie operacje są logowane:
- `[MemoryCache]` - Cache w pamięci
- `[PersistentCache]` - Cache w storage
- `[Dedup]` - Deduplikacja requestów
- `[Network]` - Jakość połączenia
- `[ImagePrefetch]` - Prefetch obrazków
- `[ImageLoader]` - Ładowanie z retry

## Techniczne szczegóły

### Cache Keys
Klucze generowane są automatycznie:
```
/exercises -> "exercises{}"
/exercises/123 -> "exercises/123{}"
/generate-workout (categories: ['chest']) -> "generate-workout{\"categories\":[\"chest\"]}"
```

### TTL (Time To Live)
- Rzadko zmieniające się: 30 min (exercises, exercise details)
- Często zmieniające się: 5 min (AI workouts)
- Wyszukiwania: 10 min (search results)

### Network Quality Detection
System uśrednia ostatnie 10 czasów odpowiedzi:
- Próbka 1: 800ms
- Próbka 2: 1200ms
- ...
- Średnia: 1500ms → Quality: NORMAL → Timeout: 10s

## Kompatybilność

✅ React Native (iOS/Android)
✅ React Native Web
✅ Expo Go
✅ Production builds

## Bezpieczeństwo

- Żadne dane wrażliwe nie są cache'owane
- Cache automatycznie wygasa (TTL)
- Możliwość manualnego wyczyszczenia
- Storage izolowany per użytkownik

## Kolejne kroki (opcjonalne)

Możliwe dalsze usprawnienia:
1. Kompresja danych w cache (gzip)
2. Offline mode - pełna aplikacja bez sieci
3. Background sync - synchronizacja w tle
4. Service Worker dla web (PWA)
5. CDN dla statycznych GIF-ów
