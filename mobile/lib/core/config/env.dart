class Env {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8080/api/v1',
  );

  static const String wsUrl = String.fromEnvironment(
    'WS_URL',
    defaultValue: 'http://10.0.2.2:8080/ws',
  );

  static const bool testMode = bool.fromEnvironment(
    'TEST_MODE',
    defaultValue: false,
  );
}
