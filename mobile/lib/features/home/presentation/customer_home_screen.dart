import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/core/widgets/animations.dart';
import 'package:serveify/core/widgets/skeleton.dart';
import 'package:serveify/features/browse/data/categories_provider.dart';

final _recentBookingsProvider = FutureProvider<List<dynamic>>((ref) async {
  // Demo mode - return rich dummy data
  return [
    {
      'id': '1',
      'serviceName': 'Home Cleaning Service',
      'providerName': 'Sarah Johnson',
      'status': 'IN_PROGRESS',
      'scheduledAt': DateTime.now().add(const Duration(hours: 2)).toIso8601String(),
      'price': 450.00,
      'durationMinutes': 120,
      'categoryName': 'Cleaning',
      'providerAvatar': 'SJ',
      'rating': 4.8,
      'reviews': 127
    },
    {
      'id': '2', 
      'serviceName': 'AC Repair & Maintenance',
      'providerName': 'Mike Chen HVAC',
      'status': 'ACCEPTED',
      'scheduledAt': DateTime.now().add(const Duration(days: 1)).toIso8601String(),
      'price': 850.00,
      'durationMinutes': 90,
      'categoryName': 'HVAC',
      'providerAvatar': 'MC',
      'rating': 4.9,
      'reviews': 203
    },
    {
      'id': '3',
      'serviceName': 'Garden Landscaping',
      'providerName': 'GreenThumb Gardens',
      'status': 'COMPLETED',
      'scheduledAt': DateTime.now().subtract(const Duration(days: 3)).toIso8601String(),
      'price': 1200.00,
      'durationMinutes': 240,
      'categoryName': 'Gardening',
      'providerAvatar': 'GG',
      'rating': 4.7,
      'reviews': 89
    }
  ];
});

final _featuredProvidersProvider = FutureProvider<List<dynamic>>((ref) async {
  // Demo mode - return rich dummy data
  return [
    {
      'id': '1',
      'fullName': 'Sarah Johnson',
      'userName': 'sarahj_clean',
      'businessName': 'Sparkle Clean Pro',
      'categoryName': 'Cleaning',
      'rating': 4.9,
      'reviews': 342,
      'verified': true,
      'completedJobs': 528,
      'responseTime': '15 min',
      'hourlyRate': 180.00,
      'avatar': 'SJ'
    },
    {
      'id': '2',
      'fullName': 'Mike Chen',
      'userName': 'mikechen_hvac',
      'businessName': 'Chen HVAC Solutions',
      'categoryName': 'HVAC',
      'rating': 4.8,
      'reviews': 287,
      'verified': true,
      'completedJobs': 412,
      'responseTime': '30 min',
      'hourlyRate': 250.00,
      'avatar': 'MC'
    },
    {
      'id': '3',
      'fullName': 'David Williams',
      'userName': 'david_plumb',
      'businessName': 'Williams Plumbing',
      'categoryName': 'Plumbing',
      'rating': 4.7,
      'reviews': 198,
      'verified': true,
      'completedJobs': 324,
      'responseTime': '20 min',
      'hourlyRate': 220.00,
      'avatar': 'DW'
    },
    {
      'id': '4',
      'fullName': 'Emma Rodriguez',
      'userName': 'emma_electric',
      'businessName': 'Rodrigez Electric',
      'categoryName': 'Electrical',
      'rating': 5.0,
      'reviews': 156,
      'verified': true,
      'completedJobs': 234,
      'responseTime': '10 min',
      'hourlyRate': 280.00,
      'avatar': 'ER'
    },
    {
      'id': '5',
      'fullName': 'James Taylor',
      'userName': 'james_paint',
      'businessName': 'Taylor Painting Co',
      'categoryName': 'Painting',
      'rating': 4.6,
      'reviews': 89,
      'verified': false,
      'completedJobs': 145,
      'responseTime': '45 min',
      'hourlyRate': 160.00,
      'avatar': 'JT'
    },
    {
      'id': '6',
      'fullName': 'Lisa Green',
      'userName': 'lisa_garden',
      'businessName': 'GreenScapes',
      'categoryName': 'Gardening',
      'rating': 4.8,
      'reviews': 124,
      'verified': true,
      'completedJobs': 198,
      'responseTime': '25 min',
      'hourlyRate': 150.00,
      'avatar': 'LG'
    }
  ];
});

IconData _categoryIcon(String slug) {
  return switch (slug) {
    'plumbing' => Icons.water_drop_outlined,
    'electrical' => Icons.bolt_outlined,
    'cleaning' => Icons.cleaning_services_outlined,
    'gardening' => Icons.yard_outlined,
    'painting' => Icons.format_paint_outlined,
    'carpentry' => Icons.handyman_outlined,
    'hvac' => Icons.ac_unit_outlined,
    'security' => Icons.security_outlined,
    'moving' => Icons.local_shipping_outlined,
    'appliances' => Icons.settings_outlined,
    _ => Icons.miscellaneous_services_outlined,
  };
}

Color _categoryColor(int index) {
  const colors = [
    AppColors.pastelBlue,
    AppColors.pastelGreen,
    AppColors.pastelYellow,
    AppColors.pastelPink,
    AppColors.pastelPurple,
    AppColors.pastelMint,
    AppColors.pastelOrange,
    AppColors.pastelCyan,
  ];
  return colors[index % colors.length];
}

class CustomerHomeScreen extends ConsumerStatefulWidget {
  const CustomerHomeScreen({super.key});

  @override
  ConsumerState<CustomerHomeScreen> createState() => _CustomerHomeScreenState();
}

class _CustomerHomeScreenState extends ConsumerState<CustomerHomeScreen> {
  bool _isDemoMode = true;

  @override
  Widget build(BuildContext context) {
    final bookings = ref.watch(_recentBookingsProvider);
    final providers = ref.watch(_featuredProvidersProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.accent,
        onRefresh: () async {
          ref.invalidate(_recentBookingsProvider);
          ref.invalidate(_featuredProvidersProvider);
          ref.invalidate(categoriesProvider);
        },
        child: CustomScrollView(
          slivers: [
            // Custom app bar area
            SliverToBoxAdapter(
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top bar: greeting + notification + demo toggle
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Good morning,',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: AppColors.textSecondary,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Alex Thompson',
                                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                    height: 1.15,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          // Demo mode toggle
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.05),
                                  blurRadius: 10,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: _isDemoMode ? AppColors.primary : Colors.transparent,
                                    borderRadius: const BorderRadius.only(
                                      topLeft: Radius.circular(20),
                                      bottomLeft: Radius.circular(20),
                                    ),
                                  ),
                                  child: Text(
                                    'Demo',
                                    style: TextStyle(
                                      color: _isDemoMode ? Colors.white : AppColors.textSecondary,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                GestureDetector(
                                  onTap: () => setState(() => _isDemoMode = !_isDemoMode),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: !_isDemoMode ? AppColors.primary : Colors.transparent,
                                      borderRadius: const BorderRadius.only(
                                        topRight: Radius.circular(20),
                                        bottomRight: Radius.circular(20),
                                      ),
                                    ),
                                    child: Text(
                                      'Live',
                                      style: TextStyle(
                                        color: !_isDemoMode ? Colors.white : AppColors.textSecondary,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          // Notification bell
                          Pressable(
                            onTap: () => context.push('/notifications'),
                            child: Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.05),
                                    blurRadius: 10,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Stack(
                                children: [
                                  const Center(
                                    child: Icon(Icons.notifications_outlined, color: AppColors.textPrimary, size: 22),
                                  ),
                                  Positioned(
                                    top: 8,
                                    right: 8,
                                    child: Container(
                                      width: 8,
                                      height: 8,
                                      decoration: BoxDecoration(
                                        color: AppColors.error,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      // Search bar
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.05),
                              blurRadius: 10,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: TextField(
                          style: const TextStyle(fontSize: 15),
                          decoration: InputDecoration(
                            hintText: 'Search for services...',
                            prefixIcon: const Icon(Icons.search_rounded, size: 22),
                            suffixIcon: Container(
                              margin: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.tune_rounded, color: Colors.white, size: 18),
                            ),
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
                          ),
                          GestureDetector(
                            onTap: () => context.go('/notifications'),
                            child: Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Stack(
                                children: [
                                  const Center(child: Icon(Icons.notifications_outlined, size: 22, color: AppColors.textPrimary)),
                                  Positioned(
                                    right: 10, top: 10,
                                    child: Container(
                                      width: 8, height: 8,
                                      decoration: const BoxDecoration(color: AppColors.error, shape: BoxShape.circle),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Search bar
                      GestureDetector(
                        onTap: () => context.go('/browse'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.search_rounded, color: AppColors.textMuted, size: 22),
                              const SizedBox(width: 12),
                              Text(
                                'Search for services...',
                                style: TextStyle(color: AppColors.textMuted, fontSize: 15),
                              ),
                              const Spacer(),
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: AppColors.primary,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(Icons.tune_rounded, color: Colors.white, size: 16),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Categories grid
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Services', style: Theme.of(context).textTheme.titleLarge),
                        GestureDetector(
                          onTap: () => context.go('/browse'),
                          child: Text('See all', style: TextStyle(color: AppColors.accent, fontSize: 14, fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    ref.watch(categoriesProvider).when(
                      data: (cats) => GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 4,
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          childAspectRatio: 0.82,
                        ),
                        itemCount: cats.length > 8 ? 8 : cats.length,
                        itemBuilder: (_, i) {
                          final cat = cats[i];
                          return _CategoryCard(
                            icon: _categoryIcon(cat.slug),
                            label: cat.name,
                            color: _categoryColor(i),
                            onTap: () => context.go('/browse'),
                          );
                        },
                      ),
                      loading: () => const HomeSkeleton(),
                      error: (_, __) => const SizedBox.shrink(),
                    ),
                  ],
                ),
              ),
            ),

            // Quick action banner
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: GestureDetector(
                  onTap: () => context.go('/browse'),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1A1A2E), Color(0xFF2D2B55)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Need it done\ntoday?',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 20,
                                  fontWeight: FontWeight.w700,
                                  height: 1.2,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Book a pro in minutes',
                                style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 13),
                              ),
                              const SizedBox(height: 14),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                decoration: BoxDecoration(
                                  color: AppColors.accent,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Text(
                                  'Book Now',
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(Icons.handyman_rounded, color: Colors.white, size: 36),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Featured providers
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Top Rated', style: Theme.of(context).textTheme.titleLarge),
                    GestureDetector(
                      onTap: () => context.go('/browse'),
                      child: Text('See all', style: TextStyle(color: AppColors.accent, fontSize: 14, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 180,
                child: providers.when(
                  data: (list) => ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.fromLTRB(20, 14, 8, 8),
                    itemCount: list.length,
                    itemBuilder: (_, i) => FadeIn(
                      delay: Duration(milliseconds: i * 50),
                      child: _ProviderCard(provider: list[i]),
                    ),
                  ),
                  loading: () => const SizedBox(
                    height: 180,
                    child: HomeSkeleton(),
                  ),
                  error: (_, __) => const SizedBox.shrink(),
                ),
              ),
            ),

            // Active bookings
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Your Bookings', style: Theme.of(context).textTheme.titleLarge),
                    GestureDetector(
                      onTap: () => context.go('/bookings'),
                      child: Text('View all', style: TextStyle(color: AppColors.accent, fontSize: 14, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
                child: bookings.when(
                  data: (list) => list.isEmpty
                      ? _EmptyBookings(onBrowse: () => context.go('/browse'))
                      : Column(
                          children: list.take(3).map((b) => FadeIn(
                            delay: Duration(milliseconds: list.indexOf(b) * 80),
                            child: Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _BookingTile(booking: b),
                            ),
                          )).toList(),
                        ),
                  loading: () => const Padding(
                    padding: EdgeInsets.all(32),
                    child: HomeSkeleton(),
                  ),
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

// --- Category Card (pastel rounded) ---
class _CategoryCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _CategoryCard({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Icon(icon, color: AppColors.textPrimary.withValues(alpha: 0.7), size: 26),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: AppColors.textPrimary),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

// --- Featured Provider Card ---
class _ProviderCard extends StatelessWidget {
  final dynamic provider;
  const _ProviderCard({required this.provider});

  @override
  Widget build(BuildContext context) {
    final name = provider['fullName']?.toString() ?? provider['userName']?.toString() ?? 'Provider';
    final city = provider['city']?.toString() ?? '';
    final rating = provider['averageRating'];
    final ratingStr = rating != null ? double.tryParse(rating.toString())?.toStringAsFixed(1) ?? '' : '';
    final id = provider['id'];

    return Pressable(
      onTap: () { if (id != null) context.push('/providers/$id'); },
      child: Container(
        width: 150,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Avatar
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.accentLight,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Center(
                child: Text(
                  name.isNotEmpty ? name[0].toUpperCase() : '?',
                  style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.w700, fontSize: 18),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              name,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            if (city.isNotEmpty)
              Text(
                city,
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                maxLines: 1,
              ),
            const Spacer(),
            if (ratingStr.isNotEmpty)
              Row(
                children: [
                  const Icon(Icons.star_rounded, color: Color(0xFFFFB800), size: 16),
                  const SizedBox(width: 3),
                  Text(ratingStr, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

// --- Booking Tile ---
class _BookingTile extends StatelessWidget {
  final dynamic booking;
  const _BookingTile({required this.booking});

  @override
  Widget build(BuildContext context) {
    final status = booking['status']?.toString() ?? 'UNKNOWN';
    final service = booking['serviceName']?.toString() ?? 'Service';
    final provider = booking['providerName']?.toString() ?? 'Provider';
    final (statusColor, statusLabel) = _statusInfo(status);

    return Pressable(
      onTap: () {},
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
          Container(
            width: 48,
            height: 48,
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
                const SizedBox(height: 3),
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
            child: Text(
              statusLabel,
              style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    ),
  );
  }

  (Color, String) _statusInfo(String status) {
    return switch (status) {
      'REQUESTED' => (AppColors.warning, 'Pending'),
      'ACCEPTED' => (AppColors.info, 'Accepted'),
      'IN_PROGRESS' => (AppColors.accent, 'Active'),
      'COMPLETED' || 'REVIEWABLE' => (AppColors.success, 'Done'),
      'CANCELLED' || 'DECLINED' => (AppColors.error, 'Cancelled'),
      _ => (AppColors.textMuted, status),
    };
  }
}

// --- Empty bookings ---
class _EmptyBookings extends StatelessWidget {
  final VoidCallback onBrowse;
  const _EmptyBookings({required this.onBrowse});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppColors.surfaceAlt,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(Icons.calendar_today_outlined, color: AppColors.textMuted, size: 28),
          ),
          const SizedBox(height: 16),
          const Text('No bookings yet', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
          const SizedBox(height: 4),
          const Text('Find a service to get started', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
          const SizedBox(height: 18),
          GestureDetector(
            onTap: onBrowse,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.accent,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Text('Browse Services', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
            ),
          ),
        ],
      ),
    );
  }
}
