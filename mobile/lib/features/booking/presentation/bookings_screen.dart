import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/core/widgets/skeleton.dart';

final _bookingsProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  try {
    final response = await dio.get('/bookings', queryParameters: {'size': 50, 'sort': 'createdAt,desc'});
    if (response.data is List) return response.data as List;
    if (response.data is Map && response.data['content'] != null) {
      return response.data['content'] as List;
    }
    return [];
  } catch (_) {
    return [];
  }
});

class BookingsScreen extends ConsumerStatefulWidget {
  const BookingsScreen({super.key});

  @override
  ConsumerState<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends ConsumerState<BookingsScreen> {
  int _selectedTab = 0;
  final _tabs = const ['Active', 'Upcoming', 'Past'];

  @override
  Widget build(BuildContext context) {
    final bookings = ref.watch(_bookingsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.accent,
        onRefresh: () async => ref.invalidate(_bookingsProvider),
        child: CustomScrollView(
          slivers: [
            // Header
            SliverToBoxAdapter(
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Text('Bookings', style: Theme.of(context).textTheme.headlineMedium),
                ),
              ),
            ),

            // Tab pills
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                child: Row(
                  children: List.generate(_tabs.length, (i) {
                    final selected = i == _selectedTab;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedTab = i),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          decoration: BoxDecoration(
                            color: selected ? AppColors.primary : AppColors.surface,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Text(
                            _tabs[i],
                            style: TextStyle(
                              color: selected ? Colors.white : AppColors.textSecondary,
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ),
            ),

            // Booking list
            bookings.when(
              data: (list) {
                final filtered = switch (_selectedTab) {
                  0 => list.where((b) => _isActive(b['status']?.toString())).toList(),
                  1 => list.where((b) => _isUpcoming(b['status']?.toString())).toList(),
                  2 => list.where((b) => _isPast(b['status']?.toString())).toList(),
                  _ => list,
                };

                if (filtered.isEmpty) {
                  return SliverToBoxAdapter(child: _EmptyBookings(tab: _tabs[_selectedTab]));
                }

                return SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (_, i) => Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                      child: _BookingCard(booking: filtered[i], ref: ref),
                    ),
                    childCount: filtered.length,
                  ),
                );
              },
              loading: () => const SliverToBoxAdapter(
                child: BookingsSkeleton(),
              ),
              error: (_, __) => SliverToBoxAdapter(
                child: _ErrorState(
                  onRetry: () => ref.invalidate(_bookingsProvider),
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ),
      ),
    );
  }

  bool _isActive(String? s) => s == 'IN_PROGRESS' || s == 'ACCEPTED';
  bool _isUpcoming(String? s) => s == 'REQUESTED';
  bool _isPast(String? s) => s == 'COMPLETED' || s == 'CANCELLED' || s == 'DECLINED';
}

class _BookingCard extends StatelessWidget {
  final dynamic booking;
  final WidgetRef ref;
  const _BookingCard({required this.booking, required this.ref});

  @override
  Widget build(BuildContext context) {
    final status = booking['status']?.toString() ?? 'UNKNOWN';
    final service = booking['serviceName']?.toString() ?? 'Service';
    final provider = booking['providerName']?.toString() ?? 'Provider';
    final address = booking['address']?.toString() ?? '';
    final scheduledFor = booking['scheduledFor']?.toString() ?? '';
    final price = booking['quotedPrice']?.toString() ?? '';
    final bookingId = booking['id'];
    final (statusColor, statusLabel) = _statusInfo(status);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top row: service + status
          Row(
            children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(Icons.handyman_rounded, color: statusColor, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(service, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                    const SizedBox(height: 2),
                    Text(provider, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(statusLabel, style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w600)),
              ),
            ],
          ),

          // Details
          if (address.isNotEmpty || scheduledFor.isNotEmpty || price.isNotEmpty) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surfaceAlt,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                children: [
                  if (scheduledFor.isNotEmpty)
                    _DetailRow(icon: Icons.schedule_rounded, text: _formatDate(scheduledFor)),
                  if (address.isNotEmpty)
                    _DetailRow(icon: Icons.location_on_outlined, text: address),
                  if (price.isNotEmpty)
                    _DetailRow(icon: Icons.payments_outlined, text: 'R$price'),
                ],
              ),
            ),
          ],

          // Actions
          const SizedBox(height: 14),
          Row(
            children: [
              if (bookingId != null && (status == 'ACCEPTED' || status == 'IN_PROGRESS'))
                _ActionButton(
                  label: 'Chat',
                  icon: Icons.chat_bubble_outline_rounded,
                  onTap: () => context.push('/chat/$bookingId'),
                ),
              if (status == 'REQUESTED' || status == 'ACCEPTED') ...[
                if (bookingId != null && (status == 'ACCEPTED' || status == 'IN_PROGRESS'))
                  const SizedBox(width: 8),
                _ActionButton(
                  label: 'Cancel',
                  icon: Icons.close_rounded,
                  isDestructive: true,
                  onTap: () => _showCancelDialog(context),
                ),
              ],
              const Spacer(),
              if (status == 'COMPLETED' && bookingId != null)
                GestureDetector(
                  onTap: () => context.push('/review/$bookingId'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    decoration: BoxDecoration(
                      color: AppColors.accent,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.star_rounded, color: Colors.white, size: 16),
                        SizedBox(width: 6),
                        Text('Review', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  (Color, String) _statusInfo(String status) {
    return switch (status) {
      'REQUESTED' => (AppColors.warning, 'Pending'),
      'ACCEPTED' => (AppColors.info, 'Accepted'),
      'IN_PROGRESS' => (AppColors.accent, 'Active'),
      'COMPLETED' => (AppColors.success, 'Done'),
      'CANCELLED' || 'DECLINED' => (AppColors.error, 'Cancelled'),
      _ => (AppColors.textMuted, status),
    };
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso);
      final months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}, ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return iso;
    }
  }

  void _showCancelDialog(BuildContext context) {
    final bookingId = booking['id'];
    if (bookingId == null) return;
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Cancel Booking', style: TextStyle(fontWeight: FontWeight.w700)),
        content: TextField(
          controller: reasonController,
          decoration: const InputDecoration(hintText: 'Reason (optional)'),
          maxLines: 3,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Keep')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () async {
              try {
                await ref.read(dioProvider).put('/bookings/$bookingId/cancel', data: {
                  'reason': reasonController.text.trim().isEmpty ? null : reasonController.text.trim(),
                });
                if (context.mounted) Navigator.pop(context);
                ref.invalidate(_bookingsProvider);
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
                }
              }
            },
            child: const Text('Cancel Booking'),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _DetailRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppColors.textMuted),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13))),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool isDestructive;
  const _ActionButton({required this.label, required this.icon, required this.onTap, this.isDestructive = false});

  @override
  Widget build(BuildContext context) {
    final color = isDestructive ? AppColors.error : AppColors.textSecondary;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isDestructive ? AppColors.error.withValues(alpha: 0.08) : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _EmptyBookings extends StatelessWidget {
  final String tab;
  const _EmptyBookings({required this.tab});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(48),
      child: Column(
        children: [
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              color: AppColors.surfaceAlt,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(Icons.calendar_today_outlined, color: AppColors.textMuted, size: 28),
          ),
          const SizedBox(height: 16),
          Text('No ${tab.toLowerCase()} bookings', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
          const SizedBox(height: 4),
          const Text('Your bookings will appear here', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
        ],
      ),
    );
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
          const Text('Could not load bookings', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
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
