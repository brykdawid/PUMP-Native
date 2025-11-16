# 🚀 Publikacja PUMP Workout na TestFlight (bez Mac'a!)

Ten przewodnik pokazuje jak opublikować aplikację na **TestFlight** używając **Expo EAS Build** - bez potrzeby posiadania Mac'a!

---

## ✅ Wymagania

- ✅ Konto Apple Developer ($99/rok)
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

### **KROK 2: Apple Developer Account**

1. **Zarejestruj się w Apple Developer Program:**
   - Wejdź na: https://developer.apple.com/programs/enroll/
   - Koszt: **$99/rok**
   - Czas aktywacji: **24-48 godzin**

2. **Czekaj na aktywację konta**
   - Otrzymasz email potwierdzający
   - Dopiero potem możesz wygenerować klucze API

---

### **KROK 3: Wygeneruj App Store Connect API Key**

Po aktywacji konta Apple Developer:

1. **Przejdź do App Store Connect:**
   - https://appstoreconnect.apple.com/access/api

2. **Kliknij "+" (Create API Key)**

3. **Wypełnij formularz:**
   - **Name:** `PUMP Workout EAS Build`
   - **Access:** `App Manager` (wystarczy do TestFlight)

4. **Pobierz klucz:**
   - Kliknij **Download API Key**
   - **⚠️ UWAGA:** Możesz pobrać tylko raz! Zapisz bezpiecznie!
   - Plik będzie nazywał się: `AuthKey_XXXXX.p8`

5. **Zapisz ważne informacje:**
   - **Key ID:** (np. `ABC123DEF4`) - będzie widoczny w kolumnie
   - **Issuer ID:** (UUID, na górze strony) - (np. `12345678-1234-1234-1234-123456789012`)

---

### **KROK 4: Skonfiguruj credentials w projekcie**

1. **Umieść plik `.p8` w katalogu `private/`:**

```bash
# Skopiuj pobrany klucz do projektu
cp ~/Downloads/AuthKey_ABC123DEF4.p8 ./private/
```

2. **Edytuj plik `eas.json`:**

Znajdź sekcję:
```json
"submit": {
  "production": {
    "ios": {
      "ascApiKeyPath": "./private/AuthKey.p8",
      "ascApiKeyId": "YOUR_KEY_ID",
      "ascApiKeyIssuerId": "YOUR_ISSUER_ID"
    }
  }
}
```

Zamień na prawdziwe wartości:
```json
"submit": {
  "production": {
    "ios": {
      "ascApiKeyPath": "./private/AuthKey_ABC123DEF4.p8",
      "ascApiKeyId": "ABC123DEF4",
      "ascApiKeyIssuerId": "12345678-1234-1234-1234-123456789012"
    }
  }
}
```

---

### **KROK 5: Utwórz aplikację w App Store Connect**

Przed pierwszym buildem musisz utworzyć aplikację w App Store Connect:

1. **Wejdź na:** https://appstoreconnect.apple.com/apps

2. **Kliknij "+" (New App)**

3. **Wypełnij formularz:**
   - **Platform:** iOS
   - **Name:** `PUMP Workout`
   - **Primary Language:** Polish
   - **Bundle ID:** `com.pump.workout` (musi pasować do `app.json`)
   - **SKU:** `pump-workout` (dowolny unikalny identifier)

4. **Kliknij Create**

---

### **KROK 6: Zbuduj aplikację (bez Mac'a!)**

EAS Build zbuduje aplikację w chmurze Apple:

```bash
# Zbuduj wersję produkcyjną dla iOS
npm run build:ios

# Lub bezpośrednio:
eas build --platform ios --profile production
```

**Co się dzieje:**
- ✅ EAS wysyła kod do chmury Apple
- ✅ Build jest tworzony na serwerach Mac w chmurze
- ✅ Po ~15-20 minutach otrzymasz link do pobrania `.ipa`
- ✅ Plik będzie automatycznie przygotowany do TestFlight

**Opcje podczas pierwszego buildu:**
- `Would you like to automatically create an iOS Distribution Certificate?` → **YES**
- `Would you like to automatically create an iOS Provisioning Profile?` → **YES**
- EAS zarządzi wszystkimi certyfikatami za Ciebie!

---

### **KROK 7: Wyślij do TestFlight**

Po zakończeniu buildu (otrzymasz email):

```bash
# Automatyczne wysłanie do TestFlight
eas submit --platform ios

# Lub użyj skryptu:
npm run submit:ios
```

**Co się dzieje:**
- ✅ EAS użyje Twojego API Key z `eas.json`
- ✅ Aplikacja zostanie automatycznie przesłana do App Store Connect
- ✅ Po ~5-10 minutach pojawi się w TestFlight

---

### **KROK 8: Konfiguracja TestFlight**

1. **Wejdź na App Store Connect:**
   - https://appstoreconnect.apple.com/apps

2. **Wybierz "PUMP Workout"**

3. **Przejdź do zakładki "TestFlight"**

4. **Poczekaj na przetwarzanie:**
   - Status: "Processing" → "Testing" (~10-30 minut)
   - Jeśli jest compliance notice, wypełnij:
     - Export Compliance: **NO** (jeśli nie używasz szyfrowania)

5. **Dodaj testerów:**

   **Internal Testing (do 100 osób z Twojego team):**
   - TestFlight > Internal Testing
   - Dodaj Apple ID emails testerów
   - Wyślij zaproszenia

   **External Testing (do 10,000 osób publicznych):**
   - TestFlight > External Testing
   - Create New Group
   - Dodaj testerów przez email lub public link
   - **⚠️ Wymaga przeglądu przez Apple (1-2 dni)**

---

## 🎯 QUICK COMMANDS

### Pełny workflow (build + submit):

```bash
# 1. Zbuduj aplikację w chmurze
npm run build:ios

# 2. Poczekaj na zakończenie (~15-20 minut)
# Otrzymasz email: "Your iOS build is complete!"

# 3. Wyślij do TestFlight
npm run submit:ios

# 4. Poczekaj na przetwarzanie w App Store Connect (~10-30 minut)

# 5. Dodaj testerów w App Store Connect
```

### Aktualizacja aplikacji:

```bash
# EAS automatycznie zwiększy buildNumber (autoIncrement: true)
npm run build:ios && npm run submit:ios
```

---

## 🧪 TESTOWANIE

### Testowanie jako developer (TY):

1. Zainstaluj TestFlight na iPhone:
   - https://apps.apple.com/app/testflight/id899247664

2. Będziesz automatycznie dodany jako internal tester

3. Otwórz TestFlight → zobaczysz "PUMP Workout"

4. Kliknij **Install**

### Zaproszenie innych testerów:

**Internal (do 100 osób z team):**
```
App Store Connect > TestFlight > Internal Testing > Add Testers
```

**External (publiczne):**
```
App Store Connect > TestFlight > External Testing > Create Group > Add Testers
```

Możesz również wygenerować **Public Link** do TestFlight:
```
TestFlight > External Testing > Public Link > Enable
```

---

## 🐛 ROZWIĄZYWANIE PROBLEMÓW

### Problem: "Build failed - missing credentials"
```bash
# Sprawdź czy masz poprawne ścieżki w eas.json
cat eas.json | grep ascApiKeyPath

# Sprawdź czy plik .p8 istnieje
ls -la private/
```

### Problem: "Bundle identifier doesn't match"
- Sprawdź czy `com.pump.workout` w `app.json` pasuje do Bundle ID w App Store Connect

### Problem: "Export compliance required"
```
App Store Connect > TestFlight > Builds > Select Build > Export Compliance
→ Select: "No" (if not using encryption)
```

### Problem: "Build takes too long"
- Normalny czas: 15-25 minut
- Sprawdź status: https://expo.dev/accounts/[your-account]/projects/pump-workout/builds

### Problem: "Can't find app in TestFlight"
- Poczekaj 10-30 minut po submit
- Sprawdź email - możesz dostać compliance notice
- Sprawdź App Store Connect > TestFlight > iOS Builds

---

## 📊 MONITORING

### Sprawdź status buildu:

```bash
# W terminalu zobaczysz link do:
# https://expo.dev/accounts/[account]/projects/pump-workout/builds/[build-id]

# Możesz też sprawdzić w przeglądarce:
eas build:list --platform ios
```

### Sprawdź logi:

```bash
# Jeśli build się nie powiedzie
eas build:view [build-id]
```

---

## 🎉 SUKCES!

Po wykonaniu wszystkich kroków:

- ✅ Aplikacja jest zbudowana w chmurze (bez Mac'a!)
- ✅ TestFlight otrzymał build
- ✅ Możesz testować na prawdziwych iPhone'ach
- ✅ Możesz zapraszać testerów
- ✅ Możesz iterować z nowymi wersjami

---

## 📱 NASTĘPNE KROKI

### Gotowy do pełnej publikacji w App Store?

1. **Przygotuj:**
   - [ ] Screenshoty (różne rozmiary iPhone'ów)
   - [ ] Opis aplikacji
   - [ ] Keywords
   - [ ] Privacy Policy URL
   - [ ] Support URL

2. **Wyślij do review:**
   ```
   App Store Connect > App Store > Select Version > Submit for Review
   ```

3. **Czas review:** 1-7 dni (średnio 2-3 dni)

---

## 🆘 POTRZEBUJESZ POMOCY?

- **Expo Docs:** https://docs.expo.dev/build/introduction/
- **EAS Build:** https://docs.expo.dev/build/setup/
- **TestFlight Guide:** https://developer.apple.com/testflight/

---

## 💡 TIPS & TRICKS

### Użyj profilu `preview` do szybszego testowania:

```bash
# Build z profilem preview (internal distribution)
npm run build:preview:ios

# Szybszy build, ale nie można wysłać do App Store
# Świetny do testów przed production build
```

### Monitoruj koszty EAS Build:

- **Free tier:** 30 builds/miesiąc dla iOS
- **Paid plans:** Unlimited builds od $29/miesiąc
- Sprawdź: https://expo.dev/pricing

### Automatyzuj z GitHub Actions:

```yaml
# .github/workflows/testflight.yml
# Automatyczne buildy przy każdym pushu do main
```

---

**Powodzenia z publikacją PUMP Workout na TestFlight! 🚀💪**
