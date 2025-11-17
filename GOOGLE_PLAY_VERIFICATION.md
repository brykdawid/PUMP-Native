# 🔐 Weryfikacja Google Play Console - Rozwiązanie problemu

## Problem: "Nie widzę Settings w Google Play Console"

**Przyczyna:** Twoje konto wymaga weryfikacji tożsamości.

Google Play Console blokuje dostęp do kluczowych funkcji (w tym Settings) dopóki nie ukończysz weryfikacji.

---

## ✅ KROK 1: Sprawdź status weryfikacji

### 1.1. Wejdź na Google Play Console
```
https://play.google.com/console
```

### 1.2. Szukaj powiadomień o weryfikacji

Powinno być **żółte/czerwone powiadomienie** na górze lub w jednym z tych miejsc:

**Opcja A: Banner na górze**
```
⚠️ "Verify your identity to publish apps"
⚠️ "Account verification required"
⚠️ "Complete identity verification"
```

**Opcja B: W lewym menu**
```
Może być czerwona kropka lub wykrzyknik przy:
- Account details
- Identity verification
```

**Opcja C: W dashboardzie**
```
Karta/sekcja z napisem "Identity verification"
```

---

## 📋 KROK 2: Proces weryfikacji

Google może wymagać różnych rodzajów weryfikacji:

### Weryfikacja A: Podstawowa weryfikacja konta

**Co Google chce:**
- Potwierdzenie numeru telefonu
- Potwierdzenie adresu email
- Podstawowe dane osobowe

**Jak ukończyć:**
1. Kliknij na powiadomienie o weryfikacji
2. Podaj numer telefonu
3. Otrzymasz SMS z kodem
4. Wprowadź kod
5. ✅ Weryfikacja zakończona natychmiastowo

### Weryfikacja B: Weryfikacja tożsamości (ID verification)

**Co Google chce:**
- Oficjalny dokument tożsamości (dowód osobisty, paszport, prawo jazdy)
- Zdjęcie dokumentu
- Czasem selfie z dokumentem

**Jak ukończyć:**
1. Kliknij na powiadomienie "Verify identity"
2. Wybierz typ dokumentu (passport, ID card, driver's license)
3. Prześlij zdjęcie dokumentu:
   - Przód dokumentu (wyraźne)
   - Tył dokumentu (jeśli wymagane)
   - Czasem selfie trzymając dokument
4. Poczekaj na przegląd

**⏰ Czas przeglądu:**
- Normalnie: **1-3 dni robocze**
- Czasem szybciej: **kilka godzin**
- Rzadko dłużej: **do 7 dni**

**Otrzymasz email:**
```
"Your Google Play Console identity verification is complete"
```

### Weryfikacja C: D-U-N-S Number (dla firm)

**Tylko jeśli:**
- Zakładasz konto jako firma (nie osoba prywatna)
- Google poprosi o D-U-N-S number

**Możesz pominąć jeśli:**
- Rejestrujesz się jako osoba prywatna

---

## 🚀 CO ROBIĆ W MIĘDZYCZASIE?

### Opcja 1: Poczekaj na weryfikację (ZALECANE)

Niestety **musisz poczekać** na weryfikację zanim dostaniesz dostęp do Settings.

**Nie możesz:**
- ❌ Utworzyć Service Account
- ❌ Skonfigurować API access
- ❌ Wysłać aplikacji przez EAS Submit

**Możesz:**
- ✅ Przygotować aplikację (build lokalnie)
- ✅ Wypełnić App information (jeśli dostępne)
- ✅ Przygotować screenshoty, ikony, opisy

### Opcja 2: Przygotuj wszystko do buildu

Zrób buildy i miej je gotowe na później:

```bash
# Zbuduj Android APK/AAB
npm run build:android

# Zbuduj iOS (jeśli masz skonfigurowane)
npm run build:ios
```

**Po weryfikacji będziesz mógł:**
1. Skonfigurować Service Account (5 minut)
2. Wysłać gotowy build natychmiastowo
3. Rozpocząć testowanie

### Opcja 3: Manualne wysłanie (tymczasowe)

**Jeśli bardzo się spieszy** (nie zalecane, ale możliwe):

1. **Zbuduj aplikację przez EAS:**
   ```bash
   npm run build:android
   ```

2. **Pobierz `.aab` file z EAS:**
   - Link dostaniesz po zakończeniu buildu
   - Lub: https://expo.dev → Projects → pump-workout → Builds
   - Kliknij na build → Download

3. **Poczekaj na weryfikację konta**

4. **Po weryfikacji - Manual Upload:**
   ```
   Google Play Console → PUMP Workout
   → Testing → Internal testing
   → Create new release
   → Upload the .aab file manually
   ```

**⚠️ Wadą tego podejścia:**
- Musisz ręcznie uploadować każdy build
- Nie będzie automatyzacji przez EAS Submit
- Więcej pracy przy każdej aktualizacji

---

## 📧 KROK 3: Sprawdź email

Google wysyła wszystkie informacje o weryfikacji na email:

### Szukaj emaili od:
```
googleplay-developer-support@google.com
noreply@google.com
```

### Tytuły emaili:
```
"Action required: Verify your identity"
"Google Play Console: Identity verification required"
"Your identity verification is complete"
```

**Sprawdź także SPAM!**

---

## 🆘 CO JEŚLI NIE MA POWIADOMIENIA O WERYFIKACJI?

### Scenariusz A: Konto jest już zweryfikowane

Możliwe jeśli:
- Używałeś Google Play Console wcześniej
- Konto jest stare (przed wymogami weryfikacji)

**Test:**
Spróbuj znaleźć Settings innym sposobem:

1. **Szukaj ikony ustawień:**
   - Ikona koła zębatego (⚙️) - zwykle po lewej stronie w menu
   - Lub na górze po prawej

2. **Sprawdź zakładki:**
   - Niektóre wersje mają Settings jako zakładkę na górze
   - Inne mają pod nazwą aplikacji

3. **Spróbuj bezpośredniego linka:**
   ```
   https://play.google.com/console/developers/TWOJ_DEVELOPER_ID/account-details
   ```

### Scenariusz B: Konto nie jest w pełni aktywowane

**Czy opłaciłeś $25 rejestracji?**

Sprawdź:
```
Google Play Console → All apps
```

Powinno być:
- ✅ "Create app" button widoczny
- ✅ Brak komunikatu "Payment required"

Jeśli NIE:
1. Dokończ płatność $25
2. Poczekaj ~5-10 minut na aktywację
3. Odśwież stronę

### Scenariusz C: Ograniczenia regionalne

Google Play Console nie jest dostępny w niektórych krajach.

**Sprawdź czy Twój kraj jest wspierany:**
https://support.google.com/googleplay/android-developer/answer/9306917

---

## 📞 KROK 4: Kontakt z Google Support (jeśli nic nie działa)

### Kiedy kontaktować:
- Weryfikacja trwa dłużej niż 7 dni
- Weryfikacja została odrzucona (bez wyjaśnienia)
- Nie widzisz powiadomienia o weryfikacji i nie masz dostępu do Settings
- Opłaciłeś $25 ale konto nie zostało aktywowane

### Jak skontaktować:

1. **Wejdź na:**
   ```
   https://support.google.com/googleplay/android-developer/
   ```

2. **Kliknij "Contact us"**

3. **Wybierz:**
   - Topic: "Account and settings"
   - Issue: "Identity verification"

4. **Wybierz metodę kontaktu:**
   - Email (1-2 dni odpowiedź)
   - Chat (jeśli dostępny - natychmiastowy)
   - Phone (jeśli dostępny dla Twojego regionu)

5. **Opisz problem:**
   ```
   Subject: Cannot access Settings - Identity verification status unclear

   Description:
   I registered for Google Play Console on [DATE].
   I paid the $25 registration fee.
   I don't see any identity verification prompts.
   I cannot access Settings → API access.

   My developer account: [YOUR EMAIL]

   Could you please:
   1. Check my identity verification status
   2. Enable access to Settings if verification is complete
   3. Provide next steps if verification is still required

   Thank you!
   ```

---

## ✅ CHECKLIST - Po weryfikacji

Gdy dostaniesz email "Your identity verification is complete":

- [ ] Zaloguj się do Google Play Console
- [ ] Sprawdź czy widzisz Settings w menu (powinno być!)
- [ ] Przejdź do Settings → API access
- [ ] Połącz z Google Cloud (jeśli nie było)
- [ ] Utwórz Service Account
- [ ] Wygeneruj JSON key
- [ ] Nadaj uprawnienia
- [ ] Zapisz `service-account.json` w `private/`
- [ ] Testuj: `npm run build:android && npm run submit:android`

---

## ⏰ TIMELINE - Czego się spodziewać

### Dzień 0: Rejestracja
```
✅ Płatność $25
✅ Email potwierdzający rejestrację
⏳ Powiadomienie o weryfikacji (może pojawić się natychmiastowo lub po 24h)
```

### Dzień 0-1: Weryfikacja
```
✅ Przesłanie dokumentu ID
⏳ Przegląd przez Google (1-3 dni)
```

### Dzień 1-3: Zakończenie weryfikacji
```
✅ Email: "Identity verification complete"
✅ Dostęp do Settings odblokowany
✅ Możliwość konfiguracji API access
```

### Dzień 3: Konfiguracja i pierwszy build
```
✅ Service Account utworzone
✅ Pierwsza aplikacja zbudowana i wysłana
✅ Internal testing aktywny
```

---

## 💡 TYMCZASOWY PLAN DZIAŁANIA

### Co możesz zrobić TERAZ (przed weryfikacją):

**1. Przygotuj aplikację:**
```bash
# Upewnij się że wszystko działa lokalnie
npm start

# Zrób build testowy
npm run build:android
```

**2. Przygotuj grafiki:**
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] Screenshoty (min. 2, najlepiej 4-8)
- [ ] Adaptive icon (jeśli jeszcze nie masz)

**3. Napisz teksty:**
- [ ] Short description (80 znaków)
- [ ] Full description (do 4000 znaków)
- [ ] Release notes
- [ ] Privacy Policy URL

**4. Przygotuj Privacy Policy:**
- Możesz użyć istniejącego `PRIVACY_POLICY.md`
- Opublikuj na GitHub Pages lub własnej stronie
- Zapisz URL (będzie potrzebny w Google Play Console)

**5. Przejrzyj przewodniki:**
- ✅ `GOOGLE_PLAY_SETUP.md`
- ✅ `SERVICE_ACCOUNT_GUIDE.md`
- ✅ `GOOGLE_PLAY_VERIFICATION.md` (ten plik)

### Co zrobisz PO weryfikacji (5-10 minut):

```bash
# 1. Settings → API access → Create Service Account
# 2. Download JSON key → save as private/service-account.json
# 3. Grant permissions in Google Play Console
# 4. Submit!
npm run submit:android
```

---

## 🎯 FREQUENTLY ASKED QUESTIONS

### Q: Ile czasu zajmuje weryfikacja?
**A:** Zazwyczaj 1-3 dni robocze. Czasem kilka godzin, rzadko do 7 dni.

### Q: Czy mogę publikować bez weryfikacji?
**A:** NIE. Weryfikacja jest wymagana do publikacji aplikacji.

### Q: Co jeśli moja weryfikacja zostanie odrzucona?
**A:** Google wyśle email z powodem. Zazwyczaj:
- Nieczytelne zdjęcie dokumentu → Prześlij ponownie lepsze zdjęcie
- Niezgodność danych → Sprawdź czy dane się zgadzają
- Dokument wygasł → Użyj aktualnego dokumentu

### Q: Czy mogę przyspieszyć weryfikację?
**A:** Niestety nie. Google ma swój proces i czas przeglądu. Kontakt z supportem nie przyspiesza.

### Q: Czy muszę weryfikować przy każdej aplikacji?
**A:** NIE. Weryfikacja jest na poziomie konta, nie aplikacji. Raz zweryfikowane konto działa dla wszystkich aplikacji.

### Q: Co jeśli zmienię dane osobowe później?
**A:** Będziesz musiał zaktualizować w Account details. Może wymagać ponownej weryfikacji.

---

## 📱 TYMCZASOWE ALTERNATYWY

Jeśli bardzo się spieszy (np. prezentacja, demo):

### Opcja A: TestFlight (iOS)
- ✅ Masz już skonfigurowane iOS submission
- ✅ Możesz wysłać do TestFlight natychmiastowo
- ✅ Testerzy mogą testować na iOS w międzyczasie

```bash
npm run build:ios
npm run submit:ios
```

### Opcja B: Expo Go (development)
- ✅ Natychmiastowe udostępnienie
- ✅ Nie wymaga rejestracji w sklepach
- ❌ Testerzy muszą mieć Expo Go zainstalowane

```bash
npx expo start
# Udostępnij QR code testerom
```

### Opcja C: APK Direct Install
- ✅ Build lokalny APK
- ❌ Testerzy muszą włączyć "Install from unknown sources"
- ❌ Nie jest to oficjalne testowanie

```bash
npm run build:preview:android
# Pobierz APK z Expo
# Wyślij testerom
```

---

## ✉️ TEMPLATE EMAILA DO TESTERÓW (tymczasowy)

```
Temat: PUMP Workout - Beta testowanie (tymczasowe na iOS)

Cześć!

Aplikacja PUMP Workout jest gotowa do testowania!

Niestety weryfikacja konta Google Play trwa 1-3 dni, więc Android będzie dostępny wkrótce.

W MIĘDZYCZASIE możesz testować wersję iOS:

📱 iOS TestFlight:
1. Zainstaluj TestFlight: https://apps.apple.com/app/testflight/id899247664
2. Kliknij link zaproszenia: [LINK Z APP STORE CONNECT]
3. Zainstaluj PUMP Workout

🤖 Android wkrótce!
Wyślę link do Google Play Internal Testing jak tylko weryfikacja się zakończy (~3 dni).

Dzięki za cierpliwość!
```

---

## 🎉 PODSUMOWANIE

**Obecnie:**
- ⏳ Czekasz na weryfikację Google Play (1-3 dni)
- ❌ Brak dostępu do Settings → API access
- ✅ Możesz przygotować wszystko do publikacji

**Po weryfikacji:**
- ✅ Settings będzie widoczne
- ✅ Skonfigurujesz Service Account (5 minut)
- ✅ Wyślesz aplikację automatycznie przez EAS
- ✅ Rozpoczniesz testowanie

**Pytania:**
1. Czy widzisz powiadomienie o weryfikacji w Google Play Console?
2. Czy przesłałeś już dokument ID?
3. Jaki status weryfikacji widzisz?

---

**Napisz jak wygląda Twój ekran Google Play Console, a pomogę Ci dalej!** 🚀
