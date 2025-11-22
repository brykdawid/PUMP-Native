# Instrukcja przeniesienia keystore między kontami Expo

## Problem
- Aplikacja wymaga klucza z SHA1: `BD:CE:30:0C:1F:05:3F:E2:1E:A6:66:51:0E:0B:44:AF:E4:2C:99:31`
- Ten klucz jest na starym koncie Expo
- Projekt musi działać na nowym koncie Expo

## Rozwiązanie: Przeniesienie keystore

### Krok 1: Wyeksportuj keystore ze starego konta

```bash
# 1. Zaloguj się na STARE konto Expo
npx eas-cli logout
npx eas-cli login
# Podaj dane STAREGO konta

# 2. Sprawdź dostępne keystores
npx eas-cli credentials --platform android

# 3. Wyeksportuj keystore
npx eas-cli credentials --platform android
# Wybierz opcję: "Download credentials"
# Wybierz: "Keystore: Upload keystore or generate a new one"
# Wybierz: "Download the existing keystore"

# To pobierze plik .jks i credentials.json z danymi:
# - keystore password
# - key alias
# - key password
```

**WAŻNE:** Zapisz bezpiecznie:
- Plik `.jks` (keystore)
- Hasła z `credentials.json`

### Krok 2: Utwórz nowy projekt na nowym koncie

```bash
# 1. Zaloguj się na NOWE konto Expo
npx eas-cli logout
npx eas-cli login
# Podaj dane NOWEGO konta

# 2. Zainicjuj nowy projekt (to wygeneruje nowe projectId)
npx eas-cli init
# To utworzy nowy projekt i zaktualizuje app.json
```

### Krok 3: Zaimportuj stary keystore do nowego projektu

```bash
# Jesteś zalogowany na NOWYM koncie
npx eas-cli credentials --platform android

# Wybierz opcję: "Set up a build credential for your project"
# Wybierz: "Keystore: Upload keystore or generate a new one"
# Wybierz: "Upload existing keystore"

# Podaj:
# - Ścieżkę do pliku .jks (pobranego w Kroku 1)
# - Keystore password
# - Key alias
# - Key password
# (wszystko ze starego credentials.json)
```

### Krok 4: Zweryfikuj SHA1 fingerprint

```bash
# Sprawdź czy SHA1 się zgadza
npx eas-cli credentials --platform android

# Powinno pokazać SHA1: BD:CE:30:0C:1F:05:3F:E2:1E:A6:66:51:0E:0B:44:AF:E4:2C:99:31
```

### Krok 5: Zbuduj aplikację

```bash
npm run build:android
```

### Krok 6: Wyślij do Google Play

```bash
npm run submit:android
```

---

## Alternatywne rozwiązanie: Dodaj nowe konto jako collaborator

Jeśli nie chcesz przenosić keystore:

1. Zaloguj się na **stare konto Expo** na https://expo.dev
2. Otwórz projekt "PUMP"
3. Przejdź do **Settings** → **Members**
4. Dodaj **nowe konto** jako **Admin**
5. Zaloguj się na **nowe konto** w CLI
6. Teraz będziesz mieć dostęp do projektu i starego keystore

---

## Weryfikacja końcowa

Po uploadzcie do Google Play, sprawdź w Google Play Console:
- **Release** → **Setup** → **App signing**
- Upewnij się, że SHA1 to: `BD:CE:30:0C:1F:05:3F:E2:1E:A6:66:51:0E:0B:44:AF:E4:2C:99:31`

✅ Gotowe!
