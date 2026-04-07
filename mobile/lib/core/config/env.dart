import 'package:flutter/foundation.dart';

class Env {
  static const String _defaultApiBaseUrl = kIsWeb
      ? 'http://localhost:8080/api/v1'
      : 'http://10.0.2.2:8080/api/v1';
  static const String _defaultWsUrl = kIsWeb
      ? 'http://localhost:8080/ws'
      : 'http://10.0.2.2:8080/ws';

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: _defaultApiBaseUrl,
  );

  static const String wsUrl = String.fromEnvironment(
    'WS_URL',
    defaultValue: _defaultWsUrl,
  );

  static const bool testMode = bool.fromEnvironment(
    'TEST_MODE',
    defaultValue: false,
  );

  static bool get usesLocalApiDefaults =>
      apiBaseUrl == _defaultApiBaseUrl || wsUrl == _defaultWsUrl;

  static void validateForStartup() {
    if (!kReleaseMode || testMode) {
      return;
    }

    if (usesLocalApiDefaults) {
      throw StateError(
        'Release builds require API_BASE_URL and WS_URL dart-defines. '
        'Refusing to start with emulator-local defaults.',
      );
    }
  }
}
