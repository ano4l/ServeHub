import 'dart:ui';
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
      body: Stack(
        children: [
          child,
          // Floating glass nav bar
          Positioned(
            left: 16,
            right: 16,
            bottom: MediaQuery.of(context).padding.bottom + 12,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.navBackground,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.border),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.4),
                        blurRadius: 32,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Row(
                    children: _items(context).map((item) {
                      final active = _currentRoute(context) == item.route;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () => context.go(item.route),
                          behavior: HitTestBehavior.opaque,
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: active ? AppColors.navActiveBackground : Colors.transparent,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Icon(
                              active ? item.selectedIcon : item.icon,
                              color: active ? Colors.white : Colors.white.withValues(alpha: 0.5),
                              size: 22,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _currentRoute(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (isProvider) {
      if (location.startsWith('/provider/bookings')) return '/provider/bookings';
      if (location.startsWith('/provider/notifications')) return '/provider/notifications';
      if (location.startsWith('/provider/profile')) return '/provider/profile';
      return '/provider';
    }
    if (location.startsWith('/services')) return '/services';
    if (location.startsWith('/browse')) return '/browse';
    if (location.startsWith('/bookings')) return '/bookings';
    if (location.startsWith('/notifications')) return '/notifications';
    if (location.startsWith('/profile')) return '/profile';
    return '/home';
  }

  List<_ShellNavItem> _items(BuildContext context) {
    if (isProvider) {
      return const [
        _ShellNavItem(route: '/provider', label: 'Dashboard', icon: Icons.grid_view_outlined, selectedIcon: Icons.grid_view_rounded),
        _ShellNavItem(route: '/provider/bookings', label: 'Bookings', icon: Icons.calendar_today_outlined, selectedIcon: Icons.calendar_today_rounded),
        _ShellNavItem(route: '/provider/notifications', label: 'Alerts', icon: Icons.notifications_none_rounded, selectedIcon: Icons.notifications_rounded),
        _ShellNavItem(route: '/provider/profile', label: 'Profile', icon: Icons.person_outline_rounded, selectedIcon: Icons.person_rounded),
      ];
    }
    return const [
      _ShellNavItem(route: '/home', label: 'Home', icon: Icons.home_outlined, selectedIcon: Icons.home_rounded),
      _ShellNavItem(route: '/services', label: 'Services', icon: Icons.grid_view_outlined, selectedIcon: Icons.grid_view_rounded),
      _ShellNavItem(route: '/browse', label: 'Explore', icon: Icons.explore_outlined, selectedIcon: Icons.explore_rounded),
      _ShellNavItem(route: '/bookings', label: 'Bookings', icon: Icons.calendar_today_outlined, selectedIcon: Icons.calendar_today_rounded),
      _ShellNavItem(route: '/notifications', label: 'Alerts', icon: Icons.notifications_none_rounded, selectedIcon: Icons.notifications_rounded),
      _ShellNavItem(route: '/profile', label: 'Profile', icon: Icons.person_outline_rounded, selectedIcon: Icons.person_rounded),
    ];
  }
}

class _ShellNavItem {
  final String route;
  final String label;
  final IconData icon;
  final IconData selectedIcon;

  const _ShellNavItem({
    required this.route,
    required this.label,
    required this.icon,
    required this.selectedIcon,
  });
}
