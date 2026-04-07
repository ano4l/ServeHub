import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/app.dart';
import 'package:serveify/core/config/env.dart';
import 'package:serveify/core/notifications/push_notification_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  if (!kIsWeb && !Env.testMode) {
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  }
  Env.validateForStartup();
  runApp(
    const ProviderScope(
      child: ServeifyApp(),
    ),
  );
}
