# Firebase Setup For Mobile Push

Use this checklist when you are ready to enable real push notifications for the mobile app.

## 1. Pick the final app identifiers first

Do this before downloading Firebase config files.

- Android application id: currently `dev.serveify.mobile`
- iOS bundle id: currently `dev.serveify.mobile`

If you are renaming the app to `Dala` with a new package id or bundle id, update those first and then register the final ids in Firebase.

## 2. Create the Firebase project

In the Firebase console:

1. Create a project for the mobile app.
2. Add an Android app using the final Android application id.
3. Add an iOS app using the final iOS bundle id.

## 3. Add the mobile config files

Download the generated config files from Firebase and place them here:

- Android: `mobile/android/app/google-services.json`
- iOS: `mobile/ios/Runner/GoogleService-Info.plist`

The Flutter app already includes Firebase Messaging code. These files are the missing native configuration.

## 4. Android checks

These are already in the repo:

- Google services Gradle plugin in `mobile/android/app/build.gradle.kts`
- `POST_NOTIFICATIONS` permission in `mobile/android/app/src/main/AndroidManifest.xml`

After adding `google-services.json`, Android push can be tested on a real device.

## 5. iOS checks

You still need to finish the Apple side in Xcode / Apple Developer:

1. Open the Runner target in Xcode.
2. Enable `Push Notifications`.
3. Enable `Background Modes`.
4. Under Background Modes, enable `Remote notifications`.
5. In Apple Developer, create an APNs authentication key.
6. Upload that APNs key in Firebase Console under Cloud Messaging for the iOS app.

The repo already includes `remote-notification` in `mobile/ios/Runner/Info.plist`, but the Xcode capability setup still has to be done on macOS.

## 6. Backend FCM configuration

The backend expects these environment variables from `src/main/resources/application.yml`:

- `FCM_ENABLED=true`
- `FCM_PROJECT_ID=<your firebase project id>`
- `FCM_SERVICE_ACCOUNT_PATH=<absolute path to a Google service account json>`

The service account json should not be committed to the repo.

Recommended service account flow:

1. In Google Cloud / Firebase, create a service account for server-side messaging.
2. Download the json key locally to a secure path outside the repo if possible.
3. Point `FCM_SERVICE_ACCOUNT_PATH` to that file.

## 7. Test flow

After the files and env vars are in place:

1. Start the backend with the FCM env vars set.
2. Run the mobile app on a physical Android or iPhone.
3. Log in.
4. Confirm the app registers a device token through `/notifications/devices`.
5. Trigger a booking update or chat message.
6. Confirm the push arrives.
7. Tap the notification and verify the app deep-links into the correct screen.

## 8. Important note

The current Flutter code initializes Firebase from the native config files. You do not need to add `firebase_options.dart` unless you decide to move to explicit FlutterFire CLI configuration later.
