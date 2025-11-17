# 🔑 Jak utworzyć Service Account dla Google Play - Prosty przewodnik

## Problem: "Nie mogę znaleźć Service Account"

Service Account NIE jest w Google Play Console - jest w **Google Cloud Console**. Oto dokładne kroki:

---

## 📍 KROK 1: Połącz Google Play z Google Cloud

### 1.1. Wejdź na Google Play Console
```
https://play.google.com/console
```

### 1.2. Wybierz swoją aplikację
- Kliknij na nazwę aplikacji (PUMP Workout)

### 1.3. Przejdź do API access
```
Settings (Ustawienia) → API access (Dostęp do API)
```

### 1.4. Połącz z Google Cloud
**Jeśli widzisz:**
- **"Link to a Google Cloud project"** → Kliknij i wykonaj kroki poniżej
- **"Create new service account"** → Projekt już jest połączony, przejdź do Kroku 2

**Jeśli musisz linkować:**
1. Kliknij **"Link to a Google Cloud project"**
2. Wybierz:
   - **Istniejący projekt** (jeśli masz)
   - **Create new project** (jeśli nie masz) - ZALECANE
3. Nazwa projektu: `pump-workout-production`
4. Kliknij **"Link"**

⏰ **Poczekaj ~30 sekund** aż Google połączy projekty.

---

## 📍 KROK 2: Włącz Google Play Android Developer API

### 2.1. Na stronie API access zobaczysz link:
```
"View in Google Cloud Console" lub podobny
```

### 2.2. Kliknij ten link
- Zostaniesz przekierowany do **Google Cloud Console**
- Jeśli nie, wejdź ręcznie: https://console.cloud.google.com

### 2.3. Włącz API
1. W Google Cloud Console znajdź **"APIs & Services"** w menu (☰)
2. Kliknij **"+ ENABLE APIS AND SERVICES"**
3. Wyszukaj: `Google Play Android Developer API`
4. Kliknij na wynik
5. Kliknij **"ENABLE"**

✅ **API jest teraz włączone!**

---

## 📍 KROK 3: Utwórz Service Account

### Metoda A: Z Google Play Console (ŁATWIEJSZA)

1. **Wróć do Google Play Console:**
   ```
   https://play.google.com/console
   → Settings → API access
   ```

2. **W sekcji "Service accounts" kliknij:**
   ```
   "Create new service account"
   ```

3. **Zostaniesz przekierowany do Google Cloud Console**
   - Pojawi się strona: "Service accounts for project pump-workout-production"

4. **Kliknij "+ CREATE SERVICE ACCOUNT" (niebieski przycisk na górze)**

5. **Wypełnij formularz:**
   ```
   Service account name: pump-workout-publisher
   Service account ID: pump-workout-publisher (automatycznie)
   Description: EAS Build automatic submission to Google Play
   ```

6. **Kliknij "CREATE AND CONTINUE"**

7. **Grant this service account access to project (WAŻNE!):**
   - Kliknij w pole **"Select a role"**
   - Wpisz: `Service Account User`
   - Wybierz: **Service Account User**
   - Kliknij **"CONTINUE"**

8. **Kliknij "DONE"**

### Metoda B: Bezpośrednio z Google Cloud Console

1. **Wejdź na:**
   ```
   https://console.cloud.google.com/iam-admin/serviceaccounts
   ```

2. **Upewnij się że jesteś w odpowiednim projekcie:**
   - Na górze sprawdź nazwę projektu (pump-workout-production)
   - Jeśli nie, kliknij nazwę projektu i wybierz właściwy

3. **Kliknij "+ CREATE SERVICE ACCOUNT"**

4. **Wykonaj kroki 5-8 z Metody A powyżej**

---

## 📍 KROK 4: Wygeneruj JSON Key

### 4.1. Znajdź swój Service Account

W Google Cloud Console:
```
https://console.cloud.google.com/iam-admin/serviceaccounts
```

Zobaczysz listę:
```
Email                                           Name
pump-workout-publisher@xxx.iam.gserviceaccount.com  pump-workout-publisher
```

### 4.2. Kliknij na EMAIL service account
- **NIE** kliknij w nazwę, tylko w **email** (cały wiersz)

### 4.3. Przejdź do zakładki "KEYS"
```
Na górze: DETAILS | PERMISSIONS | KEYS | METRICS
```
Kliknij **KEYS**

### 4.4. Dodaj klucz
1. Kliknij **"ADD KEY"** → **"Create new key"**
2. Wybierz format: **JSON** (powinien być zaznaczony)
3. Kliknij **"CREATE"**

### 4.5. Plik zostanie pobrany
```
Nazwa: pump-workout-production-xxxxx.json
```
**⚠️ To jedyna kopia - zachowaj bezpiecznie!**

---

## 📍 KROK 5: Nadaj uprawnienia w Google Play Console

**To jest KLUCZOWY krok** - bez tego EAS nie będzie mógł publikować!

### 5.1. Wróć do Google Play Console
```
https://play.google.com/console
→ Settings → API access
```

### 5.2. Znajdź Service Account na liście
W sekcji **"Service accounts"** zobaczysz:
```
pump-workout-publisher@xxx.iam.gserviceaccount.com
Status: Nie nadano uprawnień / No permissions granted
```

### 5.3. Kliknij na Service Account

### 5.4. Kliknij zakładkę "App permissions"

### 5.5. Kliknij "Add app"
- Wybierz **"PUMP Workout"** z listy
- Kliknij **"Add"**

### 5.6. Nadaj uprawnienia (checkboxy)
Zaznacz:
- ✅ **Releases** (może być pod różnymi nazwami):
  - "Release to production, exclude devices, and use Play App Signing"
  - "Release apps to production"
  - "Manage production releases"

- ✅ **Release to testing tracks**
  - "Release apps to testing tracks"

Minimum potrzebne do EAS:
- ✅ Releases
- ✅ Edit and delete draft apps

### 5.7. Kliknij "Apply"

### 5.8. Kliknij "Save changes" (na dole lub na górze)

### 5.9. Kliknij "Invite user" (jeśli pojawi się)
- Wyślij zaproszenie
- **WAŻNE:** Musisz zaakceptować zaproszenie w emailu!

---

## 📍 KROK 6: Umieść klucz w projekcie

### 6.1. Zmień nazwę pliku
```bash
# Znajdujesz się w katalogu projektu
cd /home/user/PUMP-Native

# Skopiuj pobrany plik do private/
mv ~/Downloads/pump-workout-production-xxxxx.json ./private/service-account.json
```

### 6.2. Sprawdź czy plik istnieje
```bash
ls -la private/
```

Powinno być:
```
private/
├── README.md
├── AuthKey_YY2KC425HU.p8
└── service-account.json  ← NOWY PLIK
```

### 6.3. Sprawdź zawartość (opcjonalnie)
```bash
cat private/service-account.json | head -5
```

Powinno zaczynać się od:
```json
{
  "type": "service_account",
  "project_id": "pump-workout-production",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
```

✅ **Jeśli widzisz to - wszystko OK!**

---

## 📍 KROK 7: Testuj konfigurację

### 7.1. Zbuduj aplikację
```bash
eas build --platform android --profile production
```

**Podczas pierwszego buildu:**
- `Would you like to generate a new Android Keystore?` → **YES**
- EAS przechowa keystore w chmurze

⏰ Czas buildu: ~10-15 minut

### 7.2. Wyślij do Google Play (TEST)
```bash
eas submit --platform android
```

**Co się może stać:**

✅ **SUKCES:**
```
✔ Uploaded PUMP Workout (1.0.0) to Google Play
✔ Submitted to internal testing track
```

❌ **BŁĄD:**
```
Error: Invalid service account credentials
```
→ Sprawdź czy plik `service-account.json` jest w `private/`
→ Sprawdź czy Service Account ma uprawnienia w Google Play Console

❌ **BŁĄD:**
```
Error: Google Play Android Developer API has not been enabled
```
→ Wróć do Kroku 2 i włącz API

---

## 🆘 NAJCZĘSTSZE PROBLEMY

### "Cannot find service account in console"

**Przyczyna:** Szukasz w złym miejscu

**Rozwiązanie:**
- Service Account jest w **Google Cloud Console**, NIE w Google Play Console
- Link: https://console.cloud.google.com/iam-admin/serviceaccounts
- Upewnij się że jesteś w odpowiednim projekcie (nazwa na górze)

---

### "Service account has no permissions"

**Przyczyna:** Nie nadałeś uprawnień w Google Play Console

**Rozwiązanie:**
1. Google Play Console → Settings → API access
2. Znajdź Service Account na liście
3. Kliknij → App permissions → Add app → PUMP Workout
4. Zaznacz: Releases, Release to testing tracks
5. Save changes

---

### "API has not been enabled"

**Przyczyna:** Google Play Android Developer API nie jest włączone

**Rozwiązanie:**
1. https://console.cloud.google.com/apis/library
2. Wyszukaj: `Google Play Android Developer API`
3. Kliknij ENABLE

---

### "Wrong project selected"

**Przyczyna:** Jesteś w złym projekcie Google Cloud

**Rozwiązanie:**
1. Sprawdź nazwę projektu na górze Google Cloud Console
2. Kliknij nazwę → wybierz odpowiedni projekt
3. Projekt powinien być ten sam co w Google Play Console → API access

---

### "Downloaded JSON file is empty or corrupted"

**Przyczyna:** Błąd podczas pobierania

**Rozwiązanie:**
1. Usuń Service Account Key: Google Cloud Console → Service Account → Keys → Delete
2. Utwórz nowy: Add Key → Create new key → JSON
3. Pobierz ponownie

---

## 📊 CHECKLIST - Czy wszystko działa?

Sprawdź po kolei:

- [ ] Google Play Console połączone z Google Cloud Project
- [ ] Google Play Android Developer API włączone
- [ ] Service Account utworzone w Google Cloud Console
- [ ] Service Account ma rolę "Service Account User"
- [ ] JSON Key pobrany i zapisany jako `private/service-account.json`
- [ ] Service Account widoczny w Google Play Console → API access
- [ ] Service Account ma uprawnienia do aplikacji PUMP Workout
- [ ] Uprawnienia: Releases + Release to testing tracks
- [ ] Zaproszenie zaakceptowane (jeśli było)

---

## 🎉 GOTOWE!

Jeśli wszystkie checkboxy powyżej są ✅ - możesz teraz:

```bash
# Zbuduj aplikację
npm run build:android

# Wyślij do Google Play
npm run submit:android
```

**EAS automatycznie:**
- Użyje `private/service-account.json`
- Wyśle APK/AAB do Google Play
- Opublikuje w Internal Testing track

---

## 💡 TIP: Zapisz te linki

Będziesz ich często używać:

**Google Play Console:**
- Dashboard: https://play.google.com/console
- API access: https://play.google.com/console → Settings → API access

**Google Cloud Console:**
- Service Accounts: https://console.cloud.google.com/iam-admin/serviceaccounts
- APIs: https://console.cloud.google.com/apis/library

**Expo:**
- Builds: https://expo.dev
- Docs: https://docs.expo.dev/submit/android/

---

**Powodzenia! 🚀**

Jeśli nadal masz problemy, napisz dokładnie:
1. Gdzie jesteś w procesie?
2. Jaki błąd widzisz?
3. Screenshot (jeśli możliwe)
