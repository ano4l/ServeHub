import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/features/auth/presentation/forgot_password_screen.dart';
import 'package:serveify/features/auth/presentation/login_screen.dart';
import 'package:serveify/features/auth/presentation/register_screen.dart';
import 'package:serveify/features/auth/providers/auth_provider.dart';
import 'package:serveify/features/booking/presentation/bookings_screen.dart';
import 'package:serveify/features/booking/presentation/create_booking_screen.dart';
import 'package:serveify/features/browse/presentation/browse_screen.dart';
import 'package:serveify/features/browse/presentation/provider_detail_screen.dart';
import 'package:serveify/features/chat/presentation/chat_screen.dart';
import 'package:serveify/features/home/presentation/customer_home_screen.dart';
import 'package:serveify/features/notifications/presentation/notifications_screen.dart';
import 'package:serveify/features/profile/presentation/profile_screen.dart';
import 'package:serveify/features/provider_dashboard/presentation/provider_home_screen.dart';
import 'package:serveify/features/reviews/presentation/write_review_screen.dart';
import 'package:serveify/features/disputes/presentation/disputes_screen.dart';
import 'package:serveify/features/wallet/presentation/wallet_screen.dart';
import 'package:serveify/router/shell_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/login',
    redirect: (context, state) {
      final isAuth = authState.status == AuthStatus.authenticated;
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/forgot-password';

      if (!isAuth && !isAuthRoute) return '/login';
      if (isAuth && isAuthRoute) {
        if (authState.isProvider) return '/provider';
        return '/home';
      }
      return null;
    },
    routes: [
      // Auth routes (no shell)
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),

      // Full-screen routes (no bottom nav)
      GoRoute(
        path: '/providers/:id',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, state) {
          final id = int.parse(state.pathParameters['id']!);
          return ProviderDetailScreen(providerId: id);
        },
      ),
      GoRoute(
        path: '/book',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, state) {
          final serviceId = int.tryParse(state.uri.queryParameters['serviceId'] ?? '');
          final providerId = int.tryParse(state.uri.queryParameters['providerId'] ?? '');
          return CreateBookingScreen(serviceId: serviceId, providerId: providerId);
        },
      ),
      GoRoute(
        path: '/chat/:bookingId',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, state) {
          final bookingId = int.parse(state.pathParameters['bookingId']!);
          return ChatScreen(bookingId: bookingId);
        },
      ),
      GoRoute(
        path: '/review/:bookingId',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, state) {
          final bookingId = int.parse(state.pathParameters['bookingId']!);
          return WriteReviewScreen(bookingId: bookingId);
        },
      ),
      GoRoute(
        path: '/wallet',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, __) => const WalletScreen(),
      ),
      GoRoute(
        path: '/disputes',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, __) => const DisputesScreen(),
      ),

      // Customer shell
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (_, __, child) => ShellScreen(child: child),
        routes: [
          GoRoute(path: '/home', builder: (_, __) => const CustomerHomeScreen()),
          GoRoute(path: '/browse', builder: (_, __) => const BrowseScreen()),
          GoRoute(path: '/bookings', builder: (_, __) => const BookingsScreen()),
          GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
        ],
      ),

      // Provider shell
      ShellRoute(
        builder: (_, __, child) => ShellScreen(isProvider: true, child: child),
        routes: [
          GoRoute(path: '/provider', builder: (_, __) => const ProviderHomeScreen()),
          GoRoute(path: '/provider/bookings', builder: (_, __) => const BookingsScreen()),
          GoRoute(path: '/provider/notifications', builder: (_, __) => const NotificationsScreen()),
          GoRoute(path: '/provider/profile', builder: (_, __) => const ProfileScreen()),
        ],
      ),
    ],
  );
});
