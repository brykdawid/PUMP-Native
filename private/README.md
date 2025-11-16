# 🔐 Private Credentials Directory

Ten katalog zawiera poufne pliki credentials potrzebne do publikacji aplikacji.

**⚠️ WAŻNE: Pliki w tym katalogu są ignorowane przez git (.gitignore)**

## 📁 Wymagane pliki:

### iOS (Apple)
- **`AuthKey_XXXXX.p8`** - Apple API Key do App Store Connect
  - Pobierz z: https://appstoreconnect.apple.com/access/api
  - Po pobraniu zmień nazwę lub zaktualizuj ścieżkę w `eas.json`

### Android (Google Play)
- **`service-account.json`** - Google Play Service Account credentials
  - Pobierz z: Google Cloud Console > IAM & Admin > Service Accounts
  - Nazwa pliku musi być dokładnie: `service-account.json`

## 🔧 Jak uzyskać credentials:

### iOS - App Store Connect API Key

1. Zarejestruj się w **Apple Developer Program** ($99/rok)
   - https://developer.apple.com/programs/enroll/

2. Wygeneruj API Key:
   - Przejdź do: https://appstoreconnect.apple.com/access/api
   - Kliknij "+" (Create API Key)
   - Wybierz rolę: **App Manager**
   - Zapisz **Key ID** i **Issuer ID**
   - Pobierz plik `.p8` (można tylko raz!)

3. Umieść plik w tym katalogu:
   ```
   private/AuthKey_ABC123DEF4.p8
   ```

4. Zaktualizuj `eas.json`:
   ```json
   "ascApiKeyPath": "./private/AuthKey_ABC123DEF4.p8",
   "ascApiKeyId": "ABC123DEF4",
   "ascApiKeyIssuerId": "12345678-1234-1234-1234-123456789012"
   ```

### Android - Google Play Service Account

1. Zarejestruj się w **Google Play Console** ($25 jednorazowo)
   - https://play.google.com/console/signup

2. Utwórz Service Account:
   - Google Cloud Console > IAM & Admin > Service Accounts
   - Create Service Account
   - Grant permissions (Editor role)
   - Create key (JSON format)

3. Umieść plik w tym katalogu:
   ```
   private/service-account.json
   ```

## ✅ Weryfikacja

Po dodaniu plików, struktura powinna wyglądać tak:

```
private/
├── README.md (ten plik)
├── AuthKey_XXXXX.p8 (iOS - App Store Connect)
└── service-account.json (Android - Google Play)
```

## 🚀 Następne kroki

Po umieszczeniu plików credentials, możesz:

**iOS TestFlight:**
```bash
npm run build:ios
eas submit --platform ios
```

**Android Internal Testing:**
```bash
npm run build:android
eas submit --platform android
```

## 🔒 Bezpieczeństwo

- ❌ **NIGDY** nie commituj tych plików do git
- ❌ **NIGDY** nie udostępniaj tych plików publicznie
- ✅ Katalog `private/` jest już w `.gitignore`
- ✅ Przechowuj kopię zapasową w bezpiecznym miejscu
