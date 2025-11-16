# PUMP-Native React App - API Architecture Analysis

## Executive Summary

The PUMP-Native React app uses a Fly.io-hosted AI API backend for exercise data and workout generation. The app implements sophisticated caching, performance optimization, and adaptive timeout mechanisms to handle unstable API connections on Fly.io's free tier.

**⚠️ CRITICAL ISSUE FOUND:** Two different API URLs are being used in the codebase without consistent cache management.

---

## 1. API ENDPOINTS & SERVICES

### Primary API Service (with caching)
**Base URL:** `https://ai-api-drlzza.fly.dev/api`
**Location:** `/src/services/api.js`

#### Endpoints:
1. **GET `/health`**
   - Health check to verify API is running
   - Used before making requests
   - Timeout: 5 seconds

2. **GET `/exercises`**
   - Fetch all exercises from database
   - Used in: Library, Custom Workout Builder, Muscle Group Selector
   - Cache TTL: 30 minutes
   - Response: Array of exercise objects with name, category, image, description

3. **GET `/exercises/{exerciseId}`**
   - Fetch single exercise by ID
   - Cache TTL: 30 minutes
   - Used for detailed exercise views

4. **GET `/exercises/search?q={query}`**
   - Search exercises by name or keyword
   - Cache TTL: 10 minutes
   - Used in: Library search functionality

5. **POST `/generate-workout`**
   - AI-powered workout generation
   - Request body: `{ categories: [], num_exercises: number }`
   - Cache TTL: 5 minutes
   - Used in: GeneratedWorkout screen
   - **CRITICAL AI ENDPOINT**

6. **GET `/categories`**
   - Get available muscle group categories
   - No cache TTL defined
   - Used in: MuscleGroupSelector

### Secondary API Service (WITHOUT caching) ⚠️
**Base URL:** `https://ai-api-zljd-a.fly.dev` (different from primary!)
**Location:** `/src/utils/apiHelpers.js`
**Functions:**
- `getExercises(categories, limit)` - fetches exercises
- `generateWorkout(categories)` - generates AI workout
- `getCategories()` - fetches categories

**ISSUE:** This duplicates functionality from primary API but:
- Does NOT use the cache management system
- Points to DIFFERENT API endpoint
- Used by: LibraryPage, MuscleGroupSelector, GeneratedWorkout

---

## 2. CURRENT API CONFIGURATION

### Production API URLs
```javascript
// In src/services/api.js
const PRODUCTION_API_URL = 'https://ai-api-drlzza.fly.dev/api';

// In src/utils/apiHelpers.js  
const API_BASE_URL = 'https://ai-api-zljd-a.fly.dev';  // DIFFERENT!
```

### Development Configuration
```javascript
// Local development (currently disabled)
const PHYSICAL_DEVICE_API_URL = 'http://192.168.1.100:5000/api';
const DEVELOPMENT_API_URL = 'http://localhost:5000/api';

// Note: Development mode always uses PRODUCTION_API_URL per code comments
```

### Environment
- Currently hardcoded (not using .env files)
- `app.json` doesn't define environment variables
- `.env.example` documents expected structure but isn't used

---

## 3. CACHING ARCHITECTURE

### Multi-Layer Caching System (`/src/utils/apiCache.js`)

#### Layer 1: Memory Cache
- **Speed:** Ultra-fast (0ms lookups)
- **Capacity:** 100 entries max
- **Eviction:** LRU (Least Recently Used)
- **Persistence:** Lost on app restart
- **Use:** Most frequently accessed data

#### Layer 2: Persistent Cache
- **Speed:** Fast (AsyncStorage reads)
- **Capacity:** 500 entries max
- **Persistence:** Survives app restart
- **Storage:** Device AsyncStorage
- **Use:** Secondary fallback cache

#### Layer 3: Stale-While-Revalidate
- **Strategy:** Return cached data even if expired, refresh in background
- **Benefit:** Instant user feedback + fresh data on next load
- **Fallback:** If API fails and cache expired, serve stale data anyway

### Cache TTL (Time To Live)
```javascript
TTL: {
  EXERCISES: 30 * 60 * 1000,        // 30 min - rarely changes
  WORKOUT: 5 * 60 * 1000,           // 5 min - dynamically generated
  SEARCH: 10 * 60 * 1000,           // 10 min - search results
  IMAGE_METADATA: 60 * 60 * 1000,   // 1 hour - image metadata
}
```

### Cache Key Generation
Cache keys are automatically generated from endpoint + parameters:
```
/exercises → "exercises{}"
/exercises/123 → "exercises/123{}"
/generate-workout (categories: ['chest']) → "generate-workout{\"categories\":[\"chest\"]}"
```

---

## 4. PERFORMANCE OPTIMIZATIONS

### 4.1 Adaptive Timeouts
Monitors network quality and dynamically adjusts timeouts:

```javascript
Network Quality Detection:
- Samples last 10 responses
- Calculates average response time

Quality Thresholds:
- FAST:    < 1000ms  → 5s timeout
- NORMAL:  1-3s      → 10s timeout  
- SLOW:    3-8s      → 20s timeout
- POOR:    > 8s      → 30s timeout
```

**Purpose:** Handles Fly.io's unstable free tier without causing timeout errors

### 4.2 Request Deduplication
- **Problem:** Multiple clicks trigger duplicate API calls
- **Solution:** If a request is pending, subsequent requests wait for same response
- **Benefit:** Eliminates wasted API calls and bandwidth

### 4.3 Image Prefetching (`/src/utils/imagePrefetch.js`)

#### Prefetch Manager
```javascript
Features:
- Priority queue (high-priority images first)
- Concurrent limit (3 simultaneous prefetches)
- Automatic retry with backoff (up to 3 attempts)
- Tracks prefetched vs failed images
```

#### Image Loading Strategy
1. **On Load:** Load exercises from API
2. **Prefetch:** Queue all exercise GIFs in background
3. **Display:** Show skeleton loaders while prefetching
4. **Cache:** React Native Image.prefetch() handles caching

#### Prefetch Locations
- **App.js:** Prefetch all exercises on app startup
- **GeneratedWorkout.js:** Prefetch workout exercise GIFs after generation
- **MuscleGroupSelector.js:** Prefetch category images (native only)

---

## 5. EXTERNAL API DEPENDENCIES

### Primary External Service
**Fly.io Hosting**
- Service: Managed container hosting
- Status: Free tier (unstable performance)
- Hosting: https://ai-api-drlzza.fly.dev
- Issues: 
  - Unpredictable response times (0.5s to 10s+)
  - Cold starts cause delays
  - No SLA for free tier
  - Can cause app to feel slow/broken

### No Third-Party APIs Used
- ❌ No Firebase
- ❌ No AWS
- ❌ No GraphQL
- ❌ No Authentication APIs (no login required)
- ❌ No Analytics APIs
- ✅ Simple REST API only

---

## 6. GIF/IMAGE LOADING & CACHING

### Image URL Processing
1. **API Response:** Server returns relative or absolute URLs
   ```json
   { 
     "name": "Bench Press",
     "image": "/uploads/bench-press.gif"  // relative URL
   }
   ```

2. **URL Conversion:** `getAbsoluteImageUrl()` in apiHelpers.js
   ```javascript
   /uploads/bench-press.gif
   → https://ai-api-zljd-a.fly.dev/uploads/bench-press.gif
   ```

3. **React Native Caching:**
   - `Image.prefetch(uri)` - Pre-downloads and caches image
   - Built-in to React Native, stores in app's image cache
   - Automatic, no manual cache management needed

### GIF Display Flow
```
Exercise Data Loaded
    ↓
Image URLs Extracted
    ↓
Images Added to Prefetch Queue
    ↓
Background Download (3 concurrent max)
    ↓
Cached by React Native
    ↓
Instant Display When Needed
```

### Performance Impact
- **GIF Loading:** Typically 1-3 seconds per image on slow connection
- **Prefetch Benefit:** Instant display after generation
- **Fallback:** If GIF fails to load, shows exercise name + description

---

## 7. AI INTEGRATION POINTS

### AI Workout Generation
**Endpoint:** `POST /generate-workout`
**Used By:** GeneratedWorkout screen
**Flow:**
1. User selects muscle groups (e.g., ['chest', 'back'])
2. App calls `generateWorkout(categories, numExercises=3)`
3. Backend AI generates personalized workout
4. Response cached for 5 minutes
5. Exercise GIFs prefetched in background

**Request Example:**
```javascript
POST /generate-workout
Body: {
  categories: ['chest', 'back'],
  num_exercises: 3
}

Response: {
  title: "Chest & Back Workout",
  exercises: [
    {
      name: "Bench Press",
      category: "chest",
      image: "/uploads/bench-press.gif",
      sets: 3,
      reps: "8-10",
      description: "...",
      tips: "..."
    },
    // ... more exercises
  ]
}
```

### AI Backend Details
- **Type:** Unknown (no documentation provided)
- **Framework:** Unknown  
- **ML Model:** Not specified
- **Logic:** Likely uses category + exercise count to select diverse exercises
- **Customization:** Not user-customizable (no parameters for difficulty, time, etc.)

---

## 8. DATA FLOW ARCHITECTURE

### Complete Exercise Data Flow
```
API Server
  ↓
GET /exercises
  ↓
Cache Manager (Memory)
  ↓
Cache Manager (AsyncStorage)
  ↓
Component (Library, Workouts)
  ↓
Image URLs Extracted
  ↓
Image Prefetch Queue
  ↓
React Native Image Cache
  ↓
UI Display (GifModal)
```

### Workout Generation Flow
```
User Selects Categories
  ↓
POST /generate-workout
  ↓
Cache Manager Deduplication Check
  ↓
Network Quality Check → Adaptive Timeout
  ↓
API Response (5-30 seconds typically)
  ↓
Cache Manager (5 min TTL)
  ↓
Extract Exercise GIFs
  ↓
Prefetch Manager (3 concurrent)
  ↓
GeneratedWorkout Display
```

---

## 9. API PERFORMANCE ISSUES & BOTTLENECKS

### Critical Issues

#### 1. **DUPLICATE API ENDPOINTS** ⚠️ HIGH PRIORITY
- `api.js` uses: `https://ai-api-drlzza.fly.dev/api`
- `apiHelpers.js` uses: `https://ai-api-zljd-a.fly.dev` (DIFFERENT!)
- Impact: 
  - Two separate instances serving same data
  - No cache sharing between them
  - Inconsistent exercise data possible
  - Wasted bandwidth
- **Root Cause:** Two separate implementations, likely from different development stages

#### 2. **NO CACHE IN apiHelpers.js** ⚠️ HIGH PRIORITY
- File uses old `fetch()` directly, no cache system
- Every call to `getExercises()` hits the network
- Components using this: LibraryPage, MuscleGroupSelector, GeneratedWorkout
- Impact: Slow, wasteful, poor UX on slow connections
- **Root Cause:** api.js has cache system but apiHelpers.js doesn't use it

#### 3. **Fly.io Free Tier Instability** ⚠️ MEDIUM PRIORITY
- Mentioned in PERFORMANCE_IMPROVEMENTS.md
- Cold starts cause 5-10 second delays
- Inconsistent response times (0.5s to 10s+)
- No SLA for free tier
- Impact: Users perceive app as "broken" during slow periods
- **Solution Attempted:** Adaptive timeouts + cache + stale-while-revalidate

#### 4. **GIF Loading Bottleneck** ⚠️ MEDIUM PRIORITY
- Exercise GIFs are typically 2-5 MB each
- Takes 1-3 seconds per GIF on mobile
- 3 concurrent limit means 10+ GIFs = 30+ seconds
- Impact: GeneratedWorkout takes long time to load all images
- **Mitigation:** Shows skeleton loaders, background prefetch

#### 5. **No Compression** ⚠️ LOW PRIORITY
- JSON responses not gzip-compressed
- GIFs not optimized for mobile
- Image URLs hardcoded (no CDN)
- Impact: Higher bandwidth usage on mobile

---

## 10. CURRENT IMPLEMENTATION ISSUES

### Code Inconsistencies

1. **Two API files with overlapping functionality**
   ```
   /src/services/api.js       - With caching, used by App.js, StatsPage
   /src/utils/apiHelpers.js   - Without caching, used by LibraryPage, MuscleGroupSelector
   ```

2. **Different base URLs**
   ```javascript
   // api.js
   const PRODUCTION_API_URL = 'https://ai-api-drlzza.fly.dev/api';
   
   // apiHelpers.js
   const API_BASE_URL = 'https://ai-api-zljd-a.fly.dev';
   ```

3. **Unused Environment Variables**
   - .env.example defines API_URL but it's never used
   - API URLs hardcoded instead of env-based

4. **Image URL Handling**
   - `apiHelpers.js` has `getAbsoluteImageUrl()` function
   - Only used by apiHelpers functions
   - api.js doesn't convert image URLs

---

## 11. API MONITORING & LOGGING

### Enabled in Development Mode (`__DEV__`)
All operations log to console:

```javascript
[API] - Main API calls
[API CONFIG] - Configuration info
[MemoryCache] - Memory cache hits/misses
[PersistentCache] - AsyncStorage operations
[Dedup] - Request deduplication
[Network] - Network quality updates
[ImagePrefetch] - Image prefetching progress
[ImageLoader] - Image loading with retry
[CacheManager] - Cache operations
```

### Production Mode
All logging disabled (wrapped in `if (__DEV__)`)

### Available Statistics
```javascript
// Cache stats
const stats = getCacheStats();
// {
//   memory: { size: 45, maxSize: 100, utilization: '45%' },
//   networkQuality: 'NORMAL',
//   adaptiveTimeout: 10000
// }

// Image prefetch stats
const imgStats = getImagePrefetchStats();
// {
//   queued: 5,
//   prefetched: 120,
//   failed: 2,
//   active: 1,
//   maxConcurrent: 3
// }
```

---

## 12. SECURITY & PRIVACY

### Data Transmitted to API
- Muscle group categories (array of strings)
- Number of exercises desired (number)
- Search queries (string)
- Exercise IDs (for details)

### Data NOT Transmitted
- ✅ No authentication tokens
- ✅ No user personal data
- ✅ No location data
- ✅ No analytics/tracking
- ✅ No app usage telemetry

### Data Stored Locally
- Exercise cache (AsyncStorage)
- Saved workouts (JSON)
- Workout history (JSON)
- User stats (weight, height, BMI)
- Favorite exercises (array)

---

## 13. DEPENDENCIES & COMPATIBILITY

### Network Libraries
- **No external HTTP library:** Uses native fetch()
- **Timeout handling:** AbortController (native)
- **Caching:** AsyncStorage for persistent
- **Image loading:** React Native Image.prefetch()

### Platforms Tested
- ✅ iOS (Simulator & Physical)
- ✅ Android (Emulator & Physical)
- ✅ Web (React Native Web)
- ✅ Expo Go

### Browser/Runtime Requirements
- Native `fetch()` API (all modern platforms)
- `AbortController` (all modern platforms)
- `AsyncStorage` (via @react-native-async-storage)

---

## 14. RECOMMENDATIONS

### CRITICAL (Fix Immediately)
1. **Consolidate API endpoints**
   - Remove duplicate API files
   - Use single base URL
   - Implement cache system globally
   - Estimated impact: 50% faster app on repeated loads

2. **Standardize image URL handling**
   - Ensure all API responses return absolute URLs
   - Or ensure consistent URL conversion everywhere
   - Remove `getAbsoluteImageUrl()` duplication

### HIGH (Fix Soon)
3. **Migrate to better hosting**
   - Fly.io free tier is unreliable
   - Consider: AWS EC2, Railway.app, or Render.com paid tier
   - Estimated impact: Eliminate 30-50% of timeout issues

4. **Implement request timeout fallback**
   - After 10+ seconds, show error to user
   - Offer "retry" or "use cached data" options
   - Better UX than silent hanging

5. **Add API response validation**
   - Validate exercise data structure
   - Ensure image URLs are valid before prefetch
   - Prevent crashes from malformed responses

### MEDIUM (Consider)
6. **Optimize images**
   - Use WebP format instead of animated GIFs
   - Compress to 500KB-1MB per image
   - Serve multiple resolutions (1x, 2x, 3x)
   - Estimated savings: 70% bandwidth, 3x faster loading

7. **Implement offline mode**
   - Store last 100 exercises in persistent cache
   - Allow workout creation without internet
   - Sync workouts when connection restored

8. **Add analytics**
   - Track API response times
   - Monitor error rates
   - Identify slow endpoints
   - Use Sentry for crash reporting

### OPTIONAL
9. **Use environment variables**
   - Move API URLs to .env or app.json
   - Allow easy switching between dev/prod
   - Support custom API endpoints

10. **Implement GraphQL**
    - Reduce payload size
    - Request only needed fields
    - Single endpoint instead of multiple

---

## APPENDIX: File Summary

```
API Related Files:

/src/services/api.js (450 lines)
  ├─ Main API configuration
  ├─ Cached endpoints (exercises, workout generation)
  ├─ Adaptive timeout logic
  ├─ Cache management functions
  └─ Retry logic

/src/utils/apiHelpers.js (135 lines)
  ├─ Duplicate API functions (NO caching)
  ├─ URL conversion helpers
  └─ Different base URL

/src/utils/apiCache.js (512 lines)
  ├─ Memory cache (LRU eviction)
  ├─ Persistent cache (AsyncStorage)
  ├─ Request deduplication
  ├─ Network quality monitoring
  └─ Cache statistics

/src/utils/imagePrefetch.js (343 lines)
  ├─ Image prefetch queue (priority-based)
  ├─ Concurrent download limiting (3 max)
  ├─ Intelligent image loader with retry
  ├─ Image cache statistics
  └─ Failed image tracking

Component Usage:
/src/App.js
  └─ prefetchExercises() on startup

/src/components/screens/LibraryPage.js
  └─ getExercises() [NO CACHE]

/src/components/screens/MuscleGroupSelector.js
  └─ getExercises() [NO CACHE]

/src/components/screens/StatsPage.js
  └─ fetchExercises() [WITH CACHE]

/src/components/workout/GeneratedWorkout.js
  ├─ getExercises() [NO CACHE]
  └─ prefetchExerciseImages()

/src/components/workout/GifModal.js
  └─ Image.prefetch() for individual GIFs
```

---

**Analysis Date:** November 16, 2025
**App Version:** 1.0.0
**Framework:** React Native 0.81 + Expo 54
**Target Platforms:** iOS, Android, Web

