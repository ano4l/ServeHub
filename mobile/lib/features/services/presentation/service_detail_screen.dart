import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/features/services/data/service_catalog_provider.dart';
import 'package:serveify/features/services/providers/cart_provider.dart';

final _relatedServicesProvider =
    FutureProvider.family<List<ServiceOfferingModel>, ServiceOfferingModel>(
  (ref, service) async {
    final catalog = await ref.watch(serviceCatalogProvider.future);
    return catalog
        .where((item) => item.category == service.category && item.id != service.id)
        .take(4)
        .toList();
  },
);

class ServiceDetailScreen extends ConsumerWidget {
  final int serviceId;

  const ServiceDetailScreen({super.key, required this.serviceId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final serviceAsync = ref.watch(serviceOfferingProvider(serviceId));

    return Scaffold(
      backgroundColor: const Color(0xFF07111F),
      body: serviceAsync.when(
        data: (service) => _ServiceDetailBody(service: service),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, color: Colors.white54, size: 42),
                const SizedBox(height: 12),
                const Text(
                  'We could not load this service.',
                  style: TextStyle(color: Colors.white, fontSize: 18),
                ),
                const SizedBox(height: 8),
                Text(
                  error.toString(),
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white70),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ServiceDetailBody extends ConsumerWidget {
  final ServiceOfferingModel service;

  const _ServiceDetailBody({required this.service});

  void _addToCart(WidgetRef ref) {
    ref.read(cartProvider.notifier).addItem(
          ServiceItem(
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
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final related = ref.watch(_relatedServicesProvider(service));
    final isInCart = cart.containsService(service.id);

    return SafeArea(
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => context.pop(),
                    icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                  ),
                  const Spacer(),
                  if (cart.itemCount > 0)
                    FilledButton.tonalIcon(
                      onPressed: () => context.push('/book'),
                      icon: const Icon(Icons.shopping_cart_outlined),
                      label: Text('${cart.itemCount}'),
                    ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(28),
                      gradient: const LinearGradient(
                        colors: [Color(0xFF0C1F39), Color(0xFF12345B)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            service.category,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        const SizedBox(height: 18),
                        Text(
                          service.serviceName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          service.providerName,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.78),
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 18),
                        Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          children: [
                            _InfoChip(
                              icon: Icons.payments_outlined,
                              label: service.priceLabel,
                            ),
                            _InfoChip(
                              icon: Icons.schedule_outlined,
                              label: service.durationLabel,
                            ),
                            _InfoChip(
                              icon: Icons.receipt_long_outlined,
                              label: service.pricingType,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'What to expect',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'This booking creates a request directly with ${service.providerName}. '
                    'The provider can confirm, message you, and complete the job through Serveify.',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.68),
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Actions',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => context.push('/providers/${service.providerId}'),
                          icon: const Icon(Icons.storefront_outlined),
                          label: const Text('View Provider'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            _addToCart(ref);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('${service.serviceName} added to cart'),
                              ),
                            );
                          },
                          icon: Icon(isInCart ? Icons.add : Icons.shopping_cart_outlined),
                          label: Text(isInCart ? 'Add Another' : 'Add To Cart'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Related Services',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  related.when(
                    data: (items) {
                      if (items.isEmpty) {
                        return Text(
                          'No other related services were found yet.',
                          style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
                        );
                      }

                      return Column(
                        children: items
                            .map(
                              (item) => Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: _RelatedCard(service: item),
                              ),
                            )
                            .toList(),
                      );
                    },
                    loading: () => const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: CircularProgressIndicator(),
                    ),
                    error: (_, __) => const SizedBox.shrink(),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white70, size: 16),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(color: Colors.white)),
        ],
      ),
    );
  }
}

class _RelatedCard extends StatelessWidget {
  final ServiceOfferingModel service;

  const _RelatedCard({required this.service});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.push('/services/${service.id}'),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    service.serviceName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${service.providerName} · ${service.durationLabel}',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.6),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Text(
              service.priceLabel,
              style: const TextStyle(
                color: Color(0xFF67E8F9),
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
