# 🚀 Publikacja PUMP Workout na Google Play (bez Android Studio!)

Ten przewodnik pokazuje jak opublikować aplikację na **Google Play Store** używając **Expo EAS Build** - bez potrzeby konfigurowania Android Studio!

---

## ✅ Wymagania

- ✅ Konto Google Play Console ($25 jednorazowo)
- ✅ Zainstalowany Node.js i npm
- ✅ Zainstalowany Expo CLI i EAS CLI
- ✅ Ten projekt (PUMP-Native)
- ✅ System: Linux, Windows, lub Mac (każdy działa!)

---

## 📋 KROK PO KROKU

### **KROK 1: Instalacja narzędzi**

```bash
# Zainstaluj EAS CLI globalnie
npm install -g eas-cli

# Zaloguj się do Expo
npx expo login

# Sprawdź czy jesteś zalogowany
npx expo whoami
```

---

### **KROK 2: Rejestracja w Google Play Console**

1. **Zarejestruj się w Google Play Console:**
   - Wejdź na: https://play.google.com/console/signup
   - Koszt: **$25 jednorazowo** (płatność na zawsze!)
   - Czas aktywacji: **natychmiastowy**

2. **Zaakceptuj umowy:**
   - Developer Distribution Agreement
   - Ustaw dane płatnicze (jeśli planujesz płatną aplikację)

3. **Zweryfikuj tożsamość:**
   - Google może poprosić o weryfikację tożsamości (dokument ID)
   - Proces zajmuje 1-2 dni robocze

---

### **KROK 3: Utwórz aplikację w Google Play Console**

1. **Wejdź na:** https://play.google.com/console

2. **Kliknij "Create app" (Utwórz aplikację)**

3. **Wypełnij formularz:**
   - **App name:** `PUMP Workout`
   - **Default language:** Polish (Polski)
   - **App or game:** App
   - **Free or paid:** Free
   - **Declarations:**
     - ✅ Developer Program Policies
     - ✅ US export laws

4. **Kliknij "Create app"**

---

### **KROK 4: Skonfiguruj Google Cloud Service Account**

To jest najważniejszy krok - potrzebny do automatycznego wysyłania aplikacji przez EAS.

#### 4.1. Włącz Google Play Android Developer API

1. **Wejdź na Google Play Console:**
   - https://play.google.com/console
   - Wybierz swoją aplikację

2. **Przejdź do:**
   ```
   Settings (Ustawienia) > API access (Dostęp do API)
   ```

3. **Jeśli nie masz jeszcze połączonego projektu Google Cloud:**
   - Kliknij **"Link to a Google Cloud project"**
   - Wybierz istniejący projekt lub utwórz nowy
   - Kliknij **"Link"**

4. **Włącz Google Play Android Developer API:**
   - Kliknij link do Google Cloud Console
   - Włącz **"Google Play Android Developer API"**

#### 4.2. Utwórz Service Account

1. **W sekcji "Service accounts" na stronie API access:**
   - Kliknij **"Create new service account"**

2. **Zostaniesz przekierowany do Google Cloud Console:**
   - Kliknij **"+ CREATE SERVICE ACCOUNT"**

3. **Wypełnij formularz:**
   - **Service account name:** `pump-workout-publisher`
   - **Service account ID:** `pump-workout-publisher` (automatycznie)
   - **Description:** `EAS Build automatic submission to Google Play`

4. **Kliknij "CREATE AND CONTINUE"**

5. **Nadaj uprawnienia:**
   - **Select a role:** Wybierz **"Service Account User"**
   - Kliknij **"CONTINUE"**
   - Kliknij **"DONE"**

#### 4.3. Wygeneruj JSON Key

1. **Znajdź utworzone Service Account:**
   - W Google Cloud Console > IAM & Admin > Service Accounts
   - Znajdź `pump-workout-publisher@...`

2. **Kliknij na email Service Account**

3. **Przejdź do zakładki "KEYS"**

4. **Kliknij "ADD KEY" > "Create new key"**

5. **Wybierz format JSON**

6. **Kliknij "CREATE"**
   - Plik `service-account-key-xxxxx.json` zostanie pobrany
   - **⚠️ To jedyna kopia! Zachowaj bezpiecznie!**

#### 4.4. Nadaj uprawnienia w Google Play Console

1. **Wróć do Google Play Console:**
   - Settings > API access
   - Znajdź utworzone Service Account na liście

2. **Kliknij na Service Account**

3. **Przejdź do zakładki "App permissions"**

4. **Kliknij "Add app" i wybierz "PUMP Workout"**

5. **Nadaj uprawnienia:**
   - W sekcji "Account permissions" włącz:
     - ✅ **View app information and download bulk reports**
     - ✅ **Create and edit draft apps**
     - ✅ **Release apps to testing tracks**
     - ✅ **Release apps to production**

6. **Kliknij "Apply"**

7. **Kliknij "Save changes"**

---

### **KROK 5: Skonfiguruj credentials w projekcie**

1. **Zmień nazwę pobranego pliku na `service-account.json`:**

```bash
# Przykład:
mv ~/Downloads/service-account-key-xxxxx.json ./private/service-account.json
```

2. **Sprawdź strukturę `private/`:**

```bash
ls -la private/
```

Powinno być:
```
private/
├── README.md
├── AuthKey_XXXXX.p8 (iOS)
└── service-account.json (Android)
```

3. **Upewnij się że `eas.json` ma poprawną konfigurację:**

Plik już jest skonfigurowany:
```json
"submit": {
  "production": {
    "android": {
      "serviceAccountKeyPath": "./private/service-account.json"
    }
  }
}
```

---

### **KROK 6: Przygotuj metadane aplikacji**

Przed pierwszym buildem uzupełnij podstawowe informacje w Google Play Console:

#### 6.1. Store listing (Prezentacja w sklepie)

```
Google Play Console > PUMP Workout > Main store listing
```

**Wymagane pola:**
- **App name:** `PUMP Workout`
- **Short description** (80 znaków):
  ```
  AI-powered workout companion. Track exercises and achieve your fitness goals.
  ```
- **Full description** (4000 znaków):
  ```
  PUMP Workout to Twój osobisty trener treningowy w kieszeni!

  🏋️ FUNKCJE:
  • Tworzenie własnych planów treningowych
  • Śledzenie postępów i statystyk
  • Biblioteka ćwiczeń z opisami
  • Timer i licznik powtórzeń
  • Historia treningów

  💪 DLA KOGO?
  • Początkujących - rozpocznij swoją przygodę z siłownią
  • Zaawansowanych - planuj złożone treningi
  • Każdego kto chce kontrolować swoje postępy

  🎯 CELE:
  • Budowa masy mięśniowej
  • Redukcja tkanki tłuszczowej
  • Poprawa kondycji
  • Zdrowy styl życia

  Dołącz do tysięcy użytkowników którzy osiągnęli swoje cele fitness z PUMP Workout!
  ```

- **App icon:** 512x512 PNG (już masz w `assets/icon.png`)
- **Feature graphic:** 1024x500 JPG/PNG (stwórz w Canva lub Figma)

**Screenshoty (wymagane minimum 2):**
- Telefon: 1080x1920 lub podobne proporcje (Android)
- Tablet: opcjonalnie

#### 6.2. Content rating (Ocena treści)

```
Google Play Console > PUMP Workout > Content rating > Start questionnaire
```

1. **Kliknij "Start questionnaire"**
2. **Email address:** twój email
3. **Category:** Select **"Utility, Productivity, Communication, or Other"**
4. Odpowiedz na pytania (prawdopodobnie "NO" dla większości)
5. **Zapisz** i **Submit**

Ocena powinna być: **Everyone** lub **PEGI 3**

#### 6.3. Privacy Policy

```
Google Play Console > PUMP Workout > App content > Privacy Policy
```

1. **Kliknij "Start"**
2. **Privacy policy URL:**
   - Użyj linku do swojej Privacy Policy
   - W projekcie jest: `PRIVACY_POLICY.md`
   - Opublikuj na GitHub Pages lub własnej stronie
   - Przykład: `https://yourdomain.com/privacy-policy`

#### 6.4. App access (Dostęp do aplikacji)

```
Google Play Console > PUMP Workout > App content > App access
```

- Jeśli aplikacja jest w pełni dostępna bez logowania: **"All functionality is available without restrictions"**
- Jeśli wymaga logowania: zaznacz i podaj test credentials

#### 6.5. Ads (Reklamy)

```
Google Play Console > PUMP Workout > App content > Ads
```

- **Does your app contain ads?** → NO (jeśli nie masz reklam)

#### 6.6. Target audience and content

```
Google Play Console > PUMP Workout > App content > Target audience
```

- **Target age:** 18+ (lub 13+ jeśli odpowiednie)
- **Younger users:** NO (jeśli nie targetujesz dzieci)

---

### **KROK 7: Zbuduj aplikację (bez Android Studio!)**

EAS Build zbuduje aplikację w chmurze Google:

```bash
# Zbuduj wersję produkcyjną dla Android
npm run build:android

# Lub bezpośrednio:
eas build --platform android --profile production
```

**Co się dzieje:**
- ✅ EAS wysyła kod do chmury
- ✅ Build jest tworzony na serwerach Android w chmurze
- ✅ Po ~10-15 minutach otrzymasz link do pobrania `.aab` (Android App Bundle)
- ✅ Plik będzie automatycznie przygotowany do Google Play

**Opcje podczas pierwszego buildu:**
- `Would you like to automatically create a keystore?` → **YES**
- EAS wygeneruje i przechowa keystore za Ciebie (bardzo ważne!)
- Ten sam keystore będzie używany do wszystkich przyszłych aktualizacji

**⚠️ WAŻNE o Keystore:**
- Keystore to klucz do podpisywania Twojej aplikacji
- EAS przechowuje go bezpiecznie w chmurze
- Bez keystore nie możesz aktualizować aplikacji!
- NIGDY nie trać keystore (z EAS nie musisz się tym martwić)

---

### **KROK 8: Wyślij do Google Play (pierwszy raz)**

Po zakończeniu buildu:

#### Opcja A: Automatyczne wysłanie (ZALECANE)

```bash
# Automatyczne wysłanie do Google Play
eas submit --platform android

# Lub użyj skryptu:
npm run submit:android
```

**Co się dzieje:**
- ✅ EAS użyje `service-account.json` z `eas.json`
- ✅ Aplikacja zostanie automatycznie przesłana do Google Play Console
- ✅ Po ~2-5 minutach pojawi się w zakładce "Internal testing"

#### Opcja B: Manualne wysłanie (backup)

Jeśli automatyczne submit nie działa:

1. **Pobierz `.aab` z EAS:**
   ```bash
   # Link pojawi się po zakończeniu buildu
   # Pobierz plik na komputer
   ```

2. **Wejdź na Google Play Console:**
   ```
   PUMP Workout > Testing > Internal testing > Create new release
   ```

3. **Prześlij `.aab` file**

4. **Wypełnij Release notes:**
   ```
   Initial release
   - Core workout tracking features
   - Exercise library
   - Custom workout plans
   ```

5. **Kliknij "Save" i "Review release"**

6. **Kliknij "Start rollout to Internal testing"**

---

### **KROK 9: Skonfiguruj Internal Testing**

Internal Testing pozwala testować aplikację przed publiczną publikacją (do 100 testerów).

1. **Wejdź na:**
   ```
   Google Play Console > PUMP Workout > Testing > Internal testing
   ```

2. **Utwórz listę testerów:**
   - Kliknij **"Create email list"**
   - **List name:** `PUMP Workout Team`
   - Dodaj emaile testerów (konta Google)
   - Zapisz

3. **Przeglądaj release:**
   - Release powinien mieć status "In review" lub "Available"
   - Google przetwarza build (~5-20 minut)

4. **Skopiuj link testowy:**
   - Kliknij **"Copy link"** obok listy testerów
   - Wyślij link testerom
   - Przykład: `https://play.google.com/apps/internaltest/...`

5. **Testerzy mogą:**
   - Kliknąć link
   - Zaakceptować zaproszenie
   - Pobrać aplikację z Google Play Store
   - Zobaczyć "(Internal test)" przy nazwie aplikacji

---

### **KROK 10: Promocja do Closed Testing (opcjonalnie)**

Closed Testing pozwala testować z większą grupą (do 100,000 testerów).

1. **Wejdź na:**
   ```
   Google Play Console > PUMP Workout > Testing > Closed testing
   ```

2. **Utwórz track:**
   - **Track name:** `Beta`
   - Kliknij **"Create track"**

3. **Promuj release z Internal testing:**
   - Kliknij **"Promote release"**
   - Wybierz **"Closed testing"**
   - Wybierz track: **Beta**

4. **Dodaj testerów:**
   - Utwórz email list (podobnie jak w Internal testing)
   - Lub użyj **"Countries/regions"** do testowania w wybranych krajach

5. **Review i publish:**
   - Kliknij **"Review and roll out"**
   - Czas przeglądu: **natychmiastowy** (dla testing tracks)

---

### **KROK 11: Promocja do Production (publikacja!)**

Gdy testowanie się skończy, możesz opublikować aplikację publicznie.

#### 11.1. Sprawdź wymagania

```
Google Play Console > PUMP Workout > Dashboard
```

Google pokaże wszystkie wymagane elementy:
- ✅ App access
- ✅ Ads
- ✅ Content rating
- ✅ Target audience
- ✅ News apps (skip if not applicable)
- ✅ COVID-19 contact tracing (skip if not applicable)
- ✅ Data safety
- ✅ Privacy policy
- ✅ Select app category

#### 11.2. Wypełnij Data safety (WAŻNE!)

```
Google Play Console > PUMP Workout > App content > Data safety
```

1. **Czy Twoja aplikacja zbiera dane?**
   - Jeśli używasz AsyncStorage do przechowywania danych lokalnie: **NO**
   - Jeśli wysyłasz dane do backendu: **YES** (opisz jakie)

2. **Przykład dla aplikacji bez backendu:**
   - **No data collected or shared**
   - Zapisz i zatwierdź

#### 11.3. Wybierz kategorię

```
Google Play Console > PUMP Workout > Store settings > Category
```

- **Category:** Health & Fitness
- **Tags:** workout, fitness, gym, exercise

#### 11.4. Promuj do Production

1. **Wejdź na:**
   ```
   Google Play Console > PUMP Workout > Testing > Internal/Closed testing
   ```

2. **Kliknij "Promote release" → "Production"**

3. **Wybierz kraje:**
   - Możesz wybrać wszystkie kraje
   - Lub zacząć od Polski, USA, etc.

4. **Wypełnij Release notes:**
   ```
   🎉 PUMP Workout v1.0

   Witaj w PUMP Workout - Twoim osobistym trenerze fitness!

   ✨ Nowości w tej wersji:
   • Tworzenie własnych planów treningowych
   • Śledzenie ćwiczeń i postępów
   • Biblioteka ćwiczeń z opisami
   • Timer i licznik powtórzeń
   • Historia wszystkich treningów

   💪 Rozpocznij swoją podróż fitness już dziś!
   ```

5. **Kliknij "Review release"**

6. **Kliknij "Start rollout to Production"**

#### 11.5. Przegląd przez Google

- **Czas przeglądu:** 1-7 dni (średnio 2-3 dni)
- **Status:** "In review" → "Publishing" → "Available"
- Otrzymasz email z wynikiem przeglądu
- Google może odrzucić aplikację jeśli:
  - Brak Privacy Policy
  - Naruszenie policy (malware, kontrowersyjne treści)
  - Błędy w metadanych

---

## 🎯 QUICK COMMANDS

### Pełny workflow (build + submit):

```bash
# 1. Zbuduj aplikację w chmurze
npm run build:android

# 2. Poczekaj na zakończenie (~10-15 minut)
# Otrzymasz email: "Your Android build is complete!"

# 3. Wyślij do Google Play
npm run submit:android

# 4. Poczekaj na przetwarzanie w Google Play Console (~5-20 minut)

# 5. Testuj w Internal testing

# 6. Gdy gotowe - promuj do Production
```

### Aktualizacja aplikacji:

```bash
# Zwiększ versionCode w app.json:
# "android": {
#   "versionCode": 2  // było 1
# }

# Lub użyj autoIncrement w eas.json (już skonfigurowane!)
npm run build:android && npm run submit:android
```

---

## 🧪 TESTOWANIE

### Testowanie jako developer (TY):

1. **Zainstaluj z Internal testing:**
   - Otwórz link testowy
   - Zaakceptuj zaproszenie
   - Pobierz z Google Play Store

2. **Aplikacja będzie oznaczona jako "(Internal test)"**

3. **Aktualizacje:**
   - Nowe buildy pojawiają się automatycznie
   - Testerzy otrzymają powiadomienie o aktualizacji

### Zaproszenie innych testerów:

**Internal (do 100 osób):**
```
Google Play Console > Testing > Internal testing > Testers > Create email list
```

**Closed (do 100,000 osób):**
```
Google Play Console > Testing > Closed testing > Create track > Add testers
```

**Open Testing (publiczne beta):**
```
Google Play Console > Testing > Open testing > Create track
```
- Każdy może dołączyć
- Pojawia się w Google Play jako "Beta program"

---

## 🐛 ROZWIĄZYWANIE PROBLEMÓW

### Problem: "Build failed - AAPT: error: resource android:attr/lStar not found"

To problem z wersją SDK. Dodaj do `app.json`:

```json
"android": {
  "compileSdkVersion": 34,
  "targetSdkVersion": 34,
  "buildToolsVersion": "34.0.0"
}
```

### Problem: "Submit failed - Invalid service account credentials"

```bash
# Sprawdź czy plik service-account.json istnieje
ls -la private/service-account.json

# Sprawdź czy ma poprawne uprawnienia w Google Play Console
# Settings > API access > Service accounts > Sprawdź "App permissions"
```

### Problem: "Package name already exists"

- Package name w `app.json` musi być unikalny w całym Google Play
- Zmień: `"package": "com.yourname.pumpworkout"`

### Problem: "Build takes too long"

- Normalny czas: 10-20 minut (Android jest szybsze niż iOS!)
- Sprawdź status: https://expo.dev/accounts/[your-account]/projects/pump-workout/builds

### Problem: "Upload failed - Version code XXX already exists"

- Zwiększ `versionCode` w `app.json`
- Lub usuń niewydany release z Google Play Console

### Problem: "Cannot release to production - missing Store listing"

- Wypełnij wszystkie wymagane pola w:
  - Main store listing
  - Content rating
  - Privacy policy
  - Data safety
  - App category

### Problem: "App rejected by Google"

Najczęstsze powody:
1. **Brak Privacy Policy:** Dodaj URL w App content
2. **Ikona/screenshoty:** Muszą reprezentować faktyczną funkcjonalność
3. **Opisz zbieranie danych:** Data safety questionnaire
4. **Crash przy starcie:** Testuj przed submitem!

---

## 📊 MONITORING

### Sprawdź status buildu:

```bash
# W terminalu zobaczysz link do:
# https://expo.dev/accounts/[account]/projects/pump-workout/builds/[build-id]

# Lista buildów:
eas build:list --platform android
```

### Sprawdź logi:

```bash
# Jeśli build się nie powiedzie
eas build:view [build-id]
```

### Sprawdź status w Google Play Console:

```
Google Play Console > PUMP Workout > Release > Production
```

- **Publishing status:**
  - Draft (szkic)
  - In review (w przeglądzie)
  - Publishing (publikowanie)
  - Available (dostępna)
  - Rejected (odrzucona)

---

## 🎉 SUKCES!

Po wykonaniu wszystkich kroków:

- ✅ Aplikacja jest zbudowana w chmurze (bez Android Studio!)
- ✅ Google Play otrzymał build
- ✅ Możesz testować na prawdziwych urządzeniach Android
- ✅ Możesz zapraszać testerów
- ✅ Możesz iterować z nowymi wersjami
- ✅ Możesz opublikować publicznie!

---

## 📱 PORÓWNANIE TESTOWANIA

| Feature | Internal Testing | Closed Testing | Open Testing | Production |
|---------|-----------------|----------------|--------------|------------|
| Limit testerów | 100 | 100,000 | Unlimited | Unlimited |
| Przegląd Google | ❌ Natychmiastowy | ❌ Natychmiastowy | ✅ 1-3 dni | ✅ 1-7 dni |
| Publiczny dostęp | ❌ Tylko zaproszeni | ❌ Tylko zaproszeni | ✅ Każdy może dołączyć | ✅ Wszyscy |
| Szybkość aktualizacji | ⚡ Instant | ⚡ Instant | ⚡ Fast | 🐢 Review required |

**Zalecana ścieżka:**
1. Internal testing (testuj z zespołem)
2. Closed testing (testuj z większą grupą)
3. Production (publikuj publicznie)

---

## 💡 TIPS & TRICKS

### 1. Użyj Staged Rollout (stopniowe wdrażanie)

Przy pierwszej publikacji możesz wybrać % użytkowników:
```
Production release > Rollout percentage > 10%
```
- Zacznij od 10%, potem zwiększaj do 50%, 100%
- Minimalizuje ryzyko crash'y dla wszystkich użytkowników

### 2. Pre-launch reports (darmowe testy Google)

Google automatycznie testuje Twoją aplikację na prawdziwych urządzeniach:
```
Google Play Console > PUMP Workout > Testing > Pre-launch report
```
- Testy na ~10 różnych urządzeniach
- Automatyczne screenshoty
- Raport crash'y i ostrzeżeń

### 3. App Signing by Google Play (ZALECANE!)

```
Google Play Console > Setup > App signing
```
- Google zarządza signing key
- Możesz stracić upload key, ale nie app key
- Bezpieczniejsze niż własny keystore

### 4. Track release notes w wersji językach

Możesz mieć różne release notes dla różnych języków:
```
Release > Release details > Manage translations
```

### 5. A/B testing dla Store Listing

```
Google Play Console > PUMP Workout > Grow > Store listing experiments
```
- Testuj różne ikony, screenshoty, opisy
- Zobacz co lepiej konwertuje

### 6. Monitoruj crash'e i ANR (App Not Responding)

```
Google Play Console > PUMP Workout > Quality > Crashes and ANRs
```
- Natychmiastowe powiadomienia o crash'ach
- Stack traces do debugowania
- Filtry po wersji, urządzeniu, Android version

### 7. Włącz User acquisition reports

```
Google Play Console > PUMP Workout > Grow > Acquisition reports
```
- Zobacz skąd przychodzą użytkownicy
- Organic vs paid traffic
- Retention metrics

---

## 🆘 POTRZEBUJESZ POMOCY?

- **Expo Docs:** https://docs.expo.dev/build/introduction/
- **EAS Build:** https://docs.expo.dev/submit/android/
- **Google Play Console Help:** https://support.google.com/googleplay/android-developer
- **Policy Guidelines:** https://play.google.com/about/developer-content-policy/

---

## 📈 NASTĘPNE KROKI

### Po publikacji:

- [ ] Monitoruj crash'e i user feedback
- [ ] Odpowiadaj na recenzje (szybko!)
- [ ] Aktualizuj regularnie (co 1-2 tygodnie idealne)
- [ ] Dodaj screenshoty w różnych językach
- [ ] Zoptymalizuj Store listing (ASO - App Store Optimization)
- [ ] Zbieraj feedback i priorytetyzuj features
- [ ] Monitoruj Analytics (Google Analytics, Firebase)

### Marketing:

- [ ] Product Hunt launch
- [ ] Reddit (r/fitness, r/bodybuilding)
- [ ] Instagram/TikTok z demo
- [ ] YouTube tutorial
- [ ] Blog post o developmencie

---

## 🎊 RÓŻNICE iOS vs ANDROID

| Aspekt | Google Play (Android) | App Store (iOS) |
|--------|----------------------|-----------------|
| **Koszt rejestracji** | $25 jednorazowo | $99/rok |
| **Czas review** | 1-7 dni (średnio 2-3) | 1-7 dni (średnio 2-3) |
| **Update review** | Tylko nowe APK | Każdy update |
| **Staged rollout** | ✅ Tak, wbudowane | ✅ Tak, Phased Release |
| **Internal testing** | ✅ Do 100 osób | ✅ Do 100 osób |
| **Closed testing** | ✅ Do 100,000 | ✅ External TestFlight |
| **Beta accessible** | ✅ Public open testing | ✅ Public TestFlight link |
| **Rejections** | Rzadsze | Częstsze (strict guidelines) |
| **Dashboard analytics** | ✅ Bardzo szczegółowe | ✅ Podstawowe |

---

**Powodzenia z publikacją PUMP Workout na Google Play Store! 🚀💪**

**Pamiętaj:**
- Testuj dokładnie przed production
- Odpowiadaj na recenzje użytkowników
- Aktualizuj regularnie
- Monitoruj crash'e
- Słuchaj feedbacku

**Aplikacja jest gotowa do publikacji, kiedy ty jesteś gotowy! 🎉**
