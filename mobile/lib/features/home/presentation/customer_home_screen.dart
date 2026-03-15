import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/core/demo/customer_demo_data.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/core/widgets/skeleton.dart';
import 'package:serveify/features/auth/providers/auth_provider.dart';
import 'package:serveify/features/browse/data/categories_provider.dart';

final _homeBookingsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  try {
    final response = await dio.get('/bookings', queryParameters: {'size': 8, 'sort': 'createdAt,desc'});
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

final _featuredProvidersProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  try {
    final response = await dio.get('/providers', queryParameters: {'size': 8});
    final raw = response.data is List
        ? response.data as List
        : (response.data is Map && response.data['content'] is List ? response.data['content'] as List : <dynamic>[]);
    if (raw.isEmpty) return CustomerDemoData.providers();
    return raw.map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      return {
        'id': map['id']?.toString() ?? '',
        'name': map['fullName']?.toString() ?? map['businessName']?.toString() ?? 'Provider',
        'category': map['categoryName']?.toString() ?? 'Service',
        'city': map['city']?.toString() ?? '',
        'rating': (map['averageRating'] as num?)?.toDouble() ?? 4.8,
        'reviews': map['reviewCount'] ?? 120,
        'badge': map['verified'] == true ? 'Verified' : null,
        'responseTime': map['responseTime']?.toString() ?? '30 min',
        'verified': map['verified'] == true,
        'bio': map['bio']?.toString() ?? '',
      };
    }).toList();
  } catch (_) {
    return CustomerDemoData.providers();
  }
});

class CustomerHomeScreen extends ConsumerWidget {
  const CustomerHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final categories = ref.watch(categoriesProvider);
    final bookings = ref.watch(_homeBookingsProvider);
    final providers = ref.watch(_featuredProvidersProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.accent,
        onRefresh: () async {
          ref.invalidate(categoriesProvider);
          ref.invalidate(_homeBookingsProvider);
          ref.invalidate(_featuredProvidersProvider);
        },
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Good morning,',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.w500,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  auth.email?.split('@').first.replaceAll('.', ' ').split(' ').map(_capitalise).join(' ') ?? 'Alex Thompson',
                                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(height: 1.1),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(999),
                              boxShadow: _softShadow,
                            ),
                            child: const Text(
                              'Live Demo',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                            ),
                          ),
                          const SizedBox(width: 12),
                          InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () => context.go('/notifications'),
                            child: Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: _softShadow,
                              ),
                              child: Stack(
                                children: [
                                  const Center(child: Icon(Icons.notifications_outlined, color: AppColors.textPrimary)),
                                  Positioned(
                                    top: 10,
                                    right: 10,
                                    child: Container(
                                      width: 8,
                                      height: 8,
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
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: _softShadow,
                        ),
                        child: TextField(
                          readOnly: true,
                          onTap: () => context.go('/browse'),
                          decoration: InputDecoration(
                            hintText: 'Enter your address or search services...',
                            prefixIcon: const Icon(Icons.search_rounded),
                            suffixIcon: Container(
                              margin: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.tune_rounded, size: 18, color: Colors.white),
                            ),
                            fillColor: Colors.transparent,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
                child: _SectionHeader(
                  title: 'Services',
                  action: 'See all',
                  onTap: () => context.go('/browse'),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: categories.when(
                  data: (items) {
                    final displayed = items.take(8).toList();
                    return GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 4,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 0.82,
                      ),
                      itemCount: displayed.length,
                      itemBuilder: (context, index) {
                        final item = displayed[index];
                        return _CategoryCard(
                          label: item.name,
                          color: CustomerDemoData.categoryColors[index % CustomerDemoData.categoryColors.length],
                          icon: _categoryIcon(item.slug),
                          onTap: () => context.go('/browse'),
                        );
                      },
                    );
                  },
                  loading: () => const HomeSkeleton(),
                  error: (_, __) => GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 4,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 0.82,
                    ),
                    itemCount: 8,
                    itemBuilder: (context, index) {
                      final fallback = const ['Cleaning', 'Hair', 'Dog Wash', 'Makeup', 'Pool', 'Walks', 'HVAC', 'Moving'][index];
                      return _CategoryCard(
                        label: fallback,
                        color: CustomerDemoData.categoryColors[index % CustomerDemoData.categoryColors.length],
                        icon: _categoryIcon(fallback.toLowerCase()),
                        onTap: () => context.go('/browse'),
                      );
                    },
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: InkWell(
                  borderRadius: BorderRadius.circular(24),
                  onTap: () => context.go('/browse'),
                  child: Ink(
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1A1A2E), Color(0xFF2D2B55)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(20),
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
                                    fontWeight: FontWeight.w800,
                                    fontSize: 28,
                                    height: 1.1,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  'Book a pro in minutes with real-time updates and messaging.',
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.72),
                                    fontSize: 13,
                                    height: 1.4,
                                  ),
                                ),
                                const SizedBox(height: 16),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: AppColors.accent,
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: const Text(
                                    'Book Now',
                                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            width: 76,
                            height: 76,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(22),
                            ),
                            child: const Icon(Icons.handyman_rounded, color: Colors.white, size: 38),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
                child: _SectionHeader(
                  title: 'Recommended pros',
                  action: 'See all',
                  onTap: () => context.go('/browse'),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 182,
                child: providers.when(
                  data: (items) => ListView.builder(
                    padding: const EdgeInsets.fromLTRB(20, 14, 8, 0),
                    scrollDirection: Axis.horizontal,
                    itemCount: items.length,
                    itemBuilder: (context, index) => _ProviderCard(provider: items[index]),
                  ),
                  loading: () => const HomeSkeleton(),
                  error: (_, __) => const SizedBox.shrink(),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: _SectionHeader(
                  title: 'Current bookings',
                  action: 'View all',
                  onTap: () => context.go('/bookings'),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
                child: bookings.when(
                  data: (items) {
                    final active = items.where((item) => ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'].contains(item['status'])).toList();
                    final completed = items.where((item) => item['status'] == 'COMPLETED').take(1).toList();
                    final display = [...active.take(2), ...completed];
                    return Column(
                      children: display.map((item) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _BookingTile(
                            booking: item,
                            onTap: () => context.go('/bookings'),
                          ),
                        );
                      }).toList(),
                    );
                  },
                  loading: () => const HomeSkeleton(),
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

class _SectionHeader extends StatelessWidget {
  final String title;
  final String action;
  final VoidCallback onTap;

  const _SectionHeader({required this.title, required this.action, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleLarge),
        GestureDetector(
          onTap: onTap,
          child: Text(
            action,
            style: const TextStyle(color: AppColors.accent, fontSize: 14, fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }
}

class _CategoryCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _CategoryCard({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(18),
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
            child: Icon(icon, color: AppColors.textPrimary.withValues(alpha: 0.72), size: 26),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _ProviderCard extends StatelessWidget {
  final Map<String, dynamic> provider;

  const _ProviderCard({required this.provider});

  @override
  Widget build(BuildContext context) {
    final name = provider['name']?.toString() ?? 'Provider';
    final city = provider['city']?.toString() ?? '';
    final rating = (provider['rating'] as num?)?.toDouble() ?? 4.8;
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => context.go('/browse'),
        child: Ink(
          width: 150,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(20),
            boxShadow: _softShadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.accentLight,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(
                  child: Text(
                    _initials(name),
                    style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.w800, fontSize: 16),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
              ),
              const SizedBox(height: 2),
              Text(
                city,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
              ),
              const Spacer(),
              Row(
                children: [
                  const Icon(Icons.star_rounded, color: Color(0xFFFFB800), size: 16),
                  const SizedBox(width: 4),
                  Text(rating.toStringAsFixed(1), style: const TextStyle(fontWeight: FontWeight.w700)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BookingTile extends StatelessWidget {
  final Map<String, dynamic> booking;
  final VoidCallback onTap;

  const _BookingTile({required this.booking, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final meta = _bookingMeta(booking['status']?.toString() ?? 'REQUESTED');
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: Ink(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          boxShadow: _softShadow,
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
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
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    booking['provider']?.toString() ?? 'Provider',
                    style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
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

IconData _categoryIcon(String slug) {
  switch (slug.toLowerCase()) {
    case 'cleaning':
      return Icons.cleaning_services_rounded;
    case 'hair':
      return Icons.cut_rounded;
    case 'makeup':
      return Icons.auto_awesome_rounded;
    case 'dog washing':
    case 'dog wash':
      return Icons.pets_rounded;
    case 'dog walking':
    case 'walks':
      return Icons.directions_walk_rounded;
    case 'pool cleaning':
    case 'pool':
      return Icons.water_drop_rounded;
    case 'hvac':
      return Icons.ac_unit_rounded;
    default:
      return Icons.home_repair_service_rounded;
  }
}

String _capitalise(String value) {
  if (value.isEmpty) return value;
  return value[0].toUpperCase() + value.substring(1);
}

String _initials(String name) {
  final parts = name.split(' ').where((part) => part.isNotEmpty).take(2).toList();
  if (parts.isEmpty) return '?';
  return parts.map((part) => part[0].toUpperCase()).join();
}

const _softShadow = <BoxShadow>[
  BoxShadow(
    color: Color(0x14000000),
    blurRadius: 16,
    offset: Offset(0, 4),
  ),
];
