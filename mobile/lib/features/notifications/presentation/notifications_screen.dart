import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/core/config/env.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/network/stomp_service.dart';
import 'package:serveify/core/notifications/push_notification_service.dart';
import 'package:serveify/core/theme/app_theme.dart';

final _notificationsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  try {
    final response = await dio.get('/notifications');
    final raw = response.data is List
        ? response.data as List
        : (response.data is Map && response.data['content'] is List ? response.data['content'] as List : <dynamic>[]);
    return raw.map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      return {
        'id': map['id']?.toString() ?? '',
        'title': map['title']?.toString() ?? map['type']?.toString() ?? 'Notification',
        'message': map['message']?.toString() ?? 'You have a new update.',
        'createdAt': map['createdAt']?.toString() ?? DateTime.now().toIso8601String(),
        'link': map['link']?.toString() ?? '',
        'kind': _kindFromType(map['type']?.toString() ?? ''),
        'read': map['read'] == true,
        'action': _actionFromType(map['type']?.toString() ?? ''),
      };
    }).toList();
  } catch (_) {
    return [];
  }
});

final _notificationPreferencesProvider = FutureProvider<_NotificationPreferences>((ref) async {
  final dio = ref.read(dioProvider);
  try {
    final response = await dio.get('/notifications/preferences');
    final map = response.data is Map
        ? Map<String, dynamic>.from(response.data as Map)
        : const <String, dynamic>{};
    return _NotificationPreferences.fromMap(map);
  } catch (_) {
    return const _NotificationPreferences();
  }
});

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  void Function()? _realtimeUnsubscribe;

  @override
  void initState() {
    super.initState();
    if (!Env.testMode) {
      _realtimeUnsubscribe = ref.read(stompServiceProvider).subscribe(
        '/user/queue/notifications',
        (_) => ref.invalidate(_notificationsProvider),
      );
    }
  }

  @override
  void dispose() {
    _realtimeUnsubscribe?.call();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            onPressed: _showPreferencesSheet,
                            icon: const Icon(Icons.tune_rounded, color: AppColors.textPrimary),
                            tooltip: 'Notification settings',
                          ),
                          GestureDetector(
                            onTap: () async {
                              await ref.read(dioProvider).patch('/notifications/read-all');
                              ref.invalidate(_notificationsProvider);
                            },
                            child: const Text(
                              'Mark read',
                              style: TextStyle(color: AppColors.accent, fontSize: 14, fontWeight: FontWeight.w700),
                            ),
                          ),
                        ],
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
                        child: _NotificationCard(
                          notification: item,
                          onTap: () async {
                            if (item['read'] == true || item['id'] == null || item['id'].toString().isEmpty) {
                              _openLink(context, item['link']?.toString());
                              return;
                            }
                            await ref.read(dioProvider).patch('/notifications/${item['id']}/read');
                            ref.invalidate(_notificationsProvider);
                            if (context.mounted) {
                              _openLink(context, item['link']?.toString());
                            }
                          },
                        ),
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

  void _openLink(BuildContext context, String? rawLink) {
    final link = normalizeNotificationLink(rawLink);
    if (link == null || link.isEmpty) {
      return;
    }
    context.push(link);
  }

  Future<void> _showPreferencesSheet() async {
    final preferences = await ref.read(_notificationPreferencesProvider.future);
    if (!mounted) {
      return;
    }

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _NotificationPreferencesSheet(initialPreferences: preferences),
    );
  }
}

class _NotificationPreferences {
  final bool emailEnabled;
  final bool pushEnabled;
  final bool bookingUpdates;
  final bool messages;
  final bool promotions;

  const _NotificationPreferences({
    this.emailEnabled = true,
    this.pushEnabled = true,
    this.bookingUpdates = true,
    this.messages = true,
    this.promotions = false,
  });

  factory _NotificationPreferences.fromMap(Map<String, dynamic> map) {
    return _NotificationPreferences(
      emailEnabled: map['emailEnabled'] != false,
      pushEnabled: map['pushEnabled'] != false,
      bookingUpdates: map['bookingUpdates'] != false,
      messages: map['messages'] != false,
      promotions: map['promotions'] == true,
    );
  }

  _NotificationPreferences copyWith({
    bool? emailEnabled,
    bool? pushEnabled,
    bool? bookingUpdates,
    bool? messages,
    bool? promotions,
  }) {
    return _NotificationPreferences(
      emailEnabled: emailEnabled ?? this.emailEnabled,
      pushEnabled: pushEnabled ?? this.pushEnabled,
      bookingUpdates: bookingUpdates ?? this.bookingUpdates,
      messages: messages ?? this.messages,
      promotions: promotions ?? this.promotions,
    );
  }

  Map<String, dynamic> toRequest() {
    return {
      'emailEnabled': emailEnabled,
      'pushEnabled': pushEnabled,
      'bookingUpdates': bookingUpdates,
      'messages': messages,
      'promotions': promotions,
    };
  }
}

class _NotificationPreferencesSheet extends ConsumerStatefulWidget {
  final _NotificationPreferences initialPreferences;

  const _NotificationPreferencesSheet({required this.initialPreferences});

  @override
  ConsumerState<_NotificationPreferencesSheet> createState() => _NotificationPreferencesSheetState();
}

class _NotificationPreferencesSheetState extends ConsumerState<_NotificationPreferencesSheet> {
  late _NotificationPreferences _draft;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _draft = widget.initialPreferences;
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return SafeArea(
      top: false,
      child: Padding(
        padding: EdgeInsets.fromLTRB(12, 12, 12, bottomInset + 12),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: AppColors.border),
            boxShadow: _glassShadow,
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text('Notification settings', style: Theme.of(context).textTheme.titleLarge),
                    const Spacer(),
                    IconButton(
                      onPressed: _saving ? null : () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.close_rounded),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Choose which updates should reach you on mobile.',
                  style: TextStyle(color: AppColors.textSecondary, height: 1.4),
                ),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceAlt,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.info_outline_rounded,
                        color: AppColors.accent,
                        size: 18,
                      ),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Push alerts only work in Android and iPhone builds with Firebase configured. Local web runs will not receive them.',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                _PreferenceTile(
                  title: 'Push notifications',
                  subtitle: 'Booking changes, messages, and payment updates on this device.',
                  value: _draft.pushEnabled,
                  onChanged: (value) => setState(() => _draft = _draft.copyWith(pushEnabled: value)),
                ),
                const SizedBox(height: 10),
                _PreferenceTile(
                  title: 'Booking updates',
                  subtitle: 'Request, accept, reschedule, and completion alerts.',
                  value: _draft.bookingUpdates,
                  onChanged: _draft.pushEnabled
                      ? (value) => setState(() => _draft = _draft.copyWith(bookingUpdates: value))
                      : null,
                ),
                const SizedBox(height: 10),
                _PreferenceTile(
                  title: 'Messages',
                  subtitle: 'New chat messages from customers or providers.',
                  value: _draft.messages,
                  onChanged: _draft.pushEnabled
                      ? (value) => setState(() => _draft = _draft.copyWith(messages: value))
                      : null,
                ),
                const SizedBox(height: 10),
                _PreferenceTile(
                  title: 'Promotions',
                  subtitle: 'Discounts, launches, and other optional marketing.',
                  value: _draft.promotions,
                  onChanged: _draft.pushEnabled
                      ? (value) => setState(() => _draft = _draft.copyWith(promotions: value))
                      : null,
                ),
                const SizedBox(height: 10),
                _PreferenceTile(
                  title: 'Email summaries',
                  subtitle: 'Receive the same important updates by email.',
                  value: _draft.emailEnabled,
                  onChanged: (value) => setState(() => _draft = _draft.copyWith(emailEnabled: value)),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _saving ? null : _savePreferences,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.accent,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: _saving
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Save preferences'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _savePreferences() async {
    setState(() => _saving = true);
    try {
      final messenger = ScaffoldMessenger.of(context);
      await ref.read(dioProvider).put(
        '/notifications/preferences',
        data: _draft.toRequest(),
      );
      ref.invalidate(_notificationPreferencesProvider);
      if (_draft.pushEnabled) {
        unawaited(ref.read(pushNotificationServiceProvider).onAuthenticated());
      }
      if (mounted) {
        Navigator.of(context).pop();
        messenger.showSnackBar(
          const SnackBar(content: Text('Notification preferences updated')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not update notification settings')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }
}

class _PreferenceTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool>? onChanged;

  const _PreferenceTile({
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final enabled = onChanged != null;
    return AnimatedOpacity(
      duration: const Duration(milliseconds: 180),
      opacity: enabled ? 1 : 0.55,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border),
        ),
        child: SwitchListTile.adaptive(
          value: value,
          onChanged: onChanged,
          activeThumbColor: AppColors.accent,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              subtitle,
              style: const TextStyle(color: AppColors.textSecondary, height: 1.35),
            ),
          ),
        ),
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  final Map<String, dynamic> notification;
  final VoidCallback onTap;

  const _NotificationCard({required this.notification, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final meta = _notificationMeta(notification['kind']?.toString() ?? 'system');
    final read = notification['read'] == true;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
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
