# PUMP-Native API Implementation - Quick Reference

## Overview
The PUMP React Native app uses a Fly.io-hosted REST API backend with sophisticated multi-layer caching and image prefetching to handle unstable network performance.

---

## API ENDPOINTS SUMMARY

| Endpoint | Method | Purpose | Cache TTL | Location |
|----------|--------|---------|-----------|----------|
| `/health` | GET | Health check | N/A | api.js |
| `/exercises` | GET | All exercises | 30 min | api.js |
| `/exercises/{id}` | GET | Single exercise | 30 min | api.js |
| `/exercises/search?q=` | GET | Search exercises | 10 min | api.js |
| `/generate-workout` | POST | AI workout generation | 5 min | api.js |
| `/categories` | GET | Muscle groups | None | api.js |

**ISSUE:** Same endpoints duplicated in `apiHelpers.js` (different base URL, NO caching)

---

## CRITICAL FINDINGS

### 1. DUPLICATE API ENDPOINTS - HIGH PRIORITY FIX
```javascript
// TWO Different URLs in use:
api.js:          https://ai-api-drlzza.fly.dev/api
apiHelpers.js:   https://ai-api-zljd-a.fly.dev  ← Different!
```
**Impact:** Cache not shared, wasted bandwidth, inconsistent data

### 2. MISSING CACHE IN apiHelpers.js - HIGH PRIORITY FIX
Components using `apiHelpers.js`:
- LibraryPage.js ❌ NO CACHE
- MuscleGroupSelector.js ❌ NO CACHE  
- GeneratedWorkout.js ❌ NO CACHE

Components using `api.js`:
- App.js ✅ WITH CACHE
- StatsPage.js ✅ WITH CACHE

**Impact:** Multiple network calls for same data, poor UX on slow connections

### 3. Fly.io Free Tier Instability - MEDIUM PRIORITY FIX
- Response times: 0.5s to 10+ seconds
- Cold starts: 5-10 second delays
- No SLA for free tier
- **Workaround:** Adaptive timeouts (5s-30s) + cache + stale-while-revalidate

---

## CACHING SYSTEM

### Multi-Layer Architecture
```
Memory Cache (100 entries, LRU)
    ↓
Persistent Cache (AsyncStorage, 500 entries)
    ↓
Request Deduplication (pending requests)
    ↓
Network Quality Monitor (adaptive timeout)
    ↓
Stale-While-Revalidate (serve expired data on failure)
```

### Cache Strategy: Stale-While-Revalidate
1. Return cached data immediately (even if expired)
2. Refresh in background if stale
3. If API fails, serve stale data (better than nothing)

### Performance Impact
- **First Load:** 5-10 seconds (API) + 30-60 seconds (images) = 35-70 seconds
- **Cached Load:** ~0 milliseconds (instant!)
- **Workout Generation:** 15-45 seconds (API + image prefetch)

---

## IMAGE/GIF LOADING SYSTEM

### Prefetch Manager (`imagePrefetch.js`)
- Priority queue (high-priority images first)
- Concurrent limit: 3 simultaneous downloads
- Automatic retry: Up to 3 attempts per image
- Tracks: Prefetched, Failed, Queued

### Image Flow
```
Exercise Data → Extract URLs → Add to Queue → Download (3 concurrent)
                                              ↓
                                        React Native Cache → Instant Display
```

### GIF Performance
- Typical size: 2-5 MB per image
- Download time: 1-3 seconds per image
- With 3 concurrent: 100 images = 30-100 seconds total
- **Mitigation:** Shows skeleton loaders while prefetching

---

## AI INTEGRATION

### Workout Generation Endpoint
```javascript
POST /generate-workout
Body: {
  categories: ['chest', 'back'],   // Muscle groups
  num_exercises: 3                 // Count
}

Response: {
  title: "Workout Name",
  exercises: [
    {
      name: "Exercise Name",
      category: "chest",
      image: "/uploads/exercise.gif",
      sets: 3,
      reps: "8-10",
      description: "...",
      tips: "..."
    }
  ]
}
```

### AI Details
- Backend: Unknown framework (not documented)
- Logic: Selects diverse exercises based on categories + count
- Customization: Limited (no difficulty, time, or equipment params)
- Cache: 5 minutes (dynamic content, expires quickly)

---

## EXTERNAL DEPENDENCIES

### Single External Service
**Fly.io** (Free tier hosting)
- Hosting: https://ai-api-drlzza.fly.dev
- Issue: Unstable, slow, unreliable
- Solution: Use paid tier or migrate to better provider

### No Third-Party APIs
- No Firebase
- No AWS
- No Analytics
- No Authentication
- No GraphQL

### Network Libraries Used
- Native `fetch()` API (built-in)
- `AbortController` for timeout (built-in)
- `AsyncStorage` for persistent cache
- `Image.prefetch()` for image caching

---

## SECURITY & PRIVACY

### Data Transmitted to API
- Muscle group categories (strings)
- Number of exercises (number)
- Search queries (strings)
- Exercise IDs (numbers)

### Data NOT Transmitted
- User credentials (none required)
- Personal information (none required)
- Location data
- Analytics/tracking data
- App usage telemetry

### Data Stored Locally
- Exercise cache (AsyncStorage)
- Workouts (JSON in storage)
- User stats (weight, height, BMI)
- Favorites list

---

## MONITORING & DEBUGGING

### Dev Mode Console Logs (when `__DEV__` = true)
```javascript
[API] - Main API operations
[MemoryCache] - Cache hits/misses
[PersistentCache] - AsyncStorage operations
[Dedup] - Request deduplication
[Network] - Network quality updates
[ImagePrefetch] - Image download progress
[CacheManager] - Cache operations
```

### Available Statistics
```javascript
// Cache stats
const stats = getCacheStats();
// Returns: { memory, networkQuality, adaptiveTimeout }

// Image stats
const imgStats = getImagePrefetchStats();
// Returns: { queued, prefetched, failed, active, maxConcurrent }
```

---

## RECOMMENDATIONS (Priority Order)

### 🔴 CRITICAL (Fix Now)
1. **Consolidate API endpoints** - Remove duplicate URLs
2. **Apply cache to apiHelpers.js** - Share cache system globally
3. **Add image optimization** - WebP, compression, CDN

### 🟡 HIGH (Fix Soon)
4. Migrate to reliable hosting (Railway, Render, AWS)
5. Add response timeout fallback UI
6. Implement response validation
7. Use environment variables for API URLs

### 🟢 MEDIUM (Consider)
8. Implement offline mode
9. Add error reporting (Sentry)
10. Optimize image size (70% bandwidth savings)
11. Implement GraphQL (reduce payload)

---

## FILE LOCATIONS

### API Implementation
- `/src/services/api.js` - Main API with cache (450 lines)
- `/src/utils/apiHelpers.js` - Secondary API without cache (135 lines)
- `/src/utils/apiCache.js` - Cache system (512 lines)
- `/src/utils/imagePrefetch.js` - Image prefetch system (343 lines)

### Component Usage
- `App.js` - Prefetch exercises on startup
- `LibraryPage.js` - Browse all exercises (uncached)
- `MuscleGroupSelector.js` - Select muscle groups (uncached)
- `GeneratedWorkout.js` - Display generated workout (uncached data, cached images)
- `StatsPage.js` - View stats (cached exercises)
- `GifModal.js` - Display exercise GIF

### Documentation
- `PERFORMANCE_IMPROVEMENTS.md` - Cache optimization details
- `API_ANALYSIS.md` - Full analysis report
- `API_ARCHITECTURE.txt` - Architecture diagram

---

## DATA FLOW DIAGRAM

```
User Interaction
  ↓
Component (Library, Workouts, etc)
  ↓
API Service (api.js or apiHelpers.js)
  ↓
Cache Manager (Memory → Persistent → Network)
  ↓
Fly.io Backend (https://ai-api-drlzza.fly.dev/api)
  ↓
Response Processing (convert URLs, etc)
  ↓
Display + Image Prefetch
  ↓
Image Manager (3 concurrent downloads)
  ↓
React Native Image Cache
  ↓
GifModal Component (instant display)
```

---

## KEY METRICS

| Metric | Value | Notes |
|--------|-------|-------|
| API Response Time | 0.5-10+ sec | Fly.io free tier variability |
| Image Size | 2-5 MB | Per exercise GIF |
| Concurrent Downloads | 3 | Max simultaneous prefetch |
| Memory Cache Size | 100 entries | LRU eviction |
| Persistent Cache Size | 500 entries | AsyncStorage |
| Exercises Cache TTL | 30 min | Rarely changes |
| Workout Cache TTL | 5 min | Dynamic content |
| Search Cache TTL | 10 min | Results stability |
| First Load Time | 35-70 sec | Without cache |
| Cached Load Time | ~0 ms | With memory cache |
| Timeout Range | 5-30 sec | Adaptive based on quality |

---

## Known Issues Summary

| Issue | Severity | Impact | Status |
|-------|----------|--------|--------|
| Duplicate API endpoints | CRITICAL | Cache not shared, wasted bandwidth | UNFIXED |
| No cache in apiHelpers.js | CRITICAL | Slow, repeated network calls | UNFIXED |
| Fly.io free tier instability | HIGH | App feels slow/broken | WORKAROUND |
| Large uncompressed GIFs | HIGH | Slow image loading | WORKAROUND |
| No image CDN | MEDIUM | Bandwidth intensive | UNFIXED |
| Hardcoded API URLs | MEDIUM | Hard to switch environments | UNFIXED |

---

**Last Updated:** November 16, 2025  
**App Version:** 1.0.0  
**Framework:** React Native 0.81 + Expo 54

