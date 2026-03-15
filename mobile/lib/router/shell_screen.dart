import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/core/theme/app_theme.dart';

class ShellScreen extends StatelessWidget {
  final Widget child;
  final bool isProvider;

  const ShellScreen({super.key, required this.child, this.isProvider = false});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: child,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.divider, width: 1)),
        ),
        child: SafeArea(
          top: false,
          child: _buildNav(context),
        ),
      ),
    );
  }

  Widget _buildNav(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;

    if (isProvider) {
      final index = switch (location) {
        '/provider' => 0,
        '/provider/bookings' => 1,
        '/provider/notifications' => 2,
        '/provider/profile' => 3,
        _ => 0,
      };

      return NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) {
          switch (i) {
            case 0: context.go('/provider');
            case 1: context.go('/provider/bookings');
            case 2: context.go('/provider/notifications');
            case 3: context.go('/provider/profile');
          }
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.grid_view_outlined),
            selectedIcon: Icon(Icons.grid_view_rounded),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_today_outlined),
            selectedIcon: Icon(Icons.calendar_today_rounded),
            label: 'Bookings',
          ),
          NavigationDestination(
            icon: Icon(Icons.notifications_none_rounded),
            selectedIcon: Icon(Icons.notifications_rounded),
            label: 'Alerts',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded),
            label: 'Profile',
          ),
        ],
      );
    }

    final index = switch (location) {
      '/home' => 0,
      '/browse' => 1,
      '/bookings' => 2,
      '/notifications' => 3,
      '/profile' => 4,
      _ => 0,
    };

    return NavigationBar(
      selectedIndex: index,
      onDestinationSelected: (i) {
        switch (i) {
          case 0: context.go('/home');
          case 1: context.go('/browse');
          case 2: context.go('/bookings');
          case 3: context.go('/notifications');
          case 4: context.go('/profile');
        }
      },
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home_rounded),
          label: 'Home',
        ),
        NavigationDestination(
          icon: Icon(Icons.explore_outlined),
          selectedIcon: Icon(Icons.explore_rounded),
          label: 'Explore',
        ),
        NavigationDestination(
          icon: Icon(Icons.calendar_today_outlined),
          selectedIcon: Icon(Icons.calendar_today_rounded),
          label: 'Bookings',
        ),
        NavigationDestination(
          icon: Icon(Icons.notifications_none_rounded),
          selectedIcon: Icon(Icons.notifications_rounded),
          label: 'Alerts',
        ),
        NavigationDestination(
          icon: Icon(Icons.person_outline_rounded),
          selectedIcon: Icon(Icons.person_rounded),
          label: 'Profile',
        ),
      ],
    );
  }
}
