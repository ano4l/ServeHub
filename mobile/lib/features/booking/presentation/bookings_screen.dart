import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/core/config/env.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/network/stomp_service.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/features/auth/providers/auth_provider.dart';

final _bookingsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  final response = await dio.get('/bookings');

  if (response.data is List) {
    return (response.data as List)
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  if (response.data is Map && response.data['content'] is List) {
    return (response.data['content'] as List)
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  return const [];
});

class BookingsScreen extends ConsumerStatefulWidget {
  const BookingsScreen({super.key});

  @override
  ConsumerState<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends ConsumerState<BookingsScreen> {
  void Function()? _realtimeUnsubscribe;

  @override
  void initState() {
    super.initState();
    if (!Env.testMode) {
      _realtimeUnsubscribe = ref.read(stompServiceProvider).subscribe(
        '/user/queue/bookings',
        (_) => ref.invalidate(_bookingsProvider),
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
    final bookings = ref.watch(_bookingsProvider);
    final auth = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(auth.isProvider ? 'Job Requests' : 'Bookings'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(_bookingsProvider),
        child: bookings.when(
          data: (items) {
            if (items.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 140),
                  _EmptyBookingsState(),
                ],
              );
            }

            final active = items
                .where((item) => !_isPast(item['status']?.toString() ?? ''))
                .toList();
            final past = items
                .where((item) => _isPast(item['status']?.toString() ?? ''))
                .toList();

            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
              children: [
                if (active.isNotEmpty) ...[
                  const _SectionLabel('Active'),
                  const SizedBox(height: 10),
                  ...active.map((booking) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _BookingCard(booking: booking),
                      )),
                  const SizedBox(height: 12),
                ],
                if (past.isNotEmpty) ...[
                  const _SectionLabel('Past'),
                  const SizedBox(height: 10),
                  ...past.map((booking) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _BookingCard(booking: booking),
                      )),
                ],
              ],
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => ListView(
            children: [
              const SizedBox(height: 140),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  'We could not load bookings.\n$error',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white70),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BookingCard extends ConsumerWidget {
  final Map<String, dynamic> booking;

  const _BookingCard({required this.booking});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final status = booking['status']?.toString() ?? 'UNKNOWN';
    final bookingId = booking['id']?.toString() ?? '';
    final counterpart = auth.isProvider
        ? booking['customerName']?.toString() ?? 'Customer'
        : booking['providerName']?.toString() ?? 'Provider';
    final counterpartLabel = auth.isProvider ? 'Customer' : 'Provider';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      booking['serviceName']?.toString() ?? 'Service',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '$counterpartLabel: $counterpart',
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              _StatusBadge(status: status),
            ],
          ),
          const SizedBox(height: 12),
          _MetaRow(
            icon: Icons.schedule_outlined,
            text: _formatDate(booking['scheduledFor']?.toString()),
          ),
          const SizedBox(height: 6),
          _MetaRow(
            icon: Icons.location_on_outlined,
            text: booking['address']?.toString() ?? 'No address',
          ),
          const SizedBox(height: 6),
          _MetaRow(
            icon: Icons.payments_outlined,
            text: 'Quoted ${_formatAmount(booking['quotedPrice'])}',
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              OutlinedButton(
                onPressed: bookingId.isEmpty
                    ? null
                    : () => context.push('/booking/$bookingId'),
                child: const Text('Details'),
              ),
              if (_canOpenChat(status))
                OutlinedButton(
                  onPressed: bookingId.isEmpty
                      ? null
                      : () => context.push('/chat/$bookingId'),
                  child: const Text('Chat'),
                ),
              ..._actionButtons(context, ref, auth.isProvider, status, bookingId),
            ],
          ),
        ],
      ),
    );
  }

  List<Widget> _actionButtons(
    BuildContext context,
    WidgetRef ref,
    bool isProvider,
    String status,
    String bookingId,
  ) {
    if (bookingId.isEmpty) {
      return const [];
    }

    Future<void> runAction(String path, {Object? data}) async {
      try {
        final dio = ref.read(dioProvider);
        await dio.post(path, data: data);
        ref.invalidate(_bookingsProvider);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Booking updated')),
          );
        }
      } on DioException catch (error) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(ApiException.fromDioError(error).message)),
          );
        }
      } catch (error) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(error.toString())),
          );
        }
      }
    }

    if (isProvider) {
      switch (status) {
        case 'REQUESTED':
          return [
            ElevatedButton(
              onPressed: () => runAction('/bookings/$bookingId/accept'),
              child: const Text('Accept'),
            ),
            OutlinedButton(
              onPressed: () => runAction(
                '/bookings/$bookingId/decline',
                data: {'reason': 'Declined from mobile app'},
              ),
              child: const Text('Decline'),
            ),
          ];
        case 'ACCEPTED':
          return [
            ElevatedButton(
              onPressed: () => runAction('/bookings/$bookingId/start'),
              child: const Text('Start'),
            ),
          ];
        case 'IN_PROGRESS':
          return [
            ElevatedButton(
              onPressed: () => runAction('/bookings/$bookingId/complete'),
              child: const Text('Complete'),
            ),
          ];
      }
    } else {
      switch (status) {
        case 'REQUESTED':
        case 'ACCEPTED':
          return [
            OutlinedButton(
              onPressed: () => runAction(
                '/bookings/$bookingId/cancel',
                data: {'reason': 'Cancelled from mobile app'},
              ),
              child: const Text('Cancel'),
            ),
          ];
        case 'COMPLETED':
          return [
            ElevatedButton(
              onPressed: () => context.push('/review/$bookingId'),
              child: const Text('Review'),
            ),
          ];
      }
    }

    return const [];
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;

  const _SectionLabel(this.label);

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        color: Colors.white,
        fontSize: 18,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'REQUESTED' => AppColors.warning,
      'ACCEPTED' => AppColors.accent,
      'IN_PROGRESS' => AppColors.info,
      'COMPLETED' => AppColors.success,
      'CANCELLED' || 'DECLINED' => AppColors.error,
      _ => AppColors.textSecondary,
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _MetaRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: Colors.white54, size: 16),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(color: AppColors.textSecondary),
          ),
        ),
      ],
    );
  }
}

class _EmptyBookingsState extends StatelessWidget {
  const _EmptyBookingsState();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const Icon(Icons.calendar_today_outlined, color: Colors.white54, size: 44),
          const SizedBox(height: 12),
          const Text(
            'No bookings yet',
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          Text(
            'When you make or receive bookings, they will show up here.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white.withValues(alpha: 0.65)),
          ),
        ],
      ),
    );
  }
}

bool _isPast(String status) =>
    status == 'COMPLETED' || status == 'CANCELLED' || status == 'DECLINED';

bool _canOpenChat(String status) =>
    status == 'ACCEPTED' || status == 'IN_PROGRESS' || status == 'COMPLETED';

String _formatDate(String? iso) {
  if (iso == null || iso.isEmpty) {
    return 'Unscheduled';
  }

  try {
    final date = DateTime.parse(iso).toLocal();
    return '${date.day}/${date.month}/${date.year} '
        '${date.hour.toString().padLeft(2, '0')}:'
        '${date.minute.toString().padLeft(2, '0')}';
  } catch (_) {
    return iso;
  }
}

String _formatAmount(dynamic value) {
  final amount = value is num ? value.toDouble() : double.tryParse('$value') ?? 0;
  final whole = amount.truncateToDouble() == amount;
  return whole ? 'R${amount.toStringAsFixed(0)}' : 'R${amount.toStringAsFixed(2)}';
}
