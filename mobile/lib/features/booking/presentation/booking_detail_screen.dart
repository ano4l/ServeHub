import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';

final _bookingDetailProvider = FutureProvider.family<Map<String, dynamic>, int>((ref, id) async {
  final dio = ref.read(dioProvider);
  final response = await dio.get('/bookings/$id');
  return response.data as Map<String, dynamic>;
});

class BookingDetailScreen extends ConsumerWidget {
  final int bookingId;
  const BookingDetailScreen({super.key, required this.bookingId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingAsync = ref.watch(_bookingDetailProvider(bookingId));

    return Scaffold(
      appBar: AppBar(title: Text('Booking #$bookingId')),
      body: bookingAsync.when(
        data: (booking) => _BookingDetailBody(booking: booking, bookingId: bookingId),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 12),
              Text('Failed to load booking\n$e',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(_bookingDetailProvider(bookingId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BookingDetailBody extends StatelessWidget {
  final Map<String, dynamic> booking;
  final int bookingId;
  const _BookingDetailBody({required this.booking, required this.bookingId});

  @override
  Widget build(BuildContext context) {
    final status = booking['status']?.toString() ?? 'UNKNOWN';
    final serviceName = booking['serviceName']?.toString() ?? 'Service';
    final providerName = booking['providerName']?.toString() ?? 'Provider';
    final customerName = booking['customerName']?.toString() ?? 'Customer';
    final address = booking['address']?.toString() ?? '';
    final notes = booking['notes']?.toString();
    final scheduledFor = booking['scheduledFor']?.toString() ?? '';
    final price = booking['quotedPrice']?.toString() ?? '';
    final cancelReason = booking['cancelledReason']?.toString();
    final createdAt = booking['createdAt']?.toString() ?? '';

    final (statusColor, statusLabel) = _statusInfo(status);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: statusColor.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                Icon(_statusIcon(status), color: statusColor, size: 28),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(statusLabel,
                        style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 16)),
                    Text('Booking #$bookingId',
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Service info
          _SectionCard(
            title: 'Service',
            children: [
              _DetailRow(label: 'Service', value: serviceName),
              _DetailRow(label: 'Provider', value: providerName),
              _DetailRow(label: 'Customer', value: customerName),
            ],
          ),
          const SizedBox(height: 16),

          // Schedule & location
          _SectionCard(
            title: 'Details',
            children: [
              if (scheduledFor.isNotEmpty)
                _DetailRow(label: 'Scheduled', value: _formatDate(scheduledFor)),
              if (address.isNotEmpty)
                _DetailRow(label: 'Address', value: address),
              if (price.isNotEmpty)
                _DetailRow(label: 'Price', value: 'R$price'),
              if (notes != null && notes != 'null' && notes.isNotEmpty)
                _DetailRow(label: 'Notes', value: notes),
              if (createdAt.isNotEmpty)
                _DetailRow(label: 'Created', value: _formatDate(createdAt)),
            ],
          ),

          if (cancelReason != null && cancelReason != 'null' && cancelReason.isNotEmpty) ...[
            const SizedBox(height: 16),
            _SectionCard(
              title: 'Cancellation',
              children: [
                _DetailRow(label: 'Reason', value: cancelReason),
              ],
            ),
          ],

          const SizedBox(height: 24),

          // Actions
          if (status == 'ACCEPTED' || status == 'IN_PROGRESS')
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                onPressed: () => context.push('/chat/$bookingId'),
                icon: const Icon(Icons.chat_outlined),
                label: const Text('Open Chat'),
              ),
            ),
          if (status == 'COMPLETED') ...[
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: () => context.push('/review/$bookingId'),
                icon: const Icon(Icons.star_outline),
                label: const Text('Write Review'),
              ),
            ),
          ],
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  (Color, String) _statusInfo(String status) {
    return switch (status) {
      'REQUESTED' => (AppColors.info, 'Requested'),
      'ACCEPTED' => (AppColors.primary, 'Accepted'),
      'IN_PROGRESS' => (AppColors.warning, 'In Progress'),
      'COMPLETED' => (AppColors.success, 'Completed'),
      'REVIEWABLE' => (AppColors.success, 'Completed & Reviewed'),
      'CANCELLED' => (AppColors.error, 'Cancelled'),
      'DECLINED' => (AppColors.error, 'Declined'),
      'EXPIRED' => (AppColors.textMuted, 'Expired'),
      _ => (AppColors.textSecondary, status),
    };
  }

  IconData _statusIcon(String status) {
    return switch (status) {
      'REQUESTED' => Icons.pending_outlined,
      'ACCEPTED' => Icons.check_circle_outline,
      'IN_PROGRESS' => Icons.play_circle_outline,
      'COMPLETED' || 'REVIEWABLE' => Icons.task_alt,
      'CANCELLED' || 'DECLINED' => Icons.cancel_outlined,
      'EXPIRED' => Icons.timer_off_outlined,
      _ => Icons.info_outline,
    };
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso);
      return '${dt.day}/${dt.month}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return iso;
    }
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _SectionCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }
}
