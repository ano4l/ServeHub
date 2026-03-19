import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/core/demo/customer_demo_data.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/core/widgets/skeleton.dart';
import 'package:serveify/features/auth/providers/auth_provider.dart';
import 'package:serveify/features/services/presentation/services_directory_screen.dart';

// ─── Data providers ───

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

// ─── Constants ───

const _bg = Color(0xFF07111F);
const _filterChips = ['Offers', 'Under 30 min', 'Top rated', 'Available now'];

// ─── Home Screen ───

class CustomerHomeScreen extends ConsumerStatefulWidget {
  const CustomerHomeScreen({super.key});

  @override
  ConsumerState<CustomerHomeScreen> createState() => _CustomerHomeScreenState();
}

class _CustomerHomeScreenState extends ConsumerState<CustomerHomeScreen> {
  String _address = '123 Main Street, Sandton';
  final _activeChips = <String>{};

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final bookings = ref.watch(_homeBookingsProvider);
    final providers = ref.watch(_featuredProvidersProvider);
    final name = auth.email?.split('@').first.replaceAll('.', ' ').split(' ').map(_capitalise).join(' ') ?? 'Alex';

    return Scaffold(
      backgroundColor: _bg,
      body: RefreshIndicator(
        color: const Color(0xFF67E8F9),
        backgroundColor: _bg,
        onRefresh: () async {
          ref.invalidate(_homeBookingsProvider);
          ref.invalidate(_featuredProvidersProvider);
        },
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
          slivers: [
            // ═══ Sticky header: search + address ═══
            SliverPersistentHeader(
              pinned: true,
              delegate: _StickySearchDelegate(
                address: _address,
                onAddressTap: () => _showAddressPicker(context),
                bookingCount: bookings.valueOrNull?.length ?? 0,
                onBookingsTap: () => context.go('/bookings'),
              ),
            ),

            // ═══ Category icon bubbles (Uber Eats style) ═══
            SliverToBoxAdapter(
              child: SizedBox(
                height: 100,
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 12, 8, 0),
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  itemCount: kServiceCategories.length > 8 ? 8 : kServiceCategories.length,
                  itemBuilder: (context, index) {
                    final cat = kServiceCategories[index];
                    return Padding(
                      padding: const EdgeInsets.only(right: 16),
                      child: GestureDetector(
                        onTap: () => context.go('/services'),
                        child: SizedBox(
                          width: 64,
                          child: Column(
                            children: [
                              Container(
                                width: 56, height: 56,
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.06),
                                  shape: BoxShape.circle,
                                ),
                                child: Center(child: Text(cat.emoji, style: const TextStyle(fontSize: 24))),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                cat.name.split('&').first.split(' ').first,
                                style: TextStyle(fontSize: 10, color: Colors.white.withValues(alpha: 0.55)),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),

            // ═══ Filter chips ═══
            SliverToBoxAdapter(
              child: SizedBox(
                height: 44,
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  children: _filterChips.map((chip) {
                    final active = _activeChips.contains(chip);
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: GestureDetector(
                        onTap: () => setState(() {
                          if (active) _activeChips.remove(chip); else _activeChips.add(chip);
                        }),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: active ? Colors.white : Colors.white.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(20),
                            border: active ? null : Border.all(color: Colors.white.withValues(alpha: 0.1)),
                          ),
                          child: Text(
                            chip,
                            style: TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w600,
                              color: active ? _bg : Colors.white.withValues(alpha: 0.6),
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),

            // ═══ Active booking strip ═══
            SliverToBoxAdapter(
              child: bookings.when(
                data: (items) {
                  final active = items.where((b) => ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'].contains(b['status'])).toList();
                  if (active.isEmpty) return const SizedBox.shrink();
                  final first = active.first;
                  return Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: GestureDetector(
                      onTap: () => context.go('/bookings'),
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFF06B6D4).withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFF06B6D4).withValues(alpha: 0.2)),
                        ),
                        child: Row(
                          children: [
                            Stack(
                              alignment: Alignment.center,
                              children: [
                                Container(
                                  width: 36, height: 36,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF06B6D4).withValues(alpha: 0.25),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.access_time_rounded, color: Color(0xFF67E8F9), size: 18),
                                ),
                              ],
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    first['service']?.toString() ?? 'Service',
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white),
                                    maxLines: 1, overflow: TextOverflow.ellipsis,
                                  ),
                                  Text(
                                    first['provider']?.toString() ?? 'Provider',
                                    style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.5)),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: const Color(0xFF06B6D4).withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                _statusLabel(first['status']?.toString() ?? ''),
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF67E8F9)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ),

            // ═══ Featured providers (horizontal scroll cards) ═══
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                child: _SectionHeader(
                  title: 'Featured on ServeHub',
                  action: 'See all',
                  onTap: () => context.go('/browse'),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 210,
                child: providers.when(
                  data: (items) => ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 12, 8, 0),
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    itemCount: items.length,
                    itemBuilder: (context, index) => _FeaturedCard(provider: items[index]),
                  ),
                  loading: () => const Center(child: HomeSkeleton()),
                  error: (_, __) => const SizedBox.shrink(),
                ),
              ),
            ),

            // ═══ Popular services grid ═══
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                child: _SectionHeader(
                  title: 'Popular services',
                  action: 'View all 100',
                  onTap: () => context.go('/services'),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.6,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final service = kPopularServices[index];
                    final cat = kServiceCategories.firstWhere((c) => c.id == service.categoryId);
                    return _PopularServiceCard(service: service, category: cat, onTap: () => context.go('/book'));
                  },
                  childCount: kPopularServices.length > 6 ? 6 : kPopularServices.length,
                ),
              ),
            ),

            // ═══ Current bookings list ═══
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                child: _SectionHeader(
                  title: 'Your bookings',
                  action: 'View all',
                  onTap: () => context.go('/bookings'),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                child: bookings.when(
                  data: (items) {
                    final display = items.take(3).toList();
                    return Column(
                      children: display.map((item) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _BookingTile(booking: item, onTap: () => context.go('/bookings')),
                      )).toList(),
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

  void _showAddressPicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0A1525),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) {
        final addresses = ['123 Main Street, Sandton', '45 Rivonia Road, Sandton', '10 Jan Smuts, Rosebank'];
        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Your addresses', style: TextStyle(fontSize: 11, letterSpacing: 1.5, color: Colors.white.withValues(alpha: 0.35))),
              const SizedBox(height: 12),
              ...addresses.map((addr) => ListTile(
                leading: Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.08), shape: BoxShape.circle),
                  child: Icon(Icons.location_on_outlined, color: Colors.white.withValues(alpha: 0.5), size: 18),
                ),
                title: Text(addr, style: const TextStyle(color: Colors.white, fontSize: 14)),
                onTap: () {
                  setState(() => _address = addr);
                  Navigator.pop(context);
                },
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              )),
              const SizedBox(height: 12),
            ],
          ),
        );
      },
    );
  }
}

// ─── Sticky search header delegate ───

class _StickySearchDelegate extends SliverPersistentHeaderDelegate {
  final String address;
  final VoidCallback onAddressTap;
  final int bookingCount;
  final VoidCallback onBookingsTap;

  _StickySearchDelegate({
    required this.address,
    required this.onAddressTap,
    required this.bookingCount,
    required this.onBookingsTap,
  });

  @override
  double get minExtent => 110;

  @override
  double get maxExtent => 110;

  @override
  bool shouldRebuild(covariant _StickySearchDelegate oldDelegate) =>
      address != oldDelegate.address || bookingCount != oldDelegate.bookingCount;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: _bg.withValues(alpha: 0.95),
      padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        child: Column(
          children: [
            // Search bar
            GestureDetector(
              onTap: () => context.go('/browse'),
              child: Container(
                height: 46,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                ),
                child: Row(
                  children: [
                    const SizedBox(width: 14),
                    Icon(Icons.search_rounded, color: Colors.white.withValues(alpha: 0.35), size: 20),
                    const SizedBox(width: 10),
                    Text('Search ServeHub', style: TextStyle(color: Colors.white.withValues(alpha: 0.3), fontSize: 15)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            // Address row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                GestureDetector(
                  onTap: onAddressTap,
                  child: Row(
                    children: [
                      Icon(Icons.location_on_outlined, color: Colors.white.withValues(alpha: 0.6), size: 15),
                      const SizedBox(width: 4),
                      Text(
                        address.split(',').first,
                        style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.6)),
                      ),
                      const SizedBox(width: 2),
                      Icon(Icons.keyboard_arrow_down_rounded, color: Colors.white.withValues(alpha: 0.35), size: 16),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: onBookingsTap,
                  child: Row(
                    children: [
                      Icon(Icons.calendar_today_outlined, color: Colors.white.withValues(alpha: 0.45), size: 14),
                      const SizedBox(width: 4),
                      Text(
                        'Bookings ($bookingCount)',
                        style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.45)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Section header ───

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
        Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: Colors.white)),
        GestureDetector(
          onTap: onTap,
          child: Text(action, style: const TextStyle(color: Color(0xFF67E8F9), fontSize: 13, fontWeight: FontWeight.w600)),
        ),
      ],
    );
  }
}

// ─── Featured card (horizontal scroll, Uber Eats style) ───

class _FeaturedCard extends StatelessWidget {
  final Map<String, dynamic> provider;

  const _FeaturedCard({required this.provider});

  @override
  Widget build(BuildContext context) {
    final name = provider['name']?.toString() ?? 'Provider';
    final category = provider['category']?.toString() ?? 'Service';
    final city = provider['city']?.toString() ?? '';
    final rating = (provider['rating'] as num?)?.toDouble() ?? 4.8;
    final reviews = provider['reviews'] ?? 120;

    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: GestureDetector(
        onTap: () => context.go('/browse'),
        child: Container(
          width: 220,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image placeholder
              Container(
                height: 110,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  gradient: LinearGradient(
                    colors: [
                      Colors.white.withValues(alpha: 0.08),
                      Colors.white.withValues(alpha: 0.02),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Stack(
                  children: [
                    Center(
                      child: Text(
                        _initials(name),
                        style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white.withValues(alpha: 0.15)),
                      ),
                    ),
                    if (provider['verified'] == true)
                      Positioned(
                        left: 8, top: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withValues(alpha: 0.9),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Text('Verified', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
                        ),
                      ),
                  ],
                ),
              ),
              // Body
              Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.9)), maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 2),
                    Text('$category${city.isNotEmpty ? ' · $city' : ''}', style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.4)), maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, color: Color(0xFFFBBF24), size: 14),
                        const SizedBox(width: 3),
                        Text('${rating.toStringAsFixed(1)} ($reviews)', style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.5))),
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

// ─── Popular service card (2-column grid) ───

class _PopularServiceCard extends StatelessWidget {
  final ServiceItem service;
  final ServiceCategory category;
  final VoidCallback onTap;

  const _PopularServiceCard({required this.service, required this.category, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(category.emoji, style: const TextStyle(fontSize: 22)),
            const SizedBox(height: 6),
            Text(
              service.name,
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.9)),
              maxLines: 1, overflow: TextOverflow.ellipsis,
            ),
            Text(
              category.name,
              style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.35)),
              maxLines: 1,
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Booking tile ───

class _BookingTile extends StatelessWidget {
  final Map<String, dynamic> booking;
  final VoidCallback onTap;

  const _BookingTile({required this.booking, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final status = booking['status']?.toString() ?? 'REQUESTED';
    final meta = _bookingMeta(status);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Row(
          children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: meta.color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.handyman_rounded, color: meta.color, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    booking['service']?.toString() ?? 'Service',
                    maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Colors.white),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    booking['provider']?.toString() ?? 'Provider',
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 12),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: meta.color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                meta.label,
                style: TextStyle(color: meta.color, fontWeight: FontWeight.w700, fontSize: 11),
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.chevron_right_rounded, color: Colors.white.withValues(alpha: 0.2), size: 18),
          ],
        ),
      ),
    );
  }
}

// ─── Helpers ───

class _BookingMetaInfo {
  final String label;
  final Color color;
  const _BookingMetaInfo({required this.label, required this.color});
}

_BookingMetaInfo _bookingMeta(String status) {
  switch (status) {
    case 'ACCEPTED':
      return const _BookingMetaInfo(label: 'Accepted', color: Color(0xFF3B82F6));
    case 'IN_PROGRESS':
      return const _BookingMetaInfo(label: 'Active', color: Color(0xFF06B6D4));
    case 'COMPLETED':
      return const _BookingMetaInfo(label: 'Done', color: Color(0xFF10B981));
    default:
      return const _BookingMetaInfo(label: 'Pending', color: Color(0xFFFBBF24));
  }
}

String _statusLabel(String status) {
  switch (status) {
    case 'IN_PROGRESS': return 'In Progress';
    case 'ACCEPTED': return 'Accepted';
    case 'COMPLETED': return 'Done';
    default: return 'Pending';
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
