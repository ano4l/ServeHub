import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/core/theme/app_theme.dart';

// ─── Mock data ───
class _MockBooking {
  final String id, service, provider, initial, status, date, time, address, price, category, imageUrl;
  final double rating, progress;
  final String? eta;

  const _MockBooking({
    required this.id, required this.service, required this.provider, required this.initial,
    required this.status, required this.date, required this.time, required this.address,
    required this.price, required this.rating, required this.progress, this.eta,
    required this.category, required this.imageUrl,
  });
}

const _mockBookings = [
  _MockBooking(id: 'BK-001', service: 'Emergency plumbing repair', provider: 'Mpho Flow Fix', initial: 'M', status: 'in_progress', date: 'Today', time: '14:00', address: '83 Rivonia Road, Sandton', price: 'R420', rating: 4.9, progress: 0.65, eta: 'Arriving in 12 min', category: 'Plumbing', imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80'),
  _MockBooking(id: 'BK-002', service: 'Move-out deep clean', provider: 'Fresh Fold Crew', initial: 'F', status: 'confirmed', date: 'Tomorrow', time: '09:00', address: '15 Tyrwhitt Avenue, Rosebank', price: 'R360', rating: 4.7, progress: 0.4, eta: 'Confirmed for 9:00 AM', category: 'Cleaning', imageUrl: 'https://images.unsplash.com/photo-1581578731548-2364de5c7b07?auto=format&fit=crop&w=400&q=80'),
  _MockBooking(id: 'BK-003', service: 'Backup power install', provider: 'Nandi Spark Works', initial: 'N', status: 'requested', date: '18 Mar', time: '10:00', address: 'The Marc, Sandton', price: 'R650', rating: 4.8, progress: 0.15, eta: 'Awaiting confirmation', category: 'Electrical', imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80'),
  _MockBooking(id: 'BK-004', service: 'Garden maintenance', provider: 'GreenThumb SA', initial: 'G', status: 'completed', date: '12 Mar', time: '08:00', address: '22 Jan Smuts Ave, Rosebank', price: 'R280', rating: 4.6, progress: 1.0, category: 'Gardening', imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=400&q=80'),
  _MockBooking(id: 'BK-005', service: 'Interior wall repaint', provider: 'ColourCraft Pro', initial: 'C', status: 'completed', date: '8 Mar', time: '07:00', address: '10 Oxford Road, Parktown', price: 'R1,200', rating: 4.9, progress: 1.0, category: 'Painting', imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80'),
  _MockBooking(id: 'BK-006', service: 'Aircon service', provider: 'CoolAir Solutions', initial: 'C', status: 'cancelled', date: '5 Mar', time: '11:00', address: 'Melrose Arch, Johannesburg', price: 'R450', rating: 4.5, progress: 0.0, category: 'HVAC', imageUrl: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=400&q=80'),
];

// ─── Status config ───
class _StatusConfig {
  final String label;
  final Color color, dot;
  const _StatusConfig({required this.label, required this.color, required this.dot});
}

_StatusConfig _statusConfig(String status) {
  switch (status) {
    case 'in_progress':
      return const _StatusConfig(label: 'In Progress', color: AppColors.info, dot: Color(0xFF3B82F6));
    case 'confirmed':
      return const _StatusConfig(label: 'Confirmed', color: AppColors.success, dot: Color(0xFF22C55E));
    case 'requested':
      return const _StatusConfig(label: 'Pending', color: AppColors.warning, dot: Color(0xFFF59E0B));
    case 'completed':
      return const _StatusConfig(label: 'Completed', color: Colors.white54, dot: Colors.white38);
    case 'cancelled':
      return const _StatusConfig(label: 'Cancelled', color: AppColors.error, dot: Color(0xFFEF4444));
    default:
      return const _StatusConfig(label: 'Unknown', color: Colors.white38, dot: Colors.white24);
  }
}

// ─── Main screen ───
class BookingsScreen extends ConsumerStatefulWidget {
  const BookingsScreen({super.key});
  @override
  ConsumerState<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends ConsumerState<BookingsScreen> {
  String? _expandedId = 'BK-001';

  List<_MockBooking> get _active => _mockBookings.where((b) => ['in_progress', 'confirmed', 'requested'].contains(b.status)).toList();
  List<_MockBooking> get _past => _mockBookings.where((b) => ['completed', 'cancelled'].contains(b.status)).toList();
  _MockBooking? get _live => _mockBookings.where((b) => b.status == 'in_progress').isEmpty ? null : _mockBookings.firstWhere((b) => b.status == 'in_progress');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // ─── Header ───
          SliverToBoxAdapter(
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('BOOKINGS', style: TextStyle(fontSize: 11, letterSpacing: 2.4, color: AppColors.accent.withValues(alpha: 0.45), fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    const Text('Your appointments', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: Colors.white, letterSpacing: -0.3)),
                    const SizedBox(height: 4),
                    Text('${_active.length} active · ${_mockBookings.length} total', style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.4))),
                  ],
                ),
              ),
            ),
          ),

          // ─── Live booking hero ───
          if (_live != null)
            SliverToBoxAdapter(child: _buildHeroCard(_live!)),

          // ─── Upcoming section ───
          if (_active.where((b) => b.status != 'in_progress').isNotEmpty) ...[
            SliverToBoxAdapter(child: _buildSectionHeader('Upcoming', Icons.calendar_today_rounded, AppColors.accent)),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate((context, i) {
                  final items = _active.where((b) => b.status != 'in_progress').toList();
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _buildBookingCard(items[i], dimmed: false),
                  );
                }, childCount: _active.where((b) => b.status != 'in_progress').length),
              ),
            ),
          ],

          // ─── Past section ───
          if (_past.isNotEmpty) ...[
            SliverToBoxAdapter(child: _buildSectionHeader('Past', Icons.access_time_rounded, Colors.white38)),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate((context, i) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _buildBookingCard(_past[i], dimmed: true),
                  );
                }, childCount: _past.length),
              ),
            ),
          ],

          // Empty state
          if (_mockBookings.isEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Column(
                  children: [
                    Icon(Icons.calendar_today_rounded, size: 40, color: Colors.white.withValues(alpha: 0.15)),
                    const SizedBox(height: 12),
                    Text('No bookings yet', style: TextStyle(fontWeight: FontWeight.w500, color: Colors.white.withValues(alpha: 0.6))),
                    const SizedBox(height: 4),
                    Text('Book a service to get started', style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.3))),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ─── Section header with divider line ───
  Widget _buildSectionHeader(String title, IconData icon, Color color) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 16),
      child: Row(
        children: [
          Container(
            width: 24, height: 24,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: color.withValues(alpha: 0.15),
            ),
            child: Icon(icon, size: 12, color: color),
          ),
          const SizedBox(width: 10),
          Text(title.toUpperCase(), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 1.0, color: color.withValues(alpha: 0.7))),
          const SizedBox(width: 12),
          Expanded(child: Container(height: 1, color: Colors.white.withValues(alpha: 0.06))),
        ],
      ),
    );
  }

  // ─── Live hero card with image banner ───
  Widget _buildHeroCard(_MockBooking booking) {
    final config = _statusConfig(booking.status);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.accent.withValues(alpha: 0.2)),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.accent.withValues(alpha: 0.08), const Color(0xFF3B82F6).withValues(alpha: 0.08)],
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image banner
            SizedBox(
              height: 96,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(booking.imageUrl, fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(color: Colors.white.withValues(alpha: 0.05)),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter, end: Alignment.bottomCenter,
                        colors: [Colors.transparent, AppColors.background.withValues(alpha: 0.6), AppColors.background],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 12, left: 16, right: 16,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(booking.service, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
                              Text(booking.provider, style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.5))),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: config.color.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(100),
                            border: Border.all(color: config.color.withValues(alpha: 0.3)),
                          ),
                          child: Text(config.label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: config.color)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Content
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Live ETA with ping dot
                  Row(
                    children: [
                      SizedBox(
                        width: 10, height: 10,
                        child: Stack(
                          children: [
                            Container(width: 10, height: 10, decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.accent.withValues(alpha: 0.3))),
                            Center(child: Container(width: 6, height: 6, decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.accent))),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(booking.eta ?? '', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.accent)),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Progress bar
                  ClipRRect(
                    borderRadius: BorderRadius.circular(3),
                    child: LinearProgressIndicator(
                      value: booking.progress,
                      backgroundColor: Colors.white.withValues(alpha: 0.08),
                      valueColor: const AlwaysStoppedAnimation(AppColors.accent),
                      minHeight: 5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      for (final label in ['Requested', 'On the way', 'Arrived', 'Done'])
                        Text(label, style: TextStyle(fontSize: 9, color: Colors.white.withValues(alpha: 0.3))),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Quick actions
                  Row(
                    children: [
                      Expanded(
                        child: SizedBox(
                          height: 40,
                          child: ElevatedButton.icon(
                            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Live tracking coming soon'), duration: Duration(seconds: 2)),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: AppColors.primary,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                            ),
                            icon: const Icon(Icons.navigation_rounded, size: 16),
                            label: const Text('Track', style: TextStyle(fontWeight: FontWeight.w600)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      _actionCircleBtn(Icons.chat_bubble_outline_rounded),
                      const SizedBox(width: 8),
                      _actionCircleBtn(Icons.phone_rounded),
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

  Widget _actionCircleBtn(IconData icon) {
    return SizedBox(
      width: 40, height: 40,
      child: OutlinedButton(
        onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Coming soon'), duration: Duration(seconds: 1)),
        ),
        style: OutlinedButton.styleFrom(
          padding: EdgeInsets.zero,
          side: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
        ),
        child: Icon(icon, size: 16, color: Colors.white.withValues(alpha: 0.7)),
      ),
    );
  }

  // ─── Booking card with photo thumbnail ───
  Widget _buildBookingCard(_MockBooking booking, {required bool dimmed}) {
    final config = _statusConfig(booking.status);
    final expanded = _expandedId == booking.id;
    final isActive = ['in_progress', 'confirmed', 'requested'].contains(booking.status);

    return GestureDetector(
      onTap: () => setState(() => _expandedId = expanded ? null : booking.id),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: expanded ? Colors.white.withValues(alpha: 0.12) : Colors.white.withValues(alpha: 0.06)),
          color: expanded ? Colors.white.withValues(alpha: 0.06) : Colors.white.withValues(alpha: 0.03),
        ),
        clipBehavior: Clip.antiAlias,
        child: Opacity(
          opacity: dimmed ? 0.75 : 1.0,
          child: Column(
            children: [
              // Main row with thumbnail
              IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Photo thumbnail
                    SizedBox(
                      width: 80,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          Image.network(
                            booking.imageUrl, fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(color: Colors.white.withValues(alpha: 0.05)),
                          ),
                          if (dimmed) Container(color: Colors.black.withValues(alpha: 0.3)),
                          // Status dot
                          Positioned(
                            top: 8, left: 8,
                            child: Container(
                              width: 10, height: 10,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: config.dot,
                                border: Border.all(color: AppColors.background, width: 2),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Content
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(booking.service, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.white)),
                                      const SizedBox(height: 2),
                                      Text(booking.provider, style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.45))),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: config.color.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(100),
                                    border: Border.all(color: config.color.withValues(alpha: 0.25)),
                                  ),
                                  child: Text(config.label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: config.color)),
                                ),
                              ],
                            ),

                            // Progress for active
                            if (isActive) ...[
                              const SizedBox(height: 10),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(2),
                                child: LinearProgressIndicator(
                                  value: booking.progress,
                                  backgroundColor: Colors.white.withValues(alpha: 0.08),
                                  valueColor: const AlwaysStoppedAnimation(Color(0xFF06B6D4)),
                                  minHeight: 3,
                                ),
                              ),
                            ],

                            // Meta row
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Icon(Icons.access_time_rounded, size: 11, color: Colors.white.withValues(alpha: 0.35)),
                                const SizedBox(width: 3),
                                Text('${booking.date} · ${booking.time}', style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.35))),
                                const SizedBox(width: 10),
                                const Icon(Icons.star_rounded, size: 11, color: AppColors.warning),
                                const SizedBox(width: 2),
                                Text('${booking.rating}', style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.35))),
                                const Spacer(),
                                Text(booking.price, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.7))),
                                const SizedBox(width: 6),
                                AnimatedRotation(
                                  turns: expanded ? 0.25 : 0,
                                  duration: const Duration(milliseconds: 200),
                                  child: Icon(Icons.chevron_right_rounded, size: 14, color: Colors.white.withValues(alpha: 0.25)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Expanded details
              if (expanded) ...[
                Container(height: 1, color: Colors.white.withValues(alpha: 0.06)),
                Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Icon(Icons.location_on_outlined, size: 14, color: AppColors.accent.withValues(alpha: 0.7)),
                          const SizedBox(width: 8),
                          Expanded(child: Text(booking.address, style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.55)))),
                        ],
                      ),
                      if (booking.eta != null) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(Icons.navigation_rounded, size: 14, color: AppColors.accent.withValues(alpha: 0.7)),
                            const SizedBox(width: 8),
                            Text(booking.eta!, style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.55))),
                          ],
                        ),
                      ],
                      const SizedBox(height: 14),
                      if (booking.status == 'completed')
                        Row(
                          children: [
                            Expanded(
                              child: _cardActionBtn(Icons.refresh_rounded, 'Rebook', () => context.push('/services')),
                            ),
                            const SizedBox(width: 8),
                            SizedBox(
                              width: 36, height: 36,
                              child: OutlinedButton(
                                onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Reviews coming soon'), duration: Duration(seconds: 1)),
                                ),
                                style: OutlinedButton.styleFrom(
                                  padding: EdgeInsets.zero,
                                  side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                                ),
                                child: Icon(Icons.star_outline_rounded, size: 14, color: AppColors.warning.withValues(alpha: 0.7)),
                              ),
                            ),
                          ],
                        )
                      else if (booking.status == 'cancelled')
                        _cardActionBtn(Icons.refresh_rounded, 'Book again', () => context.push('/services'))
                      else if (isActive)
                        Row(
                          children: [
                            Expanded(child: _cardActionBtn(null, 'View details', () => ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Booking detail view coming soon'), duration: Duration(seconds: 1)),
                            ))),
                            const SizedBox(width: 8),
                            SizedBox(
                              width: 36, height: 36,
                              child: OutlinedButton(
                                onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Chat coming soon'), duration: Duration(seconds: 1)),
                                ),
                                style: OutlinedButton.styleFrom(
                                  padding: EdgeInsets.zero,
                                  side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                                ),
                                child: Icon(Icons.chat_bubble_outline_rounded, size: 14, color: Colors.white.withValues(alpha: 0.5)),
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _cardActionBtn(IconData? icon, String label, VoidCallback onTap) {
    return SizedBox(
      height: 36,
      child: TextButton(
        onPressed: onTap,
        style: TextButton.styleFrom(
          backgroundColor: Colors.white.withValues(alpha: 0.08),
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 12),
              const SizedBox(width: 6),
            ],
            Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}
