import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/config/env.dart';
import 'package:serveify/core/notifications/push_notification_service.dart';
import 'package:serveify/features/auth/data/auth_repository.dart';

enum AuthStatus { initial, authenticated, unauthenticated, loading }

class AuthState {
  final AuthStatus status;
  final String? userId;
  final String? providerId;
  final String? email;
  final String? role;
  final String? error;

  const AuthState({
    this.status = AuthStatus.initial,
    this.userId,
    this.providerId,
    this.email,
    this.role,
    this.error,
  });

  bool get isProvider => role == 'PROVIDER';
  bool get isCustomer => role == 'CUSTOMER';
  bool get isAdmin => role == 'ADMIN' || role == 'SUPPORT';

  AuthState copyWith({
    AuthStatus? status,
    String? userId,
    String? providerId,
    String? email,
    String? role,
    String? error,
  }) {
    return AuthState(
      status: status ?? this.status,
      userId: userId ?? this.userId,
      providerId: providerId ?? this.providerId,
      email: email ?? this.email,
      role: role ?? this.role,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;
  final PushNotificationService _pushNotificationService;

  AuthNotifier(this._repository, this._pushNotificationService)
      : super(const AuthState()) {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    if (Env.testMode) {
      state = const AuthState(
        status: AuthStatus.authenticated,
        userId: '1',
        email: 'test@serveify.co.za',
        role: 'CUSTOMER',
      );
      return;
    }
    final isAuth = await _repository.isAuthenticated();
    if (isAuth) {
      final role = await _repository.getUserRole();
      final userId = await _repository.getUserId();
      final providerId = await _repository.getProviderId();
      state = AuthState(
        status: AuthStatus.authenticated,
        userId: userId,
        providerId: providerId,
        role: role,
      );
      unawaited(_pushNotificationService.onAuthenticated());
    } else {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> login({required String email, required String password}) async {
    state = state.copyWith(status: AuthStatus.loading, error: null);
    try {
      final result = await _repository.login(email: email, password: password);
      state = AuthState(
        status: AuthStatus.authenticated,
        userId: result.userId.toString(),
        providerId: result.providerId?.toString(),
        email: result.email,
        role: result.role,
      );
      unawaited(_pushNotificationService.onAuthenticated());
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        error: e.toString(),
      );
    }
  }

  Future<void> register({
    required String fullName,
    required String email,
    required String phoneNumber,
    required String password,
    required String role,
    String? city,
    int? serviceRadiusKm,
    String? bio,
  }) async {
    state = state.copyWith(status: AuthStatus.loading, error: null);
    try {
      final result = await _repository.register(
        fullName: fullName,
        email: email,
        phoneNumber: phoneNumber,
        password: password,
        role: role,
        city: city,
        serviceRadiusKm: serviceRadiusKm,
        bio: bio,
      );
      state = AuthState(
        status: AuthStatus.authenticated,
        userId: result.userId.toString(),
        providerId: result.providerId?.toString(),
        email: result.email,
        role: result.role,
      );
      unawaited(_pushNotificationService.onAuthenticated());
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        error: e.toString(),
      );
    }
  }

  Future<void> logout() async {
    await _pushNotificationService.prepareForLogout();
    await _repository.logout();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.read(authRepositoryProvider),
    ref.read(pushNotificationServiceProvider),
  );
});
