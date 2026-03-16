import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/demo/customer_demo_data.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';

const _softShadow = [
  BoxShadow(
    color: Color(0x0A000000),
    blurRadius: 20,
    offset: Offset(0, 4),
  ),
];

final _bookingsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  try {
    final response = await dio.get('/bookings', queryParameters: {'size': 12, 'sort': 'createdAt,desc'});
    final raw = response.data is List
        ? response.data as List
        : (response.data is Map && response.data['content'] is List ? response.data['content'] as List : <dynamic>[]);
    if (raw.isEmpty) return CustomerDemoData.bookings();
    return raw.map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      return {
        'id': map['id']?.toString() ?? '',
        'service': map['serviceName']?.toString() ?? 'Service',
        'provider': map['providerName']?.toString() ?? 'Provider',
        'status': map['status']?.toString() ?? 'REQUESTED',
        'scheduledAt': map['scheduledFor']?.toString() ?? map['scheduledAt']?.toString() ?? DateTime.now().toIso8601String(),
        'price': map['quotedPrice']?.toString() ?? map['price']?.toString() ?? '',
        'address': map['address']?.toString() ?? '',
        'thread': const <Map<String, dynamic>>[],
      };
    }).toList();
  } catch (_) {
    return CustomerDemoData.bookings();
  }
});

class BookingsScreen extends ConsumerStatefulWidget {
  const BookingsScreen({super.key});

  @override
  ConsumerState<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends ConsumerState<BookingsScreen> {
  String? _selectedBookingId;
  final _messageController = TextEditingController();

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bookingsAsync = ref.watch(_bookingsProvider);

    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      body: RefreshIndicator(
        color: AppColors.accent,
        onRefresh: () async => ref.invalidate(_bookingsProvider),
        child: bookingsAsync.when(
          data: (bookings) {
            final selected = bookings.firstWhere(
              (item) => item['id'] == (_selectedBookingId ?? bookings.first['id']),
              orElse: () => bookings.first,
            );
            _selectedBookingId ??= selected['id']?.toString();
            final thread = (selected['thread'] as List?)?.cast<Map<String, dynamic>>() ?? const <Map<String, dynamic>>[];

            return CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                      child: Text('Bookings', style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: AppColors.darkTextPrimary)),
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                    child: Column(
                      children: bookings.map((booking) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _BookingCard(
                            booking: booking,
                            selected: booking['id'] == selected['id'],
                            onTap: () => setState(() => _selectedBookingId = booking['id']?.toString()),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.darkSurface,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: _softShadow,
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              selected['service']?.toString() ?? 'Booking',
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20, color: AppColors.darkTextPrimary),
                            ),
                            const SizedBox(height: 14),
                            _MetaRow(icon: Icons.calendar_today_rounded, text: _formatDate(selected['scheduledAt']?.toString() ?? '')),
                            if ((selected['price']?.toString() ?? '').isNotEmpty)
                              _MetaRow(icon: Icons.payments_outlined, text: selected['price']!.toString()),
                            if ((selected['address']?.toString() ?? '').isNotEmpty)
                              _MetaRow(icon: Icons.location_on_outlined, text: selected['address']!.toString()),
                            const SizedBox(height: 16),
                            if (thread.isEmpty)
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: AppColors.darkBackground,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: AppColors.darkBorder),
                                ),
                                child: const Text(
                                  'No messages yet for this booking.',
                                  style: TextStyle(color: AppColors.darkTextSecondary),
                                ),
                              )
                            else
                              Column(
                                children: thread.map((message) {
                                  final own = message['own'] == true;
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 10),
                                    child: Align(
                                      alignment: own ? Alignment.centerRight : Alignment.centerLeft,
                                      child: Container(
                                        constraints: const BoxConstraints(maxWidth: 280),
                                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                        decoration: BoxDecoration(
                                          color: own ? AppColors.accent.withValues(alpha: 0.8) : AppColors.darkBackground,
                                          borderRadius: BorderRadius.circular(16),
                                          border: own ? null : Border.all(color: AppColors.darkBorder),
                                        ),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              message['sender']?.toString() ?? '',
                                              style: const TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w700,
                                                color: AppColors.darkTextSecondary,
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              message['text']?.toString() ?? '',
                                              style: TextStyle(
                                                color: own ? Colors.white : AppColors.darkTextPrimary,
                                              ),
                                            ),
                                            const SizedBox(height: 6),
                                            Text(
                                              message['time']?.toString() ?? '',
                                              style: const TextStyle(fontSize: 11, color: AppColors.darkTextSecondary),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                'Please ring on arrival',
                                'Share updated quote',
                                'I added another issue',
                              ].map((text) {
                                return ActionChip(
                                  label: Text(text),
                                  onPressed: () => _messageController.text = text,
                                  backgroundColor: AppColors.darkBackground,
                                  labelStyle: const TextStyle(
                                    color: AppColors.darkTextSecondary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  side: BorderSide(color: AppColors.darkBorder),
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 12),
                            Container(
                              decoration: BoxDecoration(
                                color: AppColors.darkBackground,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.darkBorder),
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: TextField(
                                      controller: _messageController,
                                      decoration: const InputDecoration(
                                        hintText: 'Send a quick message...',
                                        fillColor: Colors.transparent,
                                        border: InputBorder.none,
                                      ),
                                    ),
                                  ),
                                  IconButton(
                                    onPressed: () {
                                      if (_messageController.text.trim().isEmpty) return;
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Message queued in demo mode')),
                                      );
                                      _messageController.clear();
                                    },
                                    icon: const Icon(Icons.send_rounded, color: AppColors.primary),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => const SizedBox.shrink(),
        ),
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final Map<String, dynamic> booking;
  final bool selected;
  final VoidCallback onTap;

  const _BookingCard({
    required this.booking,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final meta = _bookingMeta(booking['status']?.toString() ?? 'REQUESTED');
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: Ink(
        decoration: BoxDecoration(
          color: AppColors.darkSurface,
          borderRadius: BorderRadius.circular(20),
          border: selected ? Border.all(color: AppColors.accent.withValues(alpha: 0.24)) : null,
          boxShadow: _softShadow,
        ),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: meta.background,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(Icons.handyman_rounded, color: meta.foreground),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      booking['service']?.toString() ?? 'Service',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.darkTextPrimary),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      booking['provider']?.toString() ?? 'Provider',
                      style: const TextStyle(color: AppColors.darkTextSecondary, fontSize: 13),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: meta.background,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  meta.label,
                  style: TextStyle(color: meta.foreground, fontWeight: FontWeight.w700, fontSize: 11),
                ),
              ),
            ],
          ),
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
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppColors.darkTextSecondary),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(color: AppColors.darkTextSecondary, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}

class _BookingMeta {
  final String label;
  final Color foreground;
  final Color background;

  const _BookingMeta({required this.label, required this.foreground, required this.background});
}

_BookingMeta _bookingMeta(String status) {
  switch (status) {
    case 'ACCEPTED':
      return _BookingMeta(label: 'Accepted', foreground: AppColors.info, background: AppColors.info.withValues(alpha: 0.12));
    case 'IN_PROGRESS':
      return _BookingMeta(label: 'Active', foreground: AppColors.accent, background: AppColors.accent.withValues(alpha: 0.12));
    case 'COMPLETED':
      return _BookingMeta(label: 'Done', foreground: AppColors.success, background: AppColors.success.withValues(alpha: 0.12));
    default:
      return _BookingMeta(label: 'Pending', foreground: AppColors.warning, background: AppColors.warning.withValues(alpha: 0.12));
  }
}

String _formatDate(String value) {
  try {
    final date = DateTime.parse(value);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${date.day} ${months[date.month - 1]} ${date.year}, ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  } catch (_) {
    return value;
  }
}
