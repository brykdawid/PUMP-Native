# 💪 PUMP Workout

**Your personal AI-powered workout companion**

Track exercises, create custom workouts, and achieve your fitness goals with intelligent AI recommendations.

---

## 📱 About

PUMP Workout is a React Native mobile application built with Expo that helps fitness enthusiasts:

- 🏋️ **Track workouts** - Log exercises, sets, reps, and weight
- 🤖 **AI-powered recommendations** - Get personalized workout suggestions
- 📊 **Monitor progress** - View detailed statistics and personal records
- 🎯 **Custom workouts** - Create and save your own training routines
- 📸 **Profile customization** - Set profile pictures and track personal stats

---

## ✨ Features

### Core Functionality
- **Workout Library** - Comprehensive exercise database with GIF demonstrations
- **AI Exercise Generation** - Smart workout creation based on your preferences
- **Progress Tracking** - Monitor your fitness journey with detailed statistics
- **Local Data Storage** - All your data stays on your device (privacy-first)
- **Cross-Platform** - Works on iOS, Android, and Web

### Technical Highlights
- ✅ Built with **Expo SDK 54** and **React Native 0.76**
- ✅ **Offline-first** architecture with AsyncStorage
- ✅ **AI API integration** via Fly.io
- ✅ Modern UI with gradients and smooth animations
- ✅ Production-ready with EAS Build configuration

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or newer)
- **npm** or **yarn**
- **Expo CLI** (optional, npx can be used)

### Installation

```bash
# Clone the repository
git clone https://github.com/brykdawid/PUMP-Native.git
cd PUMP-Native

# Install dependencies
npm install

# Start the development server
npm start
```

### Running the App

```bash
# iOS Simulator (requires macOS)
npm run ios

# Android Emulator
npm run android

# Web browser
npm run web

# Expo Go (on physical device)
npm start
# Then scan QR code with Expo Go app
```

---

## 📦 Project Structure

```
PUMP-Native/
├── src/
│   ├── components/         # React components
│   │   ├── ExerciseCard.js
│   │   ├── ExerciseList.js
│   │   ├── StatCard.js
│   │   └── WorkoutCard.js
│   ├── screens/            # Main app screens
│   │   ├── HomeScreen.js
│   │   ├── WorkoutsScreen.js
│   │   ├── ExercisesScreen.js
│   │   ├── StatsScreen.js
│   │   └── ProfileScreen.js
│   ├── services/           # API and storage services
│   │   ├── api.js          # API integration
│   │   ├── storage.js      # AsyncStorage wrapper
│   │   └── apiHelpers.js   # API utility functions
│   ├── utils/              # Utility functions
│   │   ├── validation.js
│   │   └── muscleGroups.js
│   └── App.js              # Main app component
├── assets/                 # Images, icons, fonts
├── private/                # Credentials (gitignored)
├── app.json                # Expo configuration
├── eas.json                # EAS Build configuration
├── package.json            # Dependencies
└── README.md               # This file
```

---

## 🔧 Configuration

### API Configuration

The app uses an AI API hosted on Fly.io for exercise generation:

**Production API:** `https://ai-api-drlzza.fly.dev/api`

To change the API URL, edit `src/services/api.js`:

```javascript
const PRODUCTION_API_URL = 'https://your-api-url.com/api';
```

### App Configuration

Main configuration is in `app.json`:

- **App Name:** PUMP Workout
- **Bundle ID (iOS):** `com.pump.workout`
- **Package Name (Android):** `com.pump.workout`
- **Version:** 1.0.0

---

## 📱 Publishing to TestFlight (iOS)

**Good news!** You can publish to TestFlight **without a Mac** using Expo EAS Build.

### Quick Steps:

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Configure Apple Developer credentials** (see detailed guide below)

3. **Build for iOS:**
   ```bash
   npm run build:ios
   ```

4. **Submit to TestFlight:**
   ```bash
   npm run submit:ios
   ```

### 📖 Detailed Guide

For a complete step-by-step guide, see:

**[TESTFLIGHT_SETUP.md](./TESTFLIGHT_SETUP.md)**

This guide covers:
- Apple Developer account setup
- Generating API keys
- EAS Build configuration
- TestFlight submission
- Adding testers
- Troubleshooting

---

## 🤖 Publishing to Google Play (Android)

### Quick Steps:

1. **Configure Google Play credentials** (see `private/README.md`)

2. **Build for Android:**
   ```bash
   npm run build:android
   ```

3. **Submit to Google Play:**
   ```bash
   npm run submit:android
   ```

---

## 🛠️ Development

### Available Scripts

```bash
# Development
npm start              # Start Expo dev server
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run in browser

# Building (EAS Build)
npm run build:android         # Production Android build
npm run build:ios             # Production iOS build
npm run build:all             # Build for all platforms
npm run build:preview:android # Preview Android build
npm run build:preview:ios     # Preview iOS build

# Submission
npm run submit:android # Submit to Google Play
npm run submit:ios     # Submit to App Store/TestFlight
```

### Build Profiles (eas.json)

- **development** - For internal testing with Expo Go
- **preview** - For testing on real devices (internal distribution)
- **production** - For App Store/Google Play submission

---

## 📄 Documentation

- **[TESTFLIGHT_SETUP.md](./TESTFLIGHT_SETUP.md)** - Complete TestFlight publishing guide
- **[PRIVACY_POLICY.md](./PRIVACY_POLICY.md)** - Privacy policy for app stores
- **[TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md)** - Terms of service
- **[private/README.md](./private/README.md)** - Credentials setup guide

---

## 🔒 Privacy & Security

- ✅ **All workout data** is stored locally on your device
- ✅ **No personal data** is collected or transmitted to external servers
- ✅ **API calls** only send workout preferences (no PII)
- ✅ **Photo library access** is used only for profile pictures (stored locally)
- ✅ **Credentials** are gitignored and never committed

For details, see [PRIVACY_POLICY.md](./PRIVACY_POLICY.md)

---

## 🧪 Testing

### Manual Testing Checklist

Before publishing:

- [ ] Test workout creation and logging
- [ ] Test AI exercise generation
- [ ] Test profile picture upload
- [ ] Test statistics calculation
- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Verify offline functionality
- [ ] Test photo library permissions
- [ ] Check build size (APK/IPA)

---

## 🐛 Troubleshooting

### Common Issues

**Build fails - missing credentials:**
```bash
# Check eas.json credentials paths
cat eas.json | grep KeyPath
# Verify files exist in private/
ls -la private/
```

**App crashes on startup:**
```bash
# Clear Expo cache
npx expo start -c
```

**API not responding:**
```bash
# Check API status
curl https://ai-api-drlzza.fly.dev/api/health
```

**TestFlight not showing build:**
- Wait 10-30 minutes after submission
- Check App Store Connect for compliance notices
- Verify Bundle ID matches App Store Connect

---

## 📊 Tech Stack

### Frontend
- **React Native** 0.76.5
- **Expo** ~54.0.0
- **React** 18.3.1

### UI Components
- **@expo/vector-icons** - Icon library
- **expo-linear-gradient** - Gradient backgrounds
- **expo-image-picker** - Photo library access

### Storage
- **@react-native-async-storage/async-storage** - Local data storage

### Development Tools
- **EAS CLI** - Build and submission
- **Expo CLI** - Development server

---

## 🎯 Roadmap

### v1.1 (Planned)
- [ ] Dark mode support
- [ ] Workout templates
- [ ] Exercise video tutorials
- [ ] Progress photos
- [ ] Export workout data

### v1.2 (Future)
- [ ] Social features (share workouts)
- [ ] Cloud backup (optional)
- [ ] Apple Health / Google Fit integration
- [ ] Wearable device support

---

## 📜 License

This project is private and proprietary. All rights reserved.

---

## 🤝 Contributing

This is a private project. For questions or issues, please contact:

**Email:** [Your contact email]
**GitHub:** https://github.com/brykdawid/PUMP-Native

---

## 📞 Support

Need help?

- **Technical issues:** Open an issue on GitHub
- **App Store/TestFlight:** See [TESTFLIGHT_SETUP.md](./TESTFLIGHT_SETUP.md)
- **Privacy questions:** See [PRIVACY_POLICY.md](./PRIVACY_POLICY.md)

---

## 🙏 Acknowledgments

- **Expo Team** - For the amazing development platform
- **React Native Community** - For the robust ecosystem
- **Fly.io** - For reliable API hosting

---

## 📈 Status

| Platform | Status | Version |
|----------|--------|---------|
| iOS | ⏳ TestFlight Pending | 1.0.0 (1) |
| Android | ⏳ Internal Testing | 1.0.0 (1) |
| Web | ✅ Development | 1.0.0 |

---

**Made with ❤️ for fitness enthusiasts**

**PUMP Workout - Train Smart, Track Progress, Achieve Goals 💪**
