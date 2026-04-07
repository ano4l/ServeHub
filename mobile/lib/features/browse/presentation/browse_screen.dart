import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/features/browse/data/categories_provider.dart';

const _bannerColors = <Color>[
  Color(0xFF0F766E),
  Color(0xFF1D4ED8),
  Color(0xFF7C3AED),
  Color(0xFFB45309),
  Color(0xFFBE123C),
  Color(0xFF166534),
];

const _locationPresets = <_LocationPreset>[
  _LocationPreset(label: 'Anywhere'),
  _LocationPreset(
    label: 'Cape Town',
    city: 'Cape Town',
    latitude: -33.9249,
    longitude: 18.4241,
  ),
  _LocationPreset(
    label: 'Johannesburg',
    city: 'Johannesburg',
    latitude: -26.2041,
    longitude: 28.0473,
  ),
  _LocationPreset(
    label: 'Pretoria',
    city: 'Pretoria',
    latitude: -25.7479,
    longitude: 28.2293,
  ),
  _LocationPreset(
    label: 'Sandton',
    city: 'Sandton',
    latitude: -26.1076,
    longitude: 28.0567,
  ),
  _LocationPreset(
    label: 'Midrand',
    city: 'Midrand',
    latitude: -25.9992,
    longitude: 28.1263,
  ),
  _LocationPreset(
    label: 'Durban',
    city: 'Durban',
    latitude: -29.8587,
    longitude: 31.0218,
  ),
];

const _pricePresets = <_PricePreset>[
  _PricePreset(label: 'Any price'),
  _PricePreset(label: 'Under R300', maxPrice: 300),
  _PricePreset(label: 'R300 - R600', minPrice: 300, maxPrice: 600),
  _PricePreset(label: 'R600 - R1000', minPrice: 600, maxPrice: 1000),
  _PricePreset(label: 'R1000+', minPrice: 1000),
];

const _radiusOptions = <int>[5, 10, 25, 50];

final _browseResultsProvider =
    FutureProvider.family<List<_BrowseService>, _BrowseFilters>((ref, filters) async {
  final dio = ref.read(dioProvider);
  try {
    final response = await dio.get(
      '/catalog/services',
      queryParameters: filters.toQueryParameters(),
    );
    final raw = response.data is List
        ? response.data as List
        : (response.data is Map && response.data['content'] is List
            ? response.data['content'] as List
            : <dynamic>[]);
    return raw
        .map((item) => _browseServiceFromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
  } on DioException catch (error) {
    throw ApiException.fromDioError(error);
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
  _LocationPreset _selectedLocation = _locationPresets.first;
  _PricePreset _selectedPrice = _pricePresets.first;
  int _selectedRadiusKm = 25;

  _BrowseFilters get _filters => _BrowseFilters(
        search: _search,
        category: _selectedCategory,
        location: _selectedLocation,
        price: _selectedPrice,
        radiusKm: _selectedRadiusKm,
      );

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _showFiltersSheet() async {
    var pendingLocation = _selectedLocation;
    var pendingPrice = _selectedPrice;
    var pendingRadiusKm = _selectedRadiusKm;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final radiusEnabled = pendingLocation.hasCoordinates;
            return SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Filters',
                          style: Theme.of(context)
                              .textTheme
                              .titleLarge
                              ?.copyWith(fontWeight: FontWeight.w800),
                        ),
                        const Spacer(),
                        TextButton(
                          onPressed: () {
                            setModalState(() {
                              pendingLocation = _locationPresets.first;
                              pendingPrice = _pricePresets.first;
                              pendingRadiusKm = 25;
                            });
                          },
                          child: const Text('Reset'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Area',
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _locationPresets.map((location) {
                        final selected = location == pendingLocation;
                        return ChoiceChip(
                          label: Text(location.label),
                          selected: selected,
                          onSelected: (_) {
                            setModalState(() {
                              pendingLocation = location;
                              if (!location.hasCoordinates) {
                                pendingRadiusKm = 25;
                              }
                            });
                          },
                          showCheckmark: false,
                          selectedColor: Colors.white,
                          backgroundColor: AppColors.surfaceAlt,
                          labelStyle: TextStyle(
                            color: selected
                                ? AppColors.primary
                                : AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                          side: BorderSide.none,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'Price',
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _pricePresets.map((price) {
                        final selected = price == pendingPrice;
                        return ChoiceChip(
                          label: Text(price.label),
                          selected: selected,
                          onSelected: (_) => setModalState(() {
                            pendingPrice = price;
                          }),
                          showCheckmark: false,
                          selectedColor: Colors.white,
                          backgroundColor: AppColors.surfaceAlt,
                          labelStyle: TextStyle(
                            color: selected
                                ? AppColors.primary
                                : AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                          side: BorderSide.none,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'Radius',
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      radiusEnabled
                          ? 'Use radius to narrow providers around the selected area.'
                          : 'Choose an area first to enable radius filtering.',
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _radiusOptions.map((radiusKm) {
                        final selected = radiusKm == pendingRadiusKm;
                        return ChoiceChip(
                          label: Text('$radiusKm km'),
                          selected: selected,
                          onSelected: radiusEnabled
                              ? (_) => setModalState(() {
                                  pendingRadiusKm = radiusKm;
                                })
                              : null,
                          showCheckmark: false,
                          selectedColor: Colors.white,
                          disabledColor: AppColors.surfaceAlt.withValues(alpha: 0.6),
                          backgroundColor: AppColors.surfaceAlt,
                          labelStyle: TextStyle(
                            color: !radiusEnabled
                                ? AppColors.textMuted
                                : selected
                                    ? AppColors.primary
                                    : AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                          side: BorderSide.none,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          setState(() {
                            _selectedLocation = pendingLocation;
                            _selectedPrice = pendingPrice;
                            _selectedRadiusKm = pendingRadiusKm;
                          });
                          Navigator.of(context).pop();
                        },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18),
                          ),
                        ),
                        child: const Text('Apply filters'),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _clearFilters() {
    setState(() {
      _searchController.clear();
      _search = '';
      _selectedCategory = 'All';
      _selectedLocation = _locationPresets.first;
      _selectedPrice = _pricePresets.first;
      _selectedRadiusKm = 25;
    });
  }

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(categoriesProvider);
    final results = ref.watch(_browseResultsProvider(_filters));

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
                    Text(
                      'Explore',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Search by service, provider, city, and budget.',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        height: 1.4,
                      ),
                    ),
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
                          hintText: 'Search services, providers, cities...',
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
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            _filters.summaryLabel,
                            style: const TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        OutlinedButton.icon(
                          onPressed: _showFiltersSheet,
                          icon: const Icon(Icons.tune_rounded, size: 18),
                          label: Text(
                            _filters.activeFilterCount == 0
                                ? 'Filters'
                                : 'Filters (${_filters.activeFilterCount})',
                          ),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 12,
                            ),
                            backgroundColor: AppColors.surface,
                            side: const BorderSide(color: AppColors.border),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                        ),
                      ],
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
                            color: selected
                                ? AppColors.primary
                                : AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                          side: BorderSide.none,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
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
          if (_filters.hasVisiblePills)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (_selectedLocation != _locationPresets.first)
                      _FilterPill(
                        label: _selectedLocation.label,
                        icon: Icons.location_on_outlined,
                      ),
                    if (_selectedPrice != _pricePresets.first)
                      _FilterPill(
                        label: _selectedPrice.label,
                        icon: Icons.payments_outlined,
                      ),
                    if (_selectedLocation.hasCoordinates)
                      _FilterPill(
                        label: '$_selectedRadiusKm km radius',
                        icon: Icons.radar_outlined,
                      ),
                    if (_search.isNotEmpty)
                      _FilterPill(
                        label: 'Search: ${_search.trim()}',
                        icon: Icons.search_rounded,
                      ),
                    if (_selectedCategory != 'All')
                      _FilterPill(
                        label: _selectedCategory,
                        icon: _serviceIcon(_selectedCategory),
                      ),
                    GestureDetector(
                      onTap: _clearFilters,
                      child: const _FilterPill(
                        label: 'Clear all',
                        icon: Icons.refresh_rounded,
                        accent: true,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          results.when(
            data: (items) {
              if (items.isEmpty) {
                return const SliverFillRemaining(
                  hasScrollBody: false,
                  child: _EmptyResultsState(),
                );
              }

              return SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _ServiceCard(
                        service: items[index],
                        bannerColor: _bannerColors[index % _bannerColors.length],
                      ),
                    ),
                    childCount: items.length,
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
            error: (error, _) => SliverFillRemaining(
              hasScrollBody: false,
              child: _BrowseErrorState(message: error.toString()),
            ),
          ),
        ],
      ),
    );
  }
}

class _ServiceCard extends StatelessWidget {
  final _BrowseService service;
  final Color bannerColor;

  const _ServiceCard({
    required this.service,
    required this.bannerColor,
  });

  @override
  Widget build(BuildContext context) {
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
                    _serviceIcon(service.category),
                    size: 72,
                    color: Colors.white.withValues(alpha: 0.35),
                  ),
                ),
                Positioned(
                  left: 16,
                  top: 16,
                  child: _Pill(
                    label: service.category,
                    color: Colors.black.withValues(alpha: 0.5),
                    textColor: Colors.white,
                  ),
                ),
                Positioned(
                  right: 16,
                  top: 16,
                  child: _Pill(
                    label: service.priceLabel,
                    color: Colors.black.withValues(alpha: 0.6),
                    textColor: Colors.white,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Positioned(
                  left: 16,
                  bottom: 16,
                  child: _Pill(
                    label: service.cityLabel,
                    color: Colors.white.withValues(alpha: 0.18),
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
                          _initials(service.providerName),
                          style: const TextStyle(
                            color: AppColors.accent,
                            fontWeight: FontWeight.w800,
                          ),
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
                                  service.providerName,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 15,
                                  ),
                                ),
                              ),
                              if (service.verified) ...[
                                const SizedBox(width: 4),
                                const Icon(
                                  Icons.verified_rounded,
                                  size: 16,
                                  color: AppColors.accent,
                                ),
                              ],
                            ],
                          ),
                          Text(
                            '${service.cityLabel} . ${service.durationLabel}',
                            style: const TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.star_rounded,
                              color: Color(0xFFFFB800),
                              size: 16,
                            ),
                            const SizedBox(width: 3),
                            Text(
                              service.rating.toStringAsFixed(1),
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                        Text(
                          '(${service.reviewCount})',
                          style: const TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  service.serviceName,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  service.description,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: service.tags.map((tag) {
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
                    _Action(
                      icon: Icons.schedule_outlined,
                      label: service.durationLabel,
                    ),
                    const SizedBox(width: 20),
                    _Action(
                      icon: Icons.location_on_outlined,
                      label: service.cityLabel,
                    ),
                    const Spacer(),
                    ElevatedButton(
                      onPressed: () =>
                          context.push('/providers/${service.providerId}'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 22,
                          vertical: 12,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(100),
                        ),
                      ),
                      child: const Text('View Provider'),
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
        Text(
          label,
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontWeight: FontWeight.w600,
            fontSize: 12,
          ),
        ),
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
        style: TextStyle(
          color: textColor,
          fontSize: 11,
          fontWeight: fontWeight,
        ),
      ),
    );
  }
}

class _FilterPill extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool accent;

  const _FilterPill({
    required this.label,
    required this.icon,
    this.accent = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: accent ? AppColors.accentLight : AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 14,
            color: accent ? AppColors.accent : AppColors.textSecondary,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: accent ? AppColors.accent : AppColors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyResultsState extends StatelessWidget {
  const _EmptyResultsState();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.travel_explore_rounded,
              size: 52,
              color: AppColors.textMuted,
            ),
            const SizedBox(height: 14),
            Text(
              'No services matched',
              style: Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            const Text(
              'Try a broader search, a different city, or a wider price range.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.textSecondary,
                height: 1.45,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BrowseErrorState extends StatelessWidget {
  final String message;

  const _BrowseErrorState({required this.message});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.wifi_off_rounded,
              size: 52,
              color: AppColors.textMuted,
            ),
            const SizedBox(height: 14),
            Text(
              'Browse unavailable',
              style: Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textSecondary,
                height: 1.45,
              ),
            ),
          ],
        ),
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

class _BrowseFilters {
  final String search;
  final String category;
  final _LocationPreset location;
  final _PricePreset price;
  final int radiusKm;

  const _BrowseFilters({
    required this.search,
    required this.category,
    required this.location,
    required this.price,
    required this.radiusKm,
  });

  Map<String, dynamic> toQueryParameters() {
    return {
      'size': 60,
      if (search.trim().isNotEmpty) 'query': search.trim(),
      if (category != 'All') 'category': category,
      if (location.city != null) 'city': location.city,
      if (price.minPrice != null) 'minPrice': price.minPrice,
      if (price.maxPrice != null) 'maxPrice': price.maxPrice,
      if (location.hasCoordinates) 'lat': location.latitude,
      if (location.hasCoordinates) 'lng': location.longitude,
      if (location.hasCoordinates) 'radiusKm': radiusKm,
    };
  }

  int get activeFilterCount {
    var count = 0;
    if (location != _locationPresets.first) {
      count += 1;
    }
    if (price != _pricePresets.first) {
      count += 1;
    }
    if (location.hasCoordinates && radiusKm != 25) {
      count += 1;
    }
    return count;
  }

  bool get hasVisiblePills =>
      search.trim().isNotEmpty ||
      category != 'All' ||
      location != _locationPresets.first ||
      price != _pricePresets.first;

  String get summaryLabel {
    if (search.trim().isNotEmpty) {
      return 'Searching "${search.trim()}"';
    }
    if (location != _locationPresets.first) {
      final label = category == 'All' ? 'services' : category.toLowerCase();
      return 'Showing $label around ${location.label}';
    }
    if (category != 'All') {
      return 'Showing ${category.toLowerCase()} services';
    }
    return 'Browse popular services near you';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }
    return other is _BrowseFilters &&
        other.search == search &&
        other.category == category &&
        other.location == location &&
        other.price == price &&
        other.radiusKm == radiusKm;
  }

  @override
  int get hashCode => Object.hash(search, category, location, price, radiusKm);
}

class _BrowseService {
  final int id;
  final int providerId;
  final String providerName;
  final String providerCity;
  final String providerBio;
  final String category;
  final String serviceName;
  final String pricingType;
  final double price;
  final int estimatedDurationMinutes;
  final double rating;
  final int reviewCount;
  final bool verified;
  final int? serviceRadiusKm;
  final double? latitude;
  final double? longitude;

  const _BrowseService({
    required this.id,
    required this.providerId,
    required this.providerName,
    required this.providerCity,
    required this.providerBio,
    required this.category,
    required this.serviceName,
    required this.pricingType,
    required this.price,
    required this.estimatedDurationMinutes,
    required this.rating,
    required this.reviewCount,
    required this.verified,
    required this.serviceRadiusKm,
    required this.latitude,
    required this.longitude,
  });
}

class _LocationPreset {
  final String label;
  final String? city;
  final double? latitude;
  final double? longitude;

  const _LocationPreset({
    required this.label,
    this.city,
    this.latitude,
    this.longitude,
  });

  bool get hasCoordinates => latitude != null && longitude != null;
}

class _PricePreset {
  final String label;
  final int? minPrice;
  final int? maxPrice;

  const _PricePreset({
    required this.label,
    this.minPrice,
    this.maxPrice,
  });
}

extension on _BrowseService {
  String get cityLabel => providerCity.isEmpty ? 'Nearby' : providerCity;

  String get durationLabel {
    if (estimatedDurationMinutes >= 60 &&
        estimatedDurationMinutes % 60 == 0) {
      final hours = estimatedDurationMinutes ~/ 60;
      return hours == 1 ? '1 hr' : '$hours hrs';
    }
    return '$estimatedDurationMinutes min';
  }

  String get priceLabel {
    final amount = price.truncateToDouble() == price
        ? price.toStringAsFixed(0)
        : price.toStringAsFixed(2);
    return pricingType == 'HOURLY' ? 'R$amount/hr' : 'R$amount';
  }

  String get description {
    if (providerBio.isNotEmpty) {
      return providerBio;
    }
    return 'Trusted ${category.toLowerCase()} support with fast booking and clear pricing.';
  }

  List<String> get tags {
    final values = <String>[
      cityLabel,
      durationLabel,
      if (serviceRadiusKm != null) '$serviceRadiusKm km radius',
      pricingType == 'HOURLY' ? 'Hourly rate' : 'Fixed price',
    ];
    return values.take(3).toList();
  }
}

_BrowseService _browseServiceFromJson(Map<String, dynamic> json) {
  final pricingType = json['pricingType']?.toString() ?? 'FIXED';
  final providerCity = json['providerCity']?.toString().trim() ?? '';
  final providerBio = json['providerBio']?.toString().trim() ?? '';
  return _BrowseService(
    id: _asInt(json['id']) ?? 0,
    providerId: _asInt(json['providerId']) ?? 0,
    providerName: json['providerName']?.toString() ?? 'Provider',
    providerCity: providerCity,
    providerBio: providerBio,
    category: json['category']?.toString() ?? 'Service',
    serviceName: json['serviceName']?.toString() ?? 'Service',
    pricingType: pricingType,
    price: _asDouble(json['price']) ?? 0,
    estimatedDurationMinutes: _asInt(json['estimatedDurationMinutes']) ?? 60,
    rating: _asDouble(json['averageRating']) ?? 4.8,
    reviewCount: _asInt(json['reviewCount']) ?? 0,
    verified:
        (json['verificationStatus']?.toString() ?? 'VERIFIED') == 'VERIFIED',
    serviceRadiusKm: _asInt(json['serviceRadiusKm']),
    latitude: _asDouble(json['latitude']),
    longitude: _asDouble(json['longitude']),
  );
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
    case 'plumbing':
      return Icons.plumbing_rounded;
    case 'electrical':
      return Icons.electrical_services_rounded;
    case 'gardening':
      return Icons.yard_rounded;
    case 'painting':
      return Icons.format_paint_rounded;
    case 'carpentry':
      return Icons.handyman_rounded;
    case 'hvac':
      return Icons.ac_unit_rounded;
    default:
      return Icons.home_repair_service_rounded;
  }
}

String _initials(String name) {
  final parts =
      name.split(' ').where((part) => part.isNotEmpty).take(2).toList();
  if (parts.isEmpty) {
    return '?';
  }
  return parts.map((part) => part[0].toUpperCase()).join();
}

int? _asInt(Object? value) {
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  if (value is String) {
    return int.tryParse(value);
  }
  return null;
}

double? _asDouble(Object? value) {
  if (value is double) {
    return value;
  }
  if (value is num) {
    return value.toDouble();
  }
  if (value is String) {
    return double.tryParse(value);
  }
  return null;
}

const _glassShadow = <BoxShadow>[
  BoxShadow(
    color: Color(0x66000000),
    blurRadius: 24,
    offset: Offset(0, 8),
  ),
];
