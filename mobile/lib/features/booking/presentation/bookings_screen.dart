import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/core/theme/app_theme.dart';

// Mock booking data matching web
class _MockBooking {
  final String id;
  final String service;
  final String provider;
  final String initial;
  final String status;
  final String date;
  final String time;
  final String address;
  final String price;
  final double rating;
  final double progress;
  final String? eta;
  final String category;

  const _MockBooking({
    required this.id,
    required this.service,
    required this.provider,
    required this.initial,
    required this.status,
    required this.date,
    required this.time,
    required this.address,
    required this.price,
    required this.rating,
    required this.progress,
    this.eta,
    required this.category,
  });
}

const _mockBookings = [
  _MockBooking(id: 'BK-001', service: 'Emergency plumbing repair', provider: 'Mpho Flow Fix', initial: 'M', status: 'in_progress', date: 'Today', time: '14:00', address: '83 Rivonia Road, Sandton', price: 'R420', rating: 4.9, progress: 0.65, eta: 'Arriving in 12 min', category: 'Plumbing'),
  _MockBooking(id: 'BK-002', service: 'Move-out deep clean', provider: 'Fresh Fold Crew', initial: 'F', status: 'confirmed', date: 'Tomorrow', time: '09:00', address: '15 Tyrwhitt Avenue, Rosebank', price: 'R360', rating: 4.7, progress: 0.4, eta: 'Confirmed for 9:00 AM', category: 'Cleaning'),
  _MockBooking(id: 'BK-003', service: 'Backup power install', provider: 'Nandi Spark Works', initial: 'N', status: 'requested', date: '18 Mar', time: '10:00', address: 'The Marc, Sandton', price: 'R650', rating: 4.8, progress: 0.15, eta: 'Awaiting confirmation', category: 'Electrical'),
  _MockBooking(id: 'BK-004', service: 'Garden maintenance', provider: 'GreenThumb SA', initial: 'G', status: 'completed', date: '12 Mar', time: '08:00', address: '22 Jan Smuts Ave, Rosebank', price: 'R280', rating: 4.6, progress: 1.0, category: 'Gardening'),
  _MockBooking(id: 'BK-005', service: 'Interior wall repaint', provider: 'ColourCraft Pro', initial: 'C', status: 'completed', date: '8 Mar', time: '07:00', address: '10 Oxford Road, Parktown', price: 'R1,200', rating: 4.9, progress: 1.0, category: 'Painting'),
  _MockBooking(id: 'BK-006', service: 'Aircon service', provider: 'CoolAir Solutions', initial: 'C', status: 'cancelled', date: '5 Mar', time: '11:00', address: 'Melrose Arch, Johannesburg', price: 'R450', rating: 4.5, progress: 0.0, category: 'HVAC'),
];

const _filters = ['All', 'Active', 'Upcoming', 'Pending', 'Past', 'Cancelled'];

class _StatusConfig {
  final String label;
  final Color color;
  final List<Color> gradient;
  const _StatusConfig({required this.label, required this.color, required this.gradient});
}

_StatusConfig _statusConfig(String status) {
  switch (status) {
    case 'in_progress':
      return _StatusConfig(label: 'In Progress', color: AppColors.info, gradient: [const Color(0xFF3B82F6), const Color(0xFF06B6D4)]);
    case 'confirmed':
      return _StatusConfig(label: 'Confirmed', color: AppColors.success, gradient: [const Color(0xFF22C55E), const Color(0xFF10B981)]);
    case 'requested':
      return _StatusConfig(label: 'Requested', color: AppColors.warning, gradient: [const Color(0xFFF59E0B), const Color(0xFFF97316)]);
    case 'completed':
      return const _StatusConfig(label: 'Completed', color: Colors.white54, gradient: [Color(0xFF6B7280), Color(0xFF4B5563)]);
    case 'cancelled':
      return _StatusConfig(label: 'Cancelled', color: AppColors.error, gradient: [const Color(0xFFEF4444), const Color(0xFFF43F5E)]);
    default:
      return const _StatusConfig(label: 'Unknown', color: Colors.white38, gradient: [Color(0xFF6B7280), Color(0xFF4B5563)]);
  }
}

class BookingsScreen extends ConsumerStatefulWidget {
  const BookingsScreen({super.key});

  @override
  ConsumerState<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends ConsumerState<BookingsScreen> {
  int _filterIndex = 0;
  String? _expandedId = 'BK-001';

  List<_MockBooking> get _filteredBookings {
    switch (_filterIndex) {
      case 1: return _mockBookings.where((b) => b.status == 'in_progress').toList();
      case 2: return _mockBookings.where((b) => b.status == 'confirmed').toList();
      case 3: return _mockBookings.where((b) => b.status == 'requested').toList();
      case 4: return _mockBookings.where((b) => b.status == 'completed').toList();
      case 5: return _mockBookings.where((b) => b.status == 'cancelled').toList();
      default: return _mockBookings.toList();
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeCount = _mockBookings.where((b) => ['in_progress', 'confirmed', 'requested'].contains(b.status)).length;
    final filtered = _filteredBookings;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // Header
          SliverToBoxAdapter(
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('BOOKINGS', style: TextStyle(fontSize: 11, letterSpacing: 2.4, color: AppColors.accent.withValues(alpha: 0.55), fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    const Text('Your appointments', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: Colors.white, letterSpacing: -0.5)),
                    const SizedBox(height: 4),
                    Text('$activeCount active · ${_mockBookings.length} total', style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.5))),
                  ],
                ),
              ),
            ),
          ),

          // Filters
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 0, 0),
              child: SizedBox(
                height: 40,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.only(right: 20),
                  itemCount: _filters.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final active = _filterIndex == index;
                    return GestureDetector(
                      onTap: () => setState(() => _filterIndex = index),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: active ? Colors.white : Colors.white.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(100),
                          border: active ? null : Border.all(color: AppColors.border),
                        ),
                        child: Text(
                          _filters[index],
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: active ? AppColors.primary : Colors.white.withValues(alpha: 0.7),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ),

          // Active booking hero card
          if (_filterIndex == 0)
            ..._mockBookings.where((b) => b.status == 'in_progress').map((booking) {
              final config = _statusConfig(booking.status);
              return SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppColors.accent.withValues(alpha: 0.2)),
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [AppColors.accent.withValues(alpha: 0.1), const Color(0xFF3B82F6).withValues(alpha: 0.1)],
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 48, height: 48,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(24),
                                gradient: LinearGradient(colors: config.gradient),
                              ),
                              alignment: Alignment.center,
                              child: Text(booking.initial, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(booking.service, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white)),
                                  const SizedBox(height: 2),
                                  Text(booking.provider, style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.6))),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Icon(Icons.navigation_rounded, size: 16, color: AppColors.accent),
                            const SizedBox(width: 8),
                            Text(booking.eta ?? '', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.accent)),
                          ],
                        ),
                        const SizedBox(height: 12),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: booking.progress,
                            backgroundColor: Colors.white.withValues(alpha: 0.1),
                            valueColor: AlwaysStoppedAnimation(AppColors.accent),
                            minHeight: 6,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () {},
                                icon: const Icon(Icons.navigation_rounded, size: 16),
                                label: const Text('Track'),
                              ),
                            ),
                            const SizedBox(width: 8),
                            OutlinedButton.icon(
                              onPressed: () {},
                              icon: const Icon(Icons.chat_bubble_outline_rounded, size: 16),
                              label: const Text('Chat'),
                            ),
                            const SizedBox(width: 8),
                            OutlinedButton(
                              onPressed: () {},
                              child: const Icon(Icons.phone_rounded, size: 16),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),

          // Booking list
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
            sliver: filtered.isEmpty
                ? SliverToBoxAdapter(
                    child: Container(
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: AppColors.border, style: BorderStyle.solid),
                        color: Colors.white.withValues(alpha: 0.05),
                      ),
                      child: Column(
                        children: [
                          Icon(Icons.calendar_today_rounded, size: 40, color: Colors.white.withValues(alpha: 0.2)),
                          const SizedBox(height: 12),
                          Text('No bookings found', style: TextStyle(fontWeight: FontWeight.w500, color: Colors.white.withValues(alpha: 0.7))),
                          const SizedBox(height: 4),
                          Text('Try a different filter or book a new service.', style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.4))),
                        ],
                      ),
                    ),
                  )
                : SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final booking = filtered[index];
                        // Skip hero card in 'all' filter
                        if (_filterIndex == 0 && booking.status == 'in_progress') return const SizedBox.shrink();
                        final config = _statusConfig(booking.status);
                        final expanded = _expandedId == booking.id;
                        final isActive = ['in_progress', 'confirmed', 'requested'].contains(booking.status);

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: GestureDetector(
                            onTap: () => setState(() => _expandedId = expanded ? null : booking.id),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: expanded ? Colors.white.withValues(alpha: 0.15) : AppColors.border),
                                color: expanded ? Colors.white.withValues(alpha: 0.08) : Colors.white.withValues(alpha: 0.04),
                              ),
                              child: Column(
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        width: 44, height: 44,
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(22),
                                          gradient: LinearGradient(colors: config.gradient),
                                        ),
                                        alignment: Alignment.center,
                                        child: Text(booking.initial, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(booking.service, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w500, color: Colors.white)),
                                            const SizedBox(height: 2),
                                            Text(booking.provider, style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.55))),
                                          ],
                                        ),
                                      ),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: config.color.withValues(alpha: 0.15),
                                              borderRadius: BorderRadius.circular(100),
                                            ),
                                            child: Text(config.label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: config.color)),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(booking.price, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.white.withValues(alpha: 0.8))),
                                        ],
                                      ),
                                    ],
                                  ),
                                  if (isActive) ...[
                                    const SizedBox(height: 12),
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(3),
                                      child: LinearProgressIndicator(
                                        value: booking.progress,
                                        backgroundColor: Colors.white.withValues(alpha: 0.1),
                                        valueColor: AlwaysStoppedAnimation(config.gradient.first),
                                        minHeight: 4,
                                      ),
                                    ),
                                  ],
                                  const SizedBox(height: 10),
                                  Row(
                                    children: [
                                      Icon(Icons.access_time_rounded, size: 12, color: Colors.white.withValues(alpha: 0.45)),
                                      const SizedBox(width: 4),
                                      Text('${booking.date} · ${booking.time}', style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.45))),
                                      const Spacer(),
                                      Icon(Icons.star_rounded, size: 12, color: AppColors.warning),
                                      const SizedBox(width: 2),
                                      Text('${booking.rating}', style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.45))),
                                      const SizedBox(width: 8),
                                      AnimatedRotation(
                                        turns: expanded ? 0.25 : 0,
                                        duration: const Duration(milliseconds: 200),
                                        child: Icon(Icons.chevron_right_rounded, size: 16, color: Colors.white.withValues(alpha: 0.45)),
                                      ),
                                    ],
                                  ),
                                  if (expanded) ...[
                                    const Divider(height: 24),
                                    Row(
                                      children: [
                                        Icon(Icons.location_on_outlined, size: 16, color: AppColors.accent),
                                        const SizedBox(width: 8),
                                        Expanded(child: Text(booking.address, style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.7)))),
                                      ],
                                    ),
                                    if (booking.eta != null) ...[
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          Icon(Icons.navigation_rounded, size: 16, color: AppColors.accent),
                                          const SizedBox(width: 8),
                                          Text(booking.eta!, style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.7))),
                                        ],
                                      ),
                                    ],
                                    const SizedBox(height: 12),
                                    if (booking.status == 'completed')
                                      Row(
                                        children: [
                                          Expanded(
                                            child: OutlinedButton.icon(
                                              onPressed: () {},
                                              icon: const Icon(Icons.refresh_rounded, size: 14),
                                              label: const Text('Rebook'),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          OutlinedButton(onPressed: () {}, child: const Icon(Icons.star_outline_rounded, size: 16)),
                                        ],
                                      )
                                    else if (isActive)
                                      Row(
                                        children: [
                                          Expanded(
                                            child: OutlinedButton(
                                              onPressed: () {},
                                              child: const Text('View details'),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          OutlinedButton(onPressed: () {}, child: const Icon(Icons.chat_bubble_outline_rounded, size: 16)),
                                        ],
                                      ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                      childCount: filtered.length,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
