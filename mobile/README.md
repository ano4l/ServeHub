# Serveify Mobile App

Flutter mobile client for the Serveify marketplace.

## Prerequisites

- Flutter 3.41+
- Dart 3.11+
- Android Studio with Android SDK for Android builds
- Xcode on macOS for iOS builds

## Local Development

```bash
cd mobile
flutter pub get
flutter run
```

Default local API values point to the Android emulator host:

- `API_BASE_URL=http://10.0.2.2:8080/api/v1`
- `WS_URL=http://10.0.2.2:8080/ws`

Override them when needed:

```bash
flutter run \
  --dart-define=API_BASE_URL=https://api.example.com/api/v1 \
  --dart-define=WS_URL=https://api.example.com/ws
```

## Release Requirements

Release builds now refuse to start if `API_BASE_URL` and `WS_URL` are left on the emulator-local defaults.

Required values before store submission:

- Production API base URL
- Production WebSocket URL
- Final Android application ID
- Final iOS bundle identifier
- Android upload keystore
- Apple signing team / provisioning setup

Current placeholder app identifier:

- `dev.serveify.mobile`

Replace it with your reserved store identifier before publishing if needed.

## Android Release Setup

1. Install the Android SDK and ensure `ANDROID_HOME` or `sdk.dir` is configured.
2. Copy `android/key.properties.example` to `android/key.properties`.
3. Update the copied file with your real keystore path and passwords.
4. Build with production endpoints:

```bash
flutter build apk --release \
  --dart-define=API_BASE_URL=https://api.example.com/api/v1 \
  --dart-define=WS_URL=https://api.example.com/ws
```

If `android/key.properties` is missing, release builds fall back to debug signing for local verification only.

## iOS Release Setup

1. Open `ios/Runner.xcworkspace` in Xcode on macOS.
2. Set your Apple Developer Team.
3. Confirm the bundle identifier is correct for your App Store record.
4. Archive with production endpoints:

```bash
flutter build ipa \
  --dart-define=API_BASE_URL=https://api.example.com/api/v1 \
  --dart-define=WS_URL=https://api.example.com/ws
```

## Verification

```bash
flutter analyze
flutter test --dart-define=TEST_MODE=true
```
