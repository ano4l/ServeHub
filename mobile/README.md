# Serveify Mobile App

Flutter mobile application for the Serveify service marketplace platform.

## Prerequisites

- Flutter SDK ^3.24.0
- Dart SDK ^3.5.0
- Android Studio / Xcode (for emulators)

## Setup

```bash
cd mobile
flutter pub get
```

## Running

```bash
# Android emulator (API connects to 10.0.2.2:8080)
flutter run

# iOS simulator
flutter run -d ios

# Custom API URL
flutter run --dart-define=API_BASE_URL=http://your-api-url/api/v1
```

## Project Structure

```
lib/
├── main.dart              # Entry point
├── app.dart               # App widget with theme + router
├── core/
│   ├── config/env.dart    # Environment configuration
│   ├── network/           # Dio HTTP client + auth interceptor
│   ├── storage/           # Secure token storage
│   ├── theme/             # App theme (light + dark)
│   └── widgets/           # Shared UI components
├── features/
│   ├── auth/              # Login, Register, Forgot Password
│   ├── home/              # Customer home dashboard
│   ├── browse/            # Browse services + providers
│   ├── booking/           # Bookings list + create booking
│   ├── chat/              # In-booking chat
│   ├── notifications/     # Notification center
│   ├── profile/           # User profile + settings
│   ├── provider_dashboard/# Provider dashboard
│   ├── reviews/           # Write review
│   └── wallet/            # Provider wallet + transactions
└── router/
    ├── app_router.dart    # GoRouter configuration
    └── shell_screen.dart  # Bottom nav shell
```

## Architecture

- **State Management**: Riverpod (StateNotifier + FutureProvider)
- **Routing**: GoRouter with role-based redirects
- **Networking**: Dio with JWT auto-refresh interceptor
- **Storage**: flutter_secure_storage for tokens
- **Theme**: Material 3 with lime green primary color

## Roles

- **CUSTOMER**: Browse, book, review, chat
- **PROVIDER**: Dashboard, manage bookings, wallet, chat
- **ADMIN/SUPPORT**: (Web-only for now)
