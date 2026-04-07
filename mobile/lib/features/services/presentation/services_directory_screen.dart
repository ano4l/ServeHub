import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/features/services/data/service_catalog_provider.dart';
import 'package:serveify/features/services/providers/cart_provider.dart' as cart;

class ServicesDirectoryScreen extends ConsumerStatefulWidget {
  const ServicesDirectoryScreen({super.key});

  @override
  ConsumerState<ServicesDirectoryScreen> createState() =>
      _ServicesDirectoryScreenState();
}

class _ServicesDirectoryScreenState
    extends ConsumerState<ServicesDirectoryScreen> {
  final _searchController = TextEditingController();
  String _query = '';
  String? _selectedCategory;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _addToCart(ServiceOfferingModel service) {
    ref.read(cart.cartProvider.notifier).addItem(
          cart.ServiceItem(
            id: service.id,
            name: service.serviceName,
            categoryId: service.categoryKey,
            providerId: service.providerId,
            providerName: service.providerName,
            imageUrl: '',
            description: '${service.category} service by ${service.providerName}',
            priceRange: service.priceLabel,
            priceValue: service.price,
            duration: service.durationLabel,
            estimatedDurationMinutes: service.estimatedDurationMinutes,
            pricingType: service.pricingType,
            rating: 0,
          ),
        );

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${service.serviceName} added to cart'),
        action: SnackBarAction(
          label: 'VIEW CART',
          onPressed: () => context.push('/book'),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const bg = Color(0xFF07111F);
    final cartState = ref.watch(cart.cartProvider);
    final catalog = ref.watch(serviceCatalogProvider);

    return Scaffold(
      backgroundColor: bg,
      floatingActionButton: cartState.isEmpty
          ? null
          : FloatingActionButton.extended(
              onPressed: () => context.push('/book'),
              backgroundColor: const Color(0xFF06B6D4),
              icon: const Icon(Icons.shopping_cart_rounded, size: 20),
              label: Text(
                '${cartState.itemCount} · ${cartState.cartTotal}',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Container(
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: (value) => setState(() => _query = value.trim()),
                  style: const TextStyle(color: Colors.white, fontSize: 15),
                  decoration: InputDecoration(
                    hintText: 'Search services or categories…',
                    hintStyle:
                        TextStyle(color: Colors.white.withValues(alpha: 0.3)),
                    prefixIcon: Icon(
                      Icons.search_rounded,
                      color: Colors.white.withValues(alpha: 0.4),
                    ),
                    suffixIcon: _query.isEmpty
                        ? null
                        : IconButton(
                            icon: Icon(
                              Icons.close_rounded,
                              color: Colors.white.withValues(alpha: 0.4),
                              size: 18,
                            ),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _query = '');
                            },
                          ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: catalog.when(
                data: (services) {
                  final categories = services
                      .map((service) => service.category)
                      .toSet()
                      .toList()
                    ..sort();
                  final filtered = services.where((service) {
                    final matchesCategory = _selectedCategory == null ||
                        service.category == _selectedCategory;
                    final haystack =
                        '${service.serviceName} ${service.category} ${service.providerName}'
                            .toLowerCase();
                    final matchesQuery =
                        _query.isEmpty || haystack.contains(_query.toLowerCase());
                    return matchesCategory && matchesQuery;
                  }).toList()
                    ..sort((a, b) => a.serviceName.compareTo(b.serviceName));

                  return Column(
                    children: [
                      SizedBox(
                        height: 44,
                        child: ListView(
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
                          scrollDirection: Axis.horizontal,
                          children: [
                            _CategoryChip(
                              label: 'All',
                              selected: _selectedCategory == null,
                              onTap: () => setState(() => _selectedCategory = null),
                            ),
                            ...categories.map(
                              (category) => Padding(
                                padding: const EdgeInsets.only(left: 8),
                                child: _CategoryChip(
                                  label: category,
                                  selected: _selectedCategory == category,
                                  onTap: () =>
                                      setState(() => _selectedCategory = category),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: filtered.isEmpty
                            ? _EmptyState(
                                onClear: () {
                                  _searchController.clear();
                                  setState(() {
                                    _query = '';
                                    _selectedCategory = null;
                                  });
                                },
                              )
                            : ListView.separated(
                                padding:
                                    const EdgeInsets.fromLTRB(16, 12, 16, 100),
                                itemCount: filtered.length,
                                separatorBuilder: (_, __) =>
                                    const SizedBox(height: 12),
                                itemBuilder: (context, index) {
                                  final service = filtered[index];
                                  return _ServiceCard(
                                    service: service,
                                    onTap: () =>
                                        context.push('/services/${service.id}'),
                                    onAddToCart: () => _addToCart(service),
                                  );
                                },
                              ),
                      ),
                    ],
                  );
                },
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (error, _) => Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(
                      'Unable to load services.\n$error',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white70),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? Colors.white : Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(20),
          border:
              selected ? null : Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color:
                selected ? const Color(0xFF07111F) : Colors.white.withValues(alpha: 0.65),
          ),
        ),
      ),
    );
  }
}

class _ServiceCard extends StatelessWidget {
  final ServiceOfferingModel service;
  final VoidCallback onTap;
  final VoidCallback onAddToCart;

  const _ServiceCard({
    required this.service,
    required this.onTap,
    required this.onAddToCart,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: const Color(0xFF06B6D4).withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(
                Icons.miscellaneous_services_rounded,
                color: Color(0xFF67E8F9),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    service.serviceName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${service.category} · ${service.providerName}',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.52),
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${service.durationLabel} · ${service.pricingType}',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.35),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  service.priceLabel,
                  style: const TextStyle(
                    color: Color(0xFF67E8F9),
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: onAddToCart,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.add_shopping_cart_rounded,
                      size: 16,
                      color: Colors.white,
                    ),
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

class _EmptyState extends StatelessWidget {
  final VoidCallback onClear;

  const _EmptyState({required this.onClear});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 48),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.06),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.search_rounded,
                color: Colors.white.withValues(alpha: 0.25),
                size: 28,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'No services found',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.white.withValues(alpha: 0.7),
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: onClear,
              child: const Text('Clear filters'),
            ),
          ],
        ),
      ),
    );
  }
}
