import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:serveify/core/config/env.dart';
import 'package:serveify/core/network/api_client.dart';

final pendingNotificationLinkProvider = StateProvider<String?>((ref) => null);

final pushNotificationServiceProvider = Provider<PushNotificationService>((ref) {
  return PushNotificationService(ref);
});

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (kIsWeb || Env.testMode) {
    return;
  }

  try {
    await Firebase.initializeApp();
  } catch (_) {
    // Native config may not be present in local/dev environments.
  }
}

class PushNotificationService {
  final Ref _ref;
  bool _initialized = false;
  String? _registeredToken;
  StreamSubscription<String>? _tokenRefreshSubscription;
  StreamSubscription<RemoteMessage>? _messageOpenedSubscription;
  StreamSubscription<RemoteMessage>? _foregroundMessageSubscription;

  PushNotificationService(this._ref);

  Future<void> ensureInitialized() async {
    if (_initialized || Env.testMode || kIsWeb) {
      return;
    }

    try {
      await Firebase.initializeApp();
    } catch (error) {
      debugPrint('Push initialization skipped: $error');
      return;
    }

    final messaging = FirebaseMessaging.instance;
    await messaging.setAutoInitEnabled(true);
    await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    await messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    await _tokenRefreshSubscription?.cancel();
    _tokenRefreshSubscription = messaging.onTokenRefresh.listen((token) {
      _registeredToken = token;
      unawaited(_registerDeviceToken(token));
    });

    await _messageOpenedSubscription?.cancel();
    _messageOpenedSubscription = FirebaseMessaging.onMessageOpenedApp.listen(
      _handleMessageOpen,
    );

    await _foregroundMessageSubscription?.cancel();
    _foregroundMessageSubscription = FirebaseMessaging.onMessage.listen(
      _handleForegroundMessage,
    );

    final initialMessage = await messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleMessageOpen(initialMessage);
    }

    _initialized = true;
  }

  Future<void> onAuthenticated() async {
    await ensureInitialized();
    if (!_initialized) {
      return;
    }

    final token = await FirebaseMessaging.instance.getToken();
    if (token == null || token.isEmpty) {
      return;
    }

    await _registerDeviceToken(token);
  }

  Future<void> prepareForLogout() async {
    if (Env.testMode || kIsWeb) {
      return;
    }

    await ensureInitialized();
    if (!_initialized) {
      return;
    }

    final token = _registeredToken ?? await FirebaseMessaging.instance.getToken();
    if (token == null || token.isEmpty) {
      return;
    }

    try {
      await _ref.read(dioProvider).put(
        '/notifications/devices/unregister',
        data: {'token': token},
      );
    } catch (error) {
      debugPrint('Push token unregister skipped: $error');
    }
  }

  Future<void> _registerDeviceToken(String token) async {
    if (token.isEmpty) {
      return;
    }

    try {
      final packageInfo = await PackageInfo.fromPlatform();
      final locale = WidgetsBinding.instance.platformDispatcher.locale
          .toLanguageTag();
      await _ref.read(dioProvider).put(
        '/notifications/devices',
        data: {
          'token': token,
          'platform': _platformName(),
          'appVersion': '${packageInfo.version}+${packageInfo.buildNumber}',
          'locale': locale,
        },
      );
      _registeredToken = token;
    } catch (error) {
      debugPrint('Push token register skipped: $error');
    }
  }

  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('Foreground push received: ${message.messageId}');
  }

  void _handleMessageOpen(RemoteMessage message) {
    final link = normalizeNotificationLink(message.data['link']?.toString());
    if (link != null) {
      _ref.read(pendingNotificationLinkProvider.notifier).state = link;
    }
  }

  String _platformName() {
    return switch (defaultTargetPlatform) {
      TargetPlatform.android => 'ANDROID',
      TargetPlatform.iOS => 'IOS',
      _ => 'UNKNOWN',
    };
  }
}

String? normalizeNotificationLink(String? rawLink) {
  if (rawLink == null) {
    return null;
  }

  final link = rawLink.trim();
  if (link.isEmpty) {
    return null;
  }

  if (link.startsWith('/bookings/')) {
    return link.replaceFirst('/bookings/', '/booking/');
  }

  return link;
}
