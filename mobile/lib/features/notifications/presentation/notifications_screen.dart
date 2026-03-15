import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/core/widgets/skeleton.dart';

final _notificationsProvider = FutureProvider<List<dynamic>>((ref) async {
  // Demo mode - return rich dummy data
  final now = DateTime.now();
  return [
    {
      'id': '1',
      'type': 'booking_accepted',
      'title': 'Booking Accepted!',
      'message': 'Sarah Johnson accepted your home cleaning request for tomorrow at 10:00 AM',
      'createdAt': now.subtract(const Duration(minutes: 5)).toIso8601String(),
      'read': false,
      'data': {
        'bookingId': '123',
        'providerName': 'Sarah Johnson',
        'serviceName': 'Home Cleaning Service',
        'scheduledAt': now.add(const Duration(days: 1, hours: 10)).toIso8601String(),
      },
      'icon': 'check_circle',
      'color': 'success'
    },
    {
      'id': '2',
      'type': 'message',
      'title': 'New Message',
      'message': 'Mike Chen: "I\'ll bring all necessary equipment for the AC repair. See you at 2 PM!"',
      'createdAt': now.subtract(const Duration(hours: 1)).toIso8601String(),
      'read': false,
      'data': {
        'senderId': '456',
        'senderName': 'Mike Chen',
        'bookingId': '124',
      },
      'icon': 'chat',
      'color': 'primary'
    },
    {
      'id': '3',
      'type': 'payment_required',
      'title': 'Payment Required',
      'message': 'Your payment of R450.00 is due for the completed gardening service',
      'createdAt': now.subtract(const Duration(hours: 3)).toIso8601String(),
      'read': false,
      'data': {
        'bookingId': '125',
        'amount': 450.00,
        'dueDate': now.add(const Duration(days: 2)).toIso8601String(),
      },
      'icon': 'payment',
      'color': 'warning'
    },
    {
      'id': '4',
      'type': 'review_request',
      'title': 'Rate Your Experience',
      'message': 'How was your plumbing service with David Williams? Share your feedback!',
      'createdAt': now.subtract(const Duration(days: 1)).toIso8601String(),
      'read': true,
      'data': {
        'bookingId': '126',
        'providerName': 'David Williams',
        'serviceName': 'Emergency Plumbing',
      },
      'icon': 'star',
      'color': 'accent'
    },
    {
      'id': '5',
      'type': 'promotion',
      'title': 'Special Offer!',
      'message': 'Get 20% off on all cleaning services this weekend. Book now!',
      'createdAt': now.subtract(const Duration(days: 2)).toIso8601String(),
      'read': true,
      'data': {
        'promoCode': 'CLEAN20',
        'discount': 20,
        'validUntil': now.add(const Duration(days: 3)).toIso8601String(),
      },
      'icon': 'local_offer',
      'color': 'primary'
    },
    {
      'id': '6',
      'type': 'booking_completed',
      'title': 'Service Completed',
      'message': 'Emma Rodriguez has completed the electrical installation. Please review the service.',
      'createdAt': now.subtract(const Duration(days: 3)).toIso8601String(),
      'read': true,
      'data': {
        'bookingId': '127',
        'providerName': 'Emma Rodriguez',
        'serviceName': 'Electrical Installation',
        'completedAt': now.subtract(const Duration(days: 3, hours: 2)).toIso8601String(),
      },
      'icon': 'task_alt',
      'color': 'success'
    },
    {
      'id': '7',
      'type': 'system_update',
      'title': 'App Update',
      'message': 'New features available: In-app chat, improved search, and faster booking!',
      'createdAt': now.subtract(const Duration(days: 4)).toIso8601String(),
      'read': true,
      'data': {
        'version': '2.1.0',
        'features': ['chat', 'search', 'booking'],
      },
      'icon': 'system_update',
      'color': 'info'
    },
    {
      'id': '8',
      'type': 'provider_nearby',
      'title': 'Provider Available Nearby',
      'message': '3 verified HVAC technicians are available in your area right now',
      'createdAt': now.subtract(const Duration(days: 5)).toIso8601String(),
      'read': true,
      'data': {
        'category': 'HVAC',
        'providersCount': 3,
        'location': 'Cape Town',
      },
      'icon': 'location_on',
      'color': 'info'
    }
  ];
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
                        onTap: () async {
                          try {
                            await ref.read(dioProvider).put('/notifications/read-all');
                            ref.invalidate(_notificationsProvider);
                          } catch (_) {}
                        },
                        child: Text('Mark read', style: TextStyle(color: AppColors.accent, fontSize: 14, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 16)),
            notifications.when(
              data: (list) {
                if (list.isEmpty) {
                  return SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(48),
                      child: Column(
                        children: [
                          Container(
                            width: 64, height: 64,
                            decoration: BoxDecoration(
                              color: AppColors.surfaceAlt,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Icon(Icons.notifications_none_rounded, color: AppColors.textMuted, size: 28),
                          ),
                          const SizedBox(height: 16),
                          const Text("You're all caught up", style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                          const SizedBox(height: 4),
                          const Text('No new notifications', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                        ],
                      ),
                    ),
                  );
                }
                return SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (_, i) => _NotificationCard(notification: list[i], ref: ref),
                    childCount: list.length,
                  ),
                );
              },
              loading: () => const SliverToBoxAdapter(
                child: NotificationsSkeleton(),
              ),
              error: (_, __) => SliverToBoxAdapter(
                child: _ErrorState(onRetry: () => ref.invalidate(_notificationsProvider)),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ),
      ),
    );
  }
}

String _formatTime(String isoString) {
  try {
    final dateTime = DateTime.parse(isoString);
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    }
  } catch (_) {
    return 'Unknown';
  }
}

class _NotificationCard extends StatelessWidget {
  final dynamic notification;
  final WidgetRef ref;
  const _NotificationCard({required this.notification, required this.ref});

  @override
  Widget build(BuildContext context) {
    final title = notification['title']?.toString() ?? 'Notification';
    final message = notification['message']?.toString() ?? '';
    final type = notification['type']?.toString() ?? '';
    final isRead = notification['read'] == true;
    final id = notification['id'];
    final createdAt = notification['createdAt']?.toString() ?? '';

    final (icon, iconColor, iconBg) = _iconForType(type);

    return GestureDetector(
      onTap: () async {
        if (!isRead && id != null) {
          try {
            await ref.read(dioProvider).put('/notifications/$id/read');
            ref.invalidate(_notificationsProvider);
          } catch (_) {}
        }
      },
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 10),
        decoration: BoxDecoration(
          color: isRead ? Colors.white : AppColors.primary.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(16),
          border: isRead 
              ? Border.all(color: AppColors.divider.withValues(alpha: 0.3))
              : Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isRead ? 0.02 : 0.05),
              blurRadius: isRead ? 8 : 12,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icon container
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  icon,
                  color: iconColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: TextStyle(
                              fontWeight: isRead ? FontWeight.w600 : FontWeight.w800,
                              fontSize: 15,
                              color: AppColors.textPrimary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (!isRead) ...[
                          const SizedBox(width: 8),
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      message,
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                        height: 1.3,
                        fontWeight: isRead ? FontWeight.w400 : FontWeight.w500,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Text(
                          _formatTime(createdAt),
                          style: TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const Spacer(),
                        // Action buttons based on type
                        if (type == 'payment_required')
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.warning,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              'Pay Now',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          )
                        else if (type == 'review_request')
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.accent,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              'Rate',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          )
                        else if (type == 'message')
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              'Reply',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
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
      ),
    );
  }
}
          borderRadius: BorderRadius.circular(18),
          border: !isRead ? Border.all(color: AppColors.accent.withValues(alpha: 0.2), width: 1) : null,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: iconColor, size: 20),
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
                          title,
                          style: TextStyle(
                            fontWeight: isRead ? FontWeight.w500 : FontWeight.w600,
                            fontSize: 14,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      if (!isRead)
                        Container(
                          width: 8, height: 8,
                          decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
                        ),
                    ],
                  ),
                  if (message.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      message,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.3),
                    ),
                  ],
                  if (createdAt.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(_timeAgo(createdAt), style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  (IconData, Color, Color) _iconForType(String type) {
    return switch (type) {
      'BOOKING' => (Icons.calendar_today_rounded, AppColors.info, AppColors.pastelBlue),
      'PAYMENT' => (Icons.payments_rounded, AppColors.success, AppColors.pastelGreen),
      'REVIEW' => (Icons.star_rounded, const Color(0xFFFFB800), AppColors.pastelYellow),
      'DISPUTE' => (Icons.gavel_rounded, AppColors.error, AppColors.pastelPink),
      _ => (Icons.notifications_rounded, AppColors.accent, AppColors.accentLight),
    };
  }

  String _timeAgo(String iso) {
    try {
      final dt = DateTime.parse(iso);
      final diff = DateTime.now().difference(dt);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return '';
    }
  }
}

class _ErrorState extends StatelessWidget {
  final VoidCallback onRetry;
  const _ErrorState({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(48),
      child: Column(
        children: [
          Container(
            width: 72, height: 72,
            decoration: BoxDecoration(
              color: AppColors.error.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 32),
          ),
          const SizedBox(height: 16),
          const Text('Something went wrong', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
          const SizedBox(height: 4),
          const Text('Could not load notifications', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
          const SizedBox(height: 20),
          GestureDetector(
            onTap: onRetry,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.accent,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Text('Try Again', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
            ),
          ),
        ],
      ),
    );
  }
}
