import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/features/auth/presentation/forgot_password_screen.dart';
import 'package:serveify/features/auth/presentation/login_screen.dart';
import 'package:serveify/features/auth/presentation/register_screen.dart';
import 'package:serveify/features/auth/presentation/customer_registration_screen.dart';
import 'package:serveify/features/auth/presentation/provider_onboarding_screen.dart';
import 'package:serveify/features/auth/providers/auth_provider.dart';
import 'package:serveify/features/booking/presentation/booking_detail_screen.dart';
import 'package:serveify/features/booking/presentation/bookings_screen.dart';
import 'package:serveify/features/booking/presentation/create_booking_screen.dart';
import 'package:serveify/features/browse/presentation/browse_screen.dart';
import 'package:serveify/features/browse/presentation/provider_detail_screen.dart';
import 'package:serveify/features/chat/presentation/chat_screen.dart';
import 'package:serveify/features/home/presentation/customer_home_screen.dart';
import 'package:serveify/features/services/presentation/services_directory_screen.dart';
import 'package:serveify/features/services/presentation/service_detail_screen.dart';
import 'package:serveify/features/notifications/presentation/notifications_screen.dart';
import 'package:serveify/features/profile/presentation/profile_screen.dart';
import 'package:serveify/features/provider_dashboard/presentation/provider_home_screen.dart';
import 'package:serveify/features/reviews/presentation/write_review_screen.dart';
import 'package:serveify/features/disputes/presentation/disputes_screen.dart';
import 'package:serveify/features/wallet/presentation/wallet_screen.dart';
import 'package:serveify/features/profile/presentation/edit_profile_screen.dart';
import 'package:serveify/features/addresses/presentation/addresses_screen.dart';
import 'package:serveify/features/provider_dashboard/presentation/availability_settings_screen.dart';
import 'package:serveify/features/provider_dashboard/presentation/provider_services_screen.dart';
import 'package:serveify/features/payment/presentation/payment_checkout_screen.dart';
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
          state.matchedLocation == '/register/customer' ||
          state.matchedLocation == '/register/provider' ||
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
      GoRoute(path: '/register/customer', builder: (_, __) => const CustomerRegistrationScreen()),
      GoRoute(path: '/register/provider', builder: (_, __) => const ProviderOnboardingScreen()),
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
        path: '/services/:id',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, state) {
          final id = int.parse(state.pathParameters['id']!);
          return ServiceDetailScreen(serviceId: id);
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
        path: '/booking/:bookingId',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, state) {
          final bookingId = int.parse(state.pathParameters['bookingId']!);
          return BookingDetailScreen(bookingId: bookingId);
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
        path: '/provider/wallet',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, __) => const WalletScreen(),
      ),
      GoRoute(
        path: '/disputes',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, __) => const DisputesScreen(),
      ),
      GoRoute(
        path: '/profile/edit',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, __) => const EditProfileScreen(),
      ),
      GoRoute(
        path: '/provider/services',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, __) => const ProviderServicesScreen(),
      ),
      GoRoute(
        path: '/provider/availability',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, __) => const AvailabilitySettingsScreen(),
      ),
      GoRoute(
        path: '/addresses',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, __) => const AddressesScreen(),
      ),
      GoRoute(
        path: '/payment/checkout',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final bookingId = int.tryParse(state.uri.queryParameters['bookingId'] ?? '');
          final amount = double.tryParse(state.uri.queryParameters['amount'] ?? '');
          final serviceName = state.uri.queryParameters['serviceName'] ?? '';
          if (bookingId == null || amount == null) {
            return const Scaffold(body: Center(child: Text('Invalid payment parameters')));
          }
          return PaymentCheckoutScreen(
            bookingId: bookingId,
            amount: amount,
            serviceName: serviceName,
          );
        },
      ),

      // Customer shell
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (_, __, child) => ShellScreen(child: child),
        routes: [
          GoRoute(path: '/home', builder: (_, __) => const CustomerHomeScreen()),
          GoRoute(path: '/services', builder: (_, __) => const ServicesDirectoryScreen()),
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
