import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/notifications/push_notification_service.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/router/app_router.dart';

class ServeifyApp extends ConsumerWidget {
  const ServeifyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final pendingLink = ref.watch(pendingNotificationLinkProvider);
    if (pendingLink != null && pendingLink.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        router.push(pendingLink);
        ref.read(pendingNotificationLinkProvider.notifier).state = null;
      });
    }

    return MaterialApp.router(
      title: 'Serveify',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.dark,
      routerConfig: router,
    );
  }
}
