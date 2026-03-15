import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

class SecureStorageService {
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userIdKey = 'user_id';
  static const _providerIdKey = 'provider_id';
  static const _roleKey = 'user_role';
  static const _emailKey = 'user_email';

  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.write(key: _accessTokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
  }

  Future<String?> getAccessToken() => _storage.read(key: _accessTokenKey);
  Future<String?> getRefreshToken() => _storage.read(key: _refreshTokenKey);

  Future<void> saveUserInfo({
    required String userId,
    String? providerId,
    required String email,
    required String role,
  }) async {
    await _storage.write(key: _userIdKey, value: userId);
    await _storage.write(key: _emailKey, value: email);
    await _storage.write(key: _roleKey, value: role);
    if (providerId != null) {
      await _storage.write(key: _providerIdKey, value: providerId);
    }
  }

  Future<String?> getUserId() => _storage.read(key: _userIdKey);
  Future<String?> getProviderId() => _storage.read(key: _providerIdKey);
  Future<String?> getEmail() => _storage.read(key: _emailKey);
  Future<String?> getRole() => _storage.read(key: _roleKey);

  Future<void> clearAll() => _storage.deleteAll();
}
