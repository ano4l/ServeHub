import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/storage/secure_storage.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.read(dioProvider), ref.read(secureStorageProvider));
});

class AuthRepository {
  final Dio _dio;
  final SecureStorageService _storage;

  AuthRepository(this._dio, this._storage);

  Future<AuthResult> login({required String email, required String password}) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      return _handleAuthResponse(response.data);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<AuthResult> register({
    required String fullName,
    required String email,
    required String phoneNumber,
    required String password,
    required String role,
    String? city,
    int? serviceRadiusKm,
    String? bio,
  }) async {
    try {
      final data = <String, dynamic>{
        'fullName': fullName,
        'email': email,
        'phoneNumber': phoneNumber,
        'password': password,
        'role': role,
      };
      if (city != null) data['city'] = city;
      if (serviceRadiusKm != null) data['serviceRadiusKm'] = serviceRadiusKm;
      if (bio != null) data['bio'] = bio;

      final response = await _dio.post('/auth/register', data: data);
      return _handleAuthResponse(response.data);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> forgotPassword(String email) async {
    try {
      await _dio.post('/auth/forgot-password', data: {'email': email});
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> resetPassword({required String token, required String newPassword}) async {
    try {
      await _dio.post('/auth/reset-password', data: {
        'token': token,
        'newPassword': newPassword,
      });
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> logout() async {
    await _storage.clearAll();
  }

  Future<bool> isAuthenticated() async {
    final token = await _storage.getAccessToken();
    return token != null;
  }

  Future<String?> getUserRole() => _storage.getRole();
  Future<String?> getUserId() => _storage.getUserId();
  Future<String?> getProviderId() => _storage.getProviderId();

  Future<AuthResult> _handleAuthResponse(Map<String, dynamic> data) async {
    final result = AuthResult(
      userId: data['userId'] as int,
      providerId: data['providerId'] as int?,
      email: data['email'] as String,
      role: data['role'] as String,
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
    );

    await _storage.saveTokens(
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    );
    await _storage.saveUserInfo(
      userId: result.userId.toString(),
      providerId: result.providerId?.toString(),
      email: result.email,
      role: result.role,
    );

    return result;
  }
}

class AuthResult {
  final int userId;
  final int? providerId;
  final String email;
  final String role;
  final String accessToken;
  final String refreshToken;

  const AuthResult({
    required this.userId,
    this.providerId,
    required this.email,
    required this.role,
    required this.accessToken,
    required this.refreshToken,
  });
}
