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
          border: Border(top: BorderSide(color: AppColors.divider)),
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(8, 10, 8, 12),
            child: Row(
              children: _items(context).map((item) {
                final active = _currentRoute(context) == item.route;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () => context.go(item.route),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: active ? AppColors.accentLight : Colors.transparent,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              active ? item.selectedIcon : item.icon,
                              color: active ? AppColors.accent : AppColors.textMuted,
                              size: 22,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              item.label,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: active ? FontWeight.w600 : FontWeight.w500,
                                color: active ? AppColors.accent : AppColors.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ),
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
