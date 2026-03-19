import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/demo/customer_demo_data.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';

final _notificationsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  try {
    final response = await dio.get('/notifications');
    final raw = response.data is List
        ? response.data as List
        : (response.data is Map && response.data['content'] is List ? response.data['content'] as List : <dynamic>[]);
    if (raw.isEmpty) return CustomerDemoData.notifications();
    return raw.map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      return {
        'id': map['id']?.toString() ?? '',
        'title': map['title']?.toString() ?? map['type']?.toString() ?? 'Notification',
        'message': map['message']?.toString() ?? 'You have a new update.',
        'createdAt': map['createdAt']?.toString() ?? DateTime.now().toIso8601String(),
        'kind': _kindFromType(map['type']?.toString() ?? ''),
        'read': map['read'] == true,
        'action': _actionFromType(map['type']?.toString() ?? ''),
      };
    }).toList();
  } catch (_) {
    return CustomerDemoData.notifications();
  }
});

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(_notificationsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.accent,
        onRefresh: () async => ref.invalidate(_notificationsProvider),
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Notifications', style: Theme.of(context).textTheme.headlineMedium),
                      GestureDetector(
                        onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Marked as read in demo mode')),
                        ),
                        child: const Text(
                          'Mark read',
                          style: TextStyle(color: AppColors.accent, fontSize: 14, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
                child: notifications.when(
                  data: (items) => Column(
                    children: items.map((item) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _NotificationCard(notification: item),
                      );
                    }).toList(),
                  ),
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (_, __) => const SizedBox.shrink(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  final Map<String, dynamic> notification;

  const _NotificationCard({required this.notification});

  @override
  Widget build(BuildContext context) {
    final meta = _notificationMeta(notification['kind']?.toString() ?? 'system');
    final read = notification['read'] == true;
    return Container(
      decoration: BoxDecoration(
        color: read ? AppColors.surface : AppColors.accent.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: read ? AppColors.border : AppColors.accent.withValues(alpha: 0.16),
        ),
        boxShadow: _glassShadow,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: meta.background,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(meta.icon, color: meta.foreground),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification['title']?.toString() ?? 'Notification',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: read ? FontWeight.w700 : FontWeight.w800,
                          ),
                        ),
                      ),
                      if (!read)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification['message']?.toString() ?? '',
                    style: const TextStyle(color: AppColors.textSecondary, height: 1.35),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Text(
                        _timeAgo(notification['createdAt']?.toString() ?? ''),
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                      const Spacer(),
                      if ((notification['action']?.toString() ?? '').isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: meta.foreground,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            notification['action']!.toString(),
                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationMeta {
  final IconData icon;
  final Color foreground;
  final Color background;

  const _NotificationMeta({required this.icon, required this.foreground, required this.background});
}

_NotificationMeta _notificationMeta(String kind) {
  switch (kind) {
    case 'booking':
      return const _NotificationMeta(icon: Icons.calendar_today_rounded, foreground: AppColors.info, background: AppColors.pastelBlue);
    case 'message':
      return const _NotificationMeta(icon: Icons.chat_bubble_outline_rounded, foreground: AppColors.accent, background: AppColors.pastelPurple);
    case 'payment':
      return const _NotificationMeta(icon: Icons.payments_rounded, foreground: AppColors.warning, background: AppColors.pastelYellow);
    case 'review':
      return const _NotificationMeta(icon: Icons.star_rounded, foreground: Color(0xFFFFB800), background: AppColors.pastelYellow);
    default:
      return const _NotificationMeta(icon: Icons.notifications_rounded, foreground: AppColors.textSecondary, background: AppColors.surfaceAlt);
  }
}

String _kindFromType(String type) {
  final lower = type.toLowerCase();
  if (lower.contains('message')) return 'message';
  if (lower.contains('payment')) return 'payment';
  if (lower.contains('review')) return 'review';
  if (lower.contains('booking')) return 'booking';
  return 'system';
}

String _actionFromType(String type) {
  final lower = type.toLowerCase();
  if (lower.contains('message')) return 'Reply';
  if (lower.contains('payment')) return 'Pay Now';
  if (lower.contains('review')) return 'Rate';
  if (lower.contains('booking')) return 'Open';
  return '';
}

String _timeAgo(String iso) {
  try {
    final date = DateTime.parse(iso);
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${date.day}/${date.month}/${date.year}';
  } catch (_) {
    return '';
  }
}

const _glassShadow = <BoxShadow>[
  BoxShadow(
    color: Color(0x66000000),
    blurRadius: 24,
    offset: Offset(0, 8),
  ),
];
