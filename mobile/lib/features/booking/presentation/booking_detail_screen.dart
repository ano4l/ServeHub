import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:serveify/core/config/env.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/network/stomp_service.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/features/auth/providers/auth_provider.dart';
import 'package:serveify/features/payment/data/payment_repository.dart';

final _bookingProvider =
    FutureProvider.family<Map<String, dynamic>, int>((ref, id) async {
  final response = await ref.read(dioProvider).get('/bookings/$id');
  return Map<String, dynamic>.from(response.data as Map);
});

final _bookingEventsProvider =
    FutureProvider.family<List<_BookingEvent>, int>((ref, id) async {
  final response = await ref.read(dioProvider).get('/bookings/$id/events');
  final list = response.data as List? ?? const <dynamic>[];
  return list
      .whereType<Map>()
      .map((item) => _BookingEvent.fromJson(Map<String, dynamic>.from(item)))
      .toList();
});

final _bookingPaymentProvider =
    FutureProvider.family<PaymentStatus, int>((ref, id) async {
  return ref.read(paymentRepositoryProvider).getPaymentStatus(id);
});

class BookingDetailScreen extends ConsumerStatefulWidget {
  final int bookingId;
  const BookingDetailScreen({super.key, required this.bookingId});

  @override
  ConsumerState<BookingDetailScreen> createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends ConsumerState<BookingDetailScreen> {
  void Function()? _unsubscribe;
  bool _busy = false;
  String? _busyLabel;

  @override
  void initState() {
    super.initState();
    if (!Env.testMode) {
      _unsubscribe = ref.read(stompServiceProvider).subscribe(
        '/user/queue/bookings/${widget.bookingId}/events',
        (_) => _invalidate(),
      );
    }
  }

  @override
  void dispose() {
    _unsubscribe?.call();
    super.dispose();
  }

  void _invalidate() {
    ref.invalidate(_bookingProvider(widget.bookingId));
    ref.invalidate(_bookingEventsProvider(widget.bookingId));
    ref.invalidate(_bookingPaymentProvider(widget.bookingId));
  }

  Future<void> _refresh() async {
    _invalidate();
    await Future.wait([
      ref.read(_bookingProvider(widget.bookingId).future).catchError((_) {}),
      ref.read(_bookingEventsProvider(widget.bookingId).future).catchError((_) {}),
      ref.read(_bookingPaymentProvider(widget.bookingId).future).catchError((_) {}),
    ]);
  }

  Future<void> _post(
    String path, {
    Object? data,
    required String loading,
    required String success,
  }) async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _busyLabel = loading;
    });
    try {
      await ref.read(dioProvider).post(path, data: data);
      _invalidate();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(success)));
      }
    } on DioException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ApiException.fromDioError(error).message)),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _busy = false;
          _busyLabel = null;
        });
      }
    }
  }

  Future<String?> _reasonDialog(String title, String hint) async {
    final controller = TextEditingController();
    final value = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          minLines: 3,
          maxLines: 5,
          decoration: InputDecoration(hintText: hint),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Close'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(controller.text.trim()),
            child: const Text('Continue'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (value == null || value.trim().isEmpty) return null;
    return value.trim();
  }

  Future<void> _openReschedule(Map<String, dynamic> booking) async {
    final providerId = (booking['providerId'] as num?)?.toInt();
    final scheduledAt = DateTime.tryParse(booking['scheduledFor']?.toString() ?? '');
    final duration = (booking['estimatedDurationMinutes'] as num?)?.toInt() ?? 60;
    if (providerId == null || scheduledAt == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Unable to load reschedule options.')),
        );
      }
      return;
    }
    final changed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _RescheduleSheet(
        bookingId: widget.bookingId,
        providerId: providerId,
        currentScheduledAt: scheduledAt,
        durationMinutes: duration,
      ),
    );
    if (changed == true) {
      _invalidate();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Booking rescheduled')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bookingAsync = ref.watch(_bookingProvider(widget.bookingId));
    final eventsAsync = ref.watch(_bookingEventsProvider(widget.bookingId));
    final paymentAsync = ref.watch(_bookingPaymentProvider(widget.bookingId));
    final auth = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Booking #${widget.bookingId}'),
        actions: [
          IconButton(
            onPressed: _busy ? null : _refresh,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: bookingAsync.when(
        data: (booking) => _buildBody(context, auth, booking, paymentAsync, eventsAsync),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Failed to load booking\n$error')),
      ),
    );
  }

  Widget _buildBody(
    BuildContext context,
    AuthState auth,
    Map<String, dynamic> booking,
    AsyncValue<PaymentStatus> paymentAsync,
    AsyncValue<List<_BookingEvent>> eventsAsync,
  ) {
    final status = booking['status']?.toString() ?? 'UNKNOWN';
    final service = booking['serviceName']?.toString() ?? 'Service';
    final provider = booking['providerName']?.toString() ?? 'Provider';
    final customer = booking['customerName']?.toString() ?? 'Customer';
    final scheduledFor = booking['scheduledFor']?.toString() ?? '';
    final address = booking['address']?.toString() ?? '';
    final notes = booking['notes']?.toString();
    final cancelReason = booking['cancelledReason']?.toString();
    final createdAt = booking['createdAt']?.toString() ?? '';
    final price = booking['quotedPrice'];
    final duration = (booking['estimatedDurationMinutes'] as num?)?.toInt() ?? 60;
    final isProvider = auth.isProvider;
    final counterpartLabel = isProvider ? 'Customer' : 'Provider';
    final counterpartValue = isProvider ? customer : provider;
    final statusColor = _statusColor(status);

    final canReschedule = status == 'REQUESTED' || status == 'ACCEPTED';
    final canChat = status == 'ACCEPTED' || status == 'IN_PROGRESS' || status == 'COMPLETED' || status == 'REVIEWABLE';

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: statusColor.withValues(alpha: 0.28)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(_statusIcon(status), color: statusColor),
                    const SizedBox(width: 10),
                    Text(
                      _statusLabel(status),
                      style: TextStyle(color: statusColor, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(service, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                Text(_fmtDate(scheduledFor), style: const TextStyle(color: AppColors.textSecondary)),
              ],
            ),
          ),
          if (_busy) ...[
            const SizedBox(height: 12),
            _Section(
              title: 'Updating',
              child: Row(
                children: [
                  const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
                  const SizedBox(width: 12),
                  Expanded(child: Text(_busyLabel ?? 'Updating booking...', style: const TextStyle(color: AppColors.textSecondary))),
                ],
              ),
            ),
          ],
          const SizedBox(height: 16),
          _Section(
            title: 'Details',
            child: Column(
              children: [
                _row('Service', service),
                _row(counterpartLabel, counterpartValue),
                _row('Scheduled', _fmtDate(scheduledFor)),
                _row('Duration', '$duration min'),
                if (address.isNotEmpty) _row('Address', address),
                _row('Quoted', _fmtMoney(price)),
                if (notes != null && notes.trim().isNotEmpty) _row('Notes', notes.trim()),
                if (createdAt.isNotEmpty) _row('Created', _fmtDate(createdAt), last: true),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _Section(
            title: 'Payment',
            child: paymentAsync.when(
              data: (payment) => _paymentView(
                context,
                status,
                payment,
                canRetryAuthorization: auth.isCustomer,
              ),
              loading: () => const Text('Loading payment status...'),
              error: (error, _) => Text('Could not load payment status\n$error'),
            ),
          ),
          const SizedBox(height: 16),
          _Section(
            title: 'Timeline',
            child: eventsAsync.when(
              data: (events) => events.isEmpty
                  ? const Text('Timeline updates will appear here as the booking moves forward.')
                  : Column(
                      children: [
                        for (var i = 0; i < events.length; i++)
                          _timeline(events[i], i == events.length - 1),
                      ],
                    ),
              loading: () => const Text('Loading booking history...'),
              error: (error, _) => Text('Could not load history\n$error'),
            ),
          ),
          if (cancelReason != null && cancelReason.trim().isNotEmpty) ...[
            const SizedBox(height: 16),
            _Section(title: 'Cancellation', child: Text(cancelReason.trim())),
          ],
          const SizedBox(height: 16),
          _Section(
            title: 'Actions',
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (isProvider && status == 'REQUESTED')
                  FilledButton(onPressed: _busy ? null : () => _post('/bookings/${widget.bookingId}/accept', loading: 'Accepting booking', success: 'Booking accepted'), child: const Text('Accept')),
                if (isProvider && status == 'REQUESTED')
                  OutlinedButton(
                    onPressed: _busy
                        ? null
                        : () async {
                            final reason = await _reasonDialog('Decline request', 'Share a short reason');
                            if (reason != null) {
                              await _post('/bookings/${widget.bookingId}/decline', data: {'reason': reason}, loading: 'Declining request', success: 'Booking declined');
                            }
                          },
                    child: const Text('Decline'),
                  ),
                if (isProvider && status == 'ACCEPTED')
                  FilledButton(onPressed: _busy ? null : () => _post('/bookings/${widget.bookingId}/start', loading: 'Starting booking', success: 'Booking started'), child: const Text('Start')),
                if (isProvider && status == 'IN_PROGRESS')
                  FilledButton(onPressed: _busy ? null : () => _post('/bookings/${widget.bookingId}/complete', loading: 'Completing booking', success: 'Booking completed'), child: const Text('Complete')),
                if (canReschedule)
                  OutlinedButton(onPressed: _busy ? null : () => _openReschedule(booking), child: const Text('Reschedule')),
                if (!isProvider && canReschedule)
                  OutlinedButton(
                    onPressed: _busy
                        ? null
                        : () async {
                            final reason = await _reasonDialog('Cancel booking', 'Tell the other side why this is cancelled');
                            if (reason != null) {
                              await _post('/bookings/${widget.bookingId}/cancel', data: {'reason': reason}, loading: 'Cancelling booking', success: 'Booking cancelled');
                            }
                          },
                    child: const Text('Cancel'),
                  ),
                if (canChat)
                  OutlinedButton.icon(onPressed: _busy ? null : () => context.push('/chat/${widget.bookingId}'), icon: const Icon(Icons.chat_outlined), label: const Text('Chat')),
                if (!isProvider && (status == 'COMPLETED' || status == 'REVIEWABLE'))
                  FilledButton(onPressed: _busy ? null : () => context.push('/review/${widget.bookingId}'), child: const Text('Review')),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _paymentView(
    BuildContext context,
    String bookingStatus,
    PaymentStatus payment, {
    required bool canRetryAuthorization,
  }) {
    final color = _paymentColor(payment.status);
    final canRetry = canRetryAuthorization &&
        payment.status == 'INITIATED' &&
        bookingStatus != 'CANCELLED' &&
        bookingStatus != 'DECLINED' &&
        bookingStatus != 'EXPIRED';
    if (payment.status == 'NOT_FOUND') {
      return const Text('This booking does not have a payment record yet.');
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(999)),
              child: Text(_paymentLabel(payment.status), style: TextStyle(color: color, fontWeight: FontWeight.w700)),
            ),
            const Spacer(),
            Text(_fmtMoney(payment.grossAmount), style: const TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
        const SizedBox(height: 10),
        _row('Reference', payment.reference),
        if (payment.updatedAt != null) _row('Updated', _fmtDate(payment.updatedAt!), last: true),
        const SizedBox(height: 8),
        Text(_paymentHelp(payment.status), style: const TextStyle(color: AppColors.textSecondary, height: 1.4)),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            OutlinedButton.icon(onPressed: _busy ? null : _refresh, icon: const Icon(Icons.refresh_rounded), label: const Text('Refresh')),
            if (canRetry)
              FilledButton.icon(
                onPressed: _busy
                    ? null
                    : () => _post('/payments/booking/${widget.bookingId}/authorize', loading: 'Refreshing payment', success: 'Payment updated'),
                icon: const Icon(Icons.lock_clock_outlined),
                label: const Text('Retry authorization'),
              ),
          ],
        ),
      ],
    );
  }
}

class _BookingEvent {
  final String eventType;
  final String detail;
  final DateTime occurredAt;
  const _BookingEvent({
    required this.eventType,
    required this.detail,
    required this.occurredAt,
  });

  factory _BookingEvent.fromJson(Map<String, dynamic> json) {
    return _BookingEvent(
      eventType: json['eventType']?.toString() ?? 'STATUS_CHANGED',
      detail: json['detail']?.toString() ?? 'Booking updated',
      occurredAt: DateTime.tryParse(json['occurredAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final Widget child;
  const _Section({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}

Widget _row(String label, String value, {bool last = false}) {
  return Padding(
    padding: EdgeInsets.only(bottom: last ? 0 : 10),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 92,
          child: Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
        ),
        Expanded(
          child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, height: 1.4)),
        ),
      ],
    ),
  );
}

Widget _timeline(_BookingEvent event, bool last) {
  final color = switch (event.eventType) {
    'BOOKING_CANCELLED' => AppColors.error,
    'BOOKING_RESCHEDULED' => AppColors.warning,
    'BOOKING_CREATED' => AppColors.info,
    _ => AppColors.accent,
  };
  final icon = switch (event.eventType) {
    'BOOKING_CANCELLED' => Icons.cancel_outlined,
    'BOOKING_RESCHEDULED' => Icons.event_repeat_rounded,
    'BOOKING_CREATED' => Icons.add_task_rounded,
    _ => Icons.sync_alt_rounded,
  };
  return IntrinsicHeight(
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(color: color.withValues(alpha: 0.12), shape: BoxShape.circle),
              child: Icon(icon, size: 17, color: color),
            ),
            if (!last)
              Expanded(
                child: Container(
                  width: 2,
                  margin: const EdgeInsets.symmetric(vertical: 6),
                  color: AppColors.border,
                ),
              ),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 4, bottom: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_eventTitle(event.eventType), style: const TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(event.detail, style: const TextStyle(color: AppColors.textSecondary, height: 1.4)),
                const SizedBox(height: 6),
                Text(_fmtDate(event.occurredAt.toIso8601String()), style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}

String _eventTitle(String eventType) {
  return switch (eventType) {
    'BOOKING_CREATED' => 'Booking created',
    'BOOKING_RESCHEDULED' => 'Rescheduled',
    'BOOKING_CANCELLED' => 'Cancelled',
    'STATUS_CHANGED' => 'Status updated',
    _ => eventType.replaceAll('_', ' '),
  };
}

Color _statusColor(String status) {
  return switch (status) {
    'REQUESTED' => AppColors.info,
    'ACCEPTED' => AppColors.accent,
    'IN_PROGRESS' => AppColors.warning,
    'COMPLETED' || 'REVIEWABLE' => AppColors.success,
    'CANCELLED' || 'DECLINED' => AppColors.error,
    _ => AppColors.textSecondary,
  };
}

String _statusLabel(String status) {
  return switch (status) {
    'REQUESTED' => 'Requested',
    'ACCEPTED' => 'Accepted',
    'IN_PROGRESS' => 'In progress',
    'COMPLETED' => 'Completed',
    'REVIEWABLE' => 'Completed & reviewed',
    'CANCELLED' => 'Cancelled',
    'DECLINED' => 'Declined',
    'EXPIRED' => 'Expired',
    _ => status,
  };
}

IconData _statusIcon(String status) {
  return switch (status) {
    'REQUESTED' => Icons.pending_outlined,
    'ACCEPTED' => Icons.event_available_rounded,
    'IN_PROGRESS' => Icons.play_circle_outline_rounded,
    'COMPLETED' || 'REVIEWABLE' => Icons.task_alt_rounded,
    'CANCELLED' || 'DECLINED' => Icons.cancel_outlined,
    _ => Icons.info_outline_rounded,
  };
}

Color _paymentColor(String status) {
  return switch (status) {
    'AUTHORIZED' => AppColors.accent,
    'CAPTURED' => AppColors.success,
    'REFUNDED' => AppColors.warning,
    'FAILED' => AppColors.error,
    _ => AppColors.info,
  };
}

String _paymentLabel(String status) {
  return switch (status) {
    'INITIATED' => 'Pending',
    'AUTHORIZED' => 'Authorized',
    'CAPTURED' => 'Captured',
    'REFUNDED' => 'Refunded',
    'FAILED' => 'Failed',
    _ => status,
  };
}

String _paymentHelp(String status) {
  return switch (status) {
    'INITIATED' => 'Payment is created and ready for collection. This is where PayFast checkout can attach later without changing the booking flow again.',
    'AUTHORIZED' => 'Payment has been authorized and the booking can continue normally.',
    'CAPTURED' => 'Payment was captured after completion.',
    'REFUNDED' => 'Payment was refunded because the booking was reversed or cancelled.',
    _ => 'Payment status is being tracked for this booking.',
  };
}

String _fmtDate(String iso) {
  final date = DateTime.tryParse(iso)?.toLocal();
  if (date == null) return iso;
  return DateFormat('EEE, d MMM yyyy · HH:mm').format(date);
}

String _fmtMoney(dynamic value) {
  final amount = value is num ? value.toDouble() : double.tryParse('$value') ?? 0;
  return 'R${amount.toStringAsFixed(amount.truncateToDouble() == amount ? 0 : 2)}';
}

String _fmtOffset(DateTime value) {
  String two(int number) => number.toString().padLeft(2, '0');
  final offset = value.timeZoneOffset;
  final sign = offset.isNegative ? '-' : '+';
  final minutes = offset.inMinutes.abs();
  final hoursPart = (minutes ~/ 60).toString().padLeft(2, '0');
  final minutesPart = (minutes % 60).toString().padLeft(2, '0');
  return '${value.year}-${two(value.month)}-${two(value.day)}T${two(value.hour)}:${two(value.minute)}:00$sign$hoursPart:$minutesPart';
}

bool _sameDay(DateTime left, DateTime right) {
  return left.year == right.year && left.month == right.month && left.day == right.day;
}

class _RescheduleSheet extends ConsumerStatefulWidget {
  final int bookingId;
  final int providerId;
  final DateTime currentScheduledAt;
  final int durationMinutes;

  const _RescheduleSheet({
    required this.bookingId,
    required this.providerId,
    required this.currentScheduledAt,
    required this.durationMinutes,
  });

  @override
  ConsumerState<_RescheduleSheet> createState() => _RescheduleSheetState();
}

class _RescheduleSheetState extends ConsumerState<_RescheduleSheet> {
  final _reasonController = TextEditingController();
  bool _loading = true;
  bool _saving = false;
  String? _error;
  List<_BookableDay> _days = const [];
  DateTime? _selectedDate;
  _BookableSlot? _selectedSlot;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final response = await ref.read(dioProvider).get(
        '/providers/${widget.providerId}/availability/slots',
        queryParameters: {
          'from': DateFormat('yyyy-MM-dd').format(DateTime.now()),
          'days': 21,
          'durationMinutes': widget.durationMinutes.clamp(30, 720),
          'excludeBookingId': widget.bookingId,
        },
      );
      final list = response.data as List? ?? const <dynamic>[];
      final days = list
          .whereType<Map>()
          .map((item) => _BookableDay.fromJson(Map<String, dynamic>.from(item)))
          .where((day) => day.slots.isNotEmpty)
          .toList();
      _selectedDate = days.isEmpty ? null : days.first.date;
      _selectedSlot = days.isEmpty ? null : days.first.slots.first;
      setState(() {
        _days = days;
        _loading = false;
      });
    } on DioException catch (error) {
      setState(() {
        _loading = false;
        _error = ApiException.fromDioError(error).message;
      });
    }
  }

  Future<void> _submit() async {
    final slot = _selectedSlot;
    if (slot == null || _saving) return;
    if (slot.startsAt.year == widget.currentScheduledAt.year &&
        slot.startsAt.month == widget.currentScheduledAt.month &&
        slot.startsAt.day == widget.currentScheduledAt.day &&
        slot.startsAt.hour == widget.currentScheduledAt.hour &&
        slot.startsAt.minute == widget.currentScheduledAt.minute) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Choose a different time to reschedule.')),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      await ref.read(dioProvider).post(
        '/bookings/${widget.bookingId}/reschedule',
        data: {
          'newScheduledFor': _fmtOffset(slot.startsAt),
          if (_reasonController.text.trim().isNotEmpty) 'reason': _reasonController.text.trim(),
        },
      );
      if (mounted) Navigator.of(context).pop(true);
    } on DioException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ApiException.fromDioError(error).message)),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final slots = _days
        .where((day) => _selectedDate != null && _sameDay(day.date, _selectedDate!))
        .map((day) => day.slots)
        .expand((items) => items)
        .toList();
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.of(context).viewInsets.bottom + 16,
        ),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.border),
          ),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Expanded(
                      child: Text('Reschedule booking', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                    ),
                    IconButton(onPressed: _saving ? null : () => Navigator.of(context).pop(), icon: const Icon(Icons.close_rounded)),
                  ],
                ),
                const SizedBox(height: 6),
                Text('Current time: ${_fmtDate(widget.currentScheduledAt.toIso8601String())}', style: const TextStyle(color: AppColors.textSecondary)),
                const SizedBox(height: 16),
                if (_loading)
                  const Center(child: Padding(padding: EdgeInsets.symmetric(vertical: 28), child: CircularProgressIndicator()))
                else if (_error != null)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_error!),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(onPressed: _load, icon: const Icon(Icons.refresh_rounded), label: const Text('Retry')),
                    ],
                  )
                else if (_days.isEmpty)
                  const Text('No open slots are available right now.')
                else ...[
                  const Text('Choose a day', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        for (final day in _days)
                          Padding(
                            padding: const EdgeInsets.only(right: 10),
                            child: ChoiceChip(
                              label: Text('${DateFormat('EEE').format(day.date)} ${day.date.day}'),
                              selected: _selectedDate != null && _sameDay(day.date, _selectedDate!),
                              onSelected: (_) => setState(() {
                                _selectedDate = day.date;
                                _selectedSlot = day.slots.first;
                              }),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text('Choose a time', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final slot in slots)
                        ChoiceChip(
                          label: Text(slot.label),
                          selected: identical(_selectedSlot, slot),
                          onSelected: (_) => setState(() => _selectedSlot = slot),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _reasonController,
                    minLines: 3,
                    maxLines: 5,
                    decoration: const InputDecoration(
                      labelText: 'Reason for change',
                      hintText: 'Optional note for the other side',
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      OutlinedButton(onPressed: _saving ? null : _load, child: const Text('Refresh')),
                      const Spacer(),
                      FilledButton.icon(
                        onPressed: _saving || _selectedSlot == null ? null : _submit,
                        icon: _saving
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.schedule_send_rounded),
                        label: Text(_saving ? 'Saving...' : 'Confirm'),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BookableDay {
  final DateTime date;
  final List<_BookableSlot> slots;
  const _BookableDay({required this.date, required this.slots});

  factory _BookableDay.fromJson(Map<String, dynamic> json) {
    final parsed = DateTime.tryParse(json['date']?.toString() ?? '') ?? DateTime.now();
    final slots = (json['slots'] as List? ?? const <dynamic>[])
        .whereType<Map>()
        .map((item) => _BookableSlot.fromJson(Map<String, dynamic>.from(item)))
        .toList();
    return _BookableDay(date: DateTime(parsed.year, parsed.month, parsed.day), slots: slots);
  }
}

class _BookableSlot {
  final DateTime startsAt;
  final String label;
  const _BookableSlot({required this.startsAt, required this.label});

  factory _BookableSlot.fromJson(Map<String, dynamic> json) {
    final start = DateTime.tryParse(json['startsAt']?.toString() ?? '') ?? DateTime.now();
    return _BookableSlot(
      startsAt: start,
      label: json['label']?.toString() ?? DateFormat('HH:mm').format(start),
    );
  }
}
