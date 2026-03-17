import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/demo/customer_demo_data.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/features/browse/data/categories_provider.dart';

final _exploreProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  try {
    final response = await dio.get('/providers', queryParameters: {'size': 10});
    final raw = response.data is List
        ? response.data as List
        : (response.data is Map && response.data['content'] is List ? response.data['content'] as List : <dynamic>[]);
    if (raw.isEmpty) return CustomerDemoData.services();
    return raw.asMap().entries.map((entry) {
      final map = Map<String, dynamic>.from(entry.value as Map);
      final category = map['categoryName']?.toString() ?? 'Service';
      final provider = map['fullName']?.toString() ?? map['businessName']?.toString() ?? 'Provider';
      return {
        'id': map['id']?.toString() ?? 'provider-${entry.key}',
        'title': '$category with ${provider.split(' ').first}',
        'description': map['bio']?.toString() ?? 'Verified local service with quick response times and easy booking.',
        'category': category,
        'provider': provider,
        'priceLabel': 'From R${420 + entry.key * 80}',
        'durationLabel': map['responseTime']?.toString() ?? 'Fast response',
        'availability': map['availableNow'] == true ? 'Available now' : 'Available this week',
        'tags': [map['city']?.toString() ?? 'Nearby', 'Verified', 'Popular'],
        'rating': (map['averageRating'] as num?)?.toDouble() ?? 4.8,
        'reviews': map['reviewCount'] ?? 120,
        'verified': map['verified'] == true,
      };
    }).toList();
  } catch (_) {
    return CustomerDemoData.services();
  }
});

class BrowseScreen extends ConsumerStatefulWidget {
  const BrowseScreen({super.key});

  @override
  ConsumerState<BrowseScreen> createState() => _BrowseScreenState();
}

class _BrowseScreenState extends ConsumerState<BrowseScreen> {
  final _searchController = TextEditingController();
  String _search = '';
  String _selectedCategory = 'All';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(categoriesProvider);
    final services = ref.watch(_exploreProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Explore', style: Theme.of(context).textTheme.headlineMedium),
                    const SizedBox(height: 16),
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: _glassShadow,
                      ),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (value) => setState(() => _search = value),
                        decoration: InputDecoration(
                          hintText: 'Search services, providers...',
                          prefixIcon: const Icon(Icons.search_rounded),
                          suffixIcon: _search.isEmpty
                              ? null
                              : IconButton(
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() => _search = '');
                                  },
                                  icon: const Icon(Icons.close_rounded),
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
            child: SizedBox(
              height: 48,
              child: categories.when(
                data: (items) {
                  final labels = ['All', ...items.map((item) => item.name)];
                  return ListView.builder(
                    padding: const EdgeInsets.fromLTRB(20, 16, 12, 0),
                    scrollDirection: Axis.horizontal,
                    itemCount: labels.length,
                    itemBuilder: (context, index) {
                      final label = labels[index];
                      final selected = label == _selectedCategory;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(label),
                          selected: selected,
                          onSelected: (_) => setState(() => _selectedCategory = label),
                          showCheckmark: false,
                          selectedColor: Colors.white,
                          backgroundColor: AppColors.surfaceAlt,
                          labelStyle: TextStyle(
                            color: selected ? AppColors.primary : AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                          side: BorderSide.none,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                      );
                    },
                  );
                },
                loading: () => const SizedBox.shrink(),
                error: (_, __) => ListView(
                  padding: const EdgeInsets.fromLTRB(20, 16, 12, 0),
                  scrollDirection: Axis.horizontal,
                  children: const [
                    _StaticChip(label: 'All', active: true),
                    _StaticChip(label: 'Cleaning'),
                    _StaticChip(label: 'Hair'),
                    _StaticChip(label: 'Makeup'),
                  ],
                ),
              ),
            ),
          ),
          services.when(
            data: (items) {
              final filtered = items.where((item) {
                final matchesSearch = _search.isEmpty
                    || '${item['title']} ${item['description']} ${item['provider']}'.toLowerCase().contains(_search.toLowerCase());
                final matchesCategory = _selectedCategory == 'All'
                    || (item['category']?.toString().toLowerCase() ?? '') == _selectedCategory.toLowerCase();
                return matchesSearch && matchesCategory;
              }).toList();
              return SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _ServiceCard(
                        service: filtered[index],
                        bannerColor: CustomerDemoData.bannerColors[index % CustomerDemoData.bannerColors.length],
                      ),
                    ),
                    childCount: filtered.length,
                  ),
                ),
              );
            },
            loading: () => const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Center(child: CircularProgressIndicator()),
              ),
            ),
            error: (_, __) => const SliverToBoxAdapter(child: SizedBox.shrink()),
          ),
        ],
      ),
    );
  }
}

class _ServiceCard extends StatelessWidget {
  final Map<String, dynamic> service;
  final Color bannerColor;

  const _ServiceCard({required this.service, required this.bannerColor});

  @override
  Widget build(BuildContext context) {
    final provider = service['provider']?.toString() ?? 'Provider';
    final rating = (service['rating'] as num?)?.toDouble() ?? 4.8;
    final reviews = service['reviews']?.toString() ?? '0';
    final tags = (service['tags'] as List?)?.map((item) => item.toString()).toList() ?? <String>[];
    final verified = service['verified'] == true;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        boxShadow: _glassShadow,
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 200,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [bannerColor, bannerColor.withValues(alpha: 0.78)],
              ),
            ),
            child: Stack(
              children: [
                Center(
                  child: Icon(
                    _serviceIcon(service['category']?.toString() ?? ''),
                    size: 72,
                    color: Colors.white.withValues(alpha: 0.35),
                  ),
                ),
                Positioned(
                  left: 16,
                  top: 16,
                  child: _Pill(
                    label: service['category']?.toString() ?? 'Service',
                    color: Colors.black.withValues(alpha: 0.5),
                    textColor: Colors.white,
                  ),
                ),
                Positioned(
                  right: 16,
                  top: 16,
                  child: _Pill(
                    label: service['priceLabel']?.toString() ?? 'From R0',
                    color: Colors.black.withValues(alpha: 0.6),
                    textColor: Colors.white,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Positioned(
                  left: 16,
                  bottom: 16,
                  child: _Pill(
                    label: service['availability']?.toString() ?? 'Available soon',
                    color: AppColors.success,
                    textColor: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
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
                          _initials(provider),
                          style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.w800),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  provider,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                                ),
                              ),
                              if (verified) ...[
                                const SizedBox(width: 4),
                                Icon(Icons.verified_rounded, size: 16, color: AppColors.accent),
                              ],
                            ],
                          ),
                          Text(
                            service['durationLabel']?.toString() ?? '',
                            style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.star_rounded, color: Color(0xFFFFB800), size: 16),
                            const SizedBox(width: 3),
                            Text(rating.toStringAsFixed(1), style: const TextStyle(fontWeight: FontWeight.w700)),
                          ],
                        ),
                        Text('($reviews)', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  service['title']?.toString() ?? 'Service',
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
                ),
                const SizedBox(height: 8),
                Text(
                  service['description']?.toString() ?? '',
                  style: const TextStyle(color: AppColors.textSecondary, height: 1.45),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: tags.take(3).map((tag) {
                    return _Pill(
                      label: tag,
                      color: AppColors.surfaceAlt,
                      textColor: AppColors.textSecondary,
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const _Action(icon: Icons.favorite_border_rounded, label: '12'),
                    const SizedBox(width: 20),
                    const _Action(icon: Icons.chat_bubble_outline_rounded, label: '2'),
                    const SizedBox(width: 20),
                    const _Action(icon: Icons.share_outlined, label: 'Share'),
                    const Spacer(),
                    ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                      ),
                      child: const Text('Book Now'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Action extends StatelessWidget {
  final IconData icon;
  final String label;

  const _Action({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600, fontSize: 12)),
      ],
    );
  }
}

class _Pill extends StatelessWidget {
  final String label;
  final Color color;
  final Color textColor;
  final FontWeight fontWeight;

  const _Pill({
    required this.label,
    required this.color,
    required this.textColor,
    this.fontWeight = FontWeight.w700,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        label,
        style: TextStyle(color: textColor, fontSize: 11, fontWeight: fontWeight),
      ),
    );
  }
}

class _StaticChip extends StatelessWidget {
  final String label;
  final bool active;

  const _StaticChip({required this.label, this.active = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: active ? Colors.white : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: active ? AppColors.primary : AppColors.textSecondary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

IconData _serviceIcon(String category) {
  switch (category.toLowerCase()) {
    case 'cleaning':
      return Icons.cleaning_services_rounded;
    case 'hair':
      return Icons.cut_rounded;
    case 'makeup':
      return Icons.auto_awesome_rounded;
    case 'dog washing':
      return Icons.pets_rounded;
    case 'dog walking':
      return Icons.directions_walk_rounded;
    case 'pool cleaning':
      return Icons.water_drop_rounded;
    case 'hvac':
      return Icons.ac_unit_rounded;
    default:
      return Icons.home_repair_service_rounded;
  }
}

String _initials(String name) {
  final parts = name.split(' ').where((part) => part.isNotEmpty).take(2).toList();
  if (parts.isEmpty) return '?';
  return parts.map((part) => part[0].toUpperCase()).join();
}

const _glassShadow = <BoxShadow>[
  BoxShadow(
    color: Color(0x66000000),
    blurRadius: 24,
    offset: Offset(0, 8),
  ),
];
