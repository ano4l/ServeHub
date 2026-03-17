import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';

final _providerDetailProvider = FutureProvider.family<Map<String, dynamic>, int>((ref, id) async {
  final dio = ref.read(dioProvider);
  final response = await dio.get('/providers/$id');
  return response.data as Map<String, dynamic>;
});

final _providerReviewsProvider = FutureProvider.family<List<dynamic>, int>((ref, providerId) async {
  final dio = ref.read(dioProvider);
  try {
    final response = await dio.get('/providers/$providerId/reviews', queryParameters: {'size': 20});
    if (response.data is List) return response.data as List;
    if (response.data is Map && response.data['content'] != null) {
      return response.data['content'] as List;
    }
    return [];
  } catch (_) {
    return [];
  }
});

final _providerServicesProvider = FutureProvider.family<List<dynamic>, int>((ref, userId) async {
  final dio = ref.read(dioProvider);
  try {
    final response = await dio.get('/catalog/services', queryParameters: {'providerId': userId, 'size': 20});
    if (response.data is List) return response.data as List;
    if (response.data is Map && response.data['content'] != null) {
      return response.data['content'] as List;
    }
    return [];
  } catch (_) {
    return [];
  }
});

class ProviderDetailScreen extends ConsumerWidget {
  final int providerId;
  const ProviderDetailScreen({super.key, required this.providerId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final providerAsync = ref.watch(_providerDetailProvider(providerId));

    return Scaffold(
      body: providerAsync.when(
        data: (provider) => _ProviderDetailContent(provider: provider, providerId: providerId),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load provider: $e')),
      ),
    );
  }
}

class _ProviderDetailContent extends ConsumerWidget {
  final Map<String, dynamic> provider;
  final int providerId;
  const _ProviderDetailContent({required this.provider, required this.providerId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final name = provider['fullName']?.toString() ?? 'Provider';
    final city = provider['city']?.toString() ?? '';
    final bio = provider['bio']?.toString() ?? '';
    final rating = provider['averageRating']?.toString() ?? '0';
    final reviewCount = provider['reviewCount'] ?? 0;
    final verified = provider['verificationStatus']?.toString() == 'VERIFIED';
    final userId = provider['userId'] as int? ?? providerId;
    final reviews = ref.watch(_providerReviewsProvider(providerId));
    final services = ref.watch(_providerServicesProvider(userId));

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 200,
          pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF0D2847), Color(0xFF1A1040)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 40),
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: Colors.white24,
                      child: Text(
                        name.isNotEmpty ? name[0].toUpperCase() : '?',
                        style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(name, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                        if (verified) ...[
                          const SizedBox(width: 6),
                          const Icon(Icons.verified, color: Colors.white, size: 20),
                        ],
                      ],
                    ),
                    if (city.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.location_on, color: Colors.white70, size: 14),
                            const SizedBox(width: 4),
                            Text(city, style: const TextStyle(color: Colors.white70, fontSize: 14)),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),

        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Rating summary
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _StatItem(label: 'Rating', value: rating, icon: Icons.star, color: Colors.amber),
                        Container(height: 40, width: 1, color: AppColors.border),
                        _StatItem(label: 'Reviews', value: '$reviewCount', icon: Icons.rate_review_outlined, color: AppColors.info),
                        Container(height: 40, width: 1, color: AppColors.border),
                        _StatItem(
                          label: 'Status',
                          value: verified ? 'Verified' : 'Pending',
                          icon: verified ? Icons.verified_user : Icons.hourglass_empty,
                          color: verified ? AppColors.success : AppColors.warning,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Bio
                if (bio.isNotEmpty) ...[
                  Text('About', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text(bio, style: const TextStyle(color: AppColors.textSecondary, height: 1.5)),
                  const SizedBox(height: 20),
                ],

                // Services
                Text('Services', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                services.when(
                  data: (list) => list.isEmpty
                      ? const Text('No services listed yet', style: TextStyle(color: AppColors.textMuted))
                      : Column(children: list.map((s) => _ServiceTile(service: s, providerId: providerId)).toList()),
                  loading: () => const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator())),
                  error: (_, __) => const Text('Failed to load services'),
                ),
                const SizedBox(height: 20),

                // Reviews
                Text('Reviews', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                reviews.when(
                  data: (list) => list.isEmpty
                      ? const Text('No reviews yet', style: TextStyle(color: AppColors.textMuted))
                      : Column(children: list.map((r) => _ReviewCard(review: r)).toList()),
                  loading: () => const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator())),
                  error: (_, __) => const Text('Failed to load reviews'),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  const _StatItem({required this.label, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
      ],
    );
  }
}

class _ServiceTile extends StatelessWidget {
  final dynamic service;
  final int providerId;
  const _ServiceTile({required this.service, required this.providerId});

  @override
  Widget build(BuildContext context) {
    final name = service['title']?.toString() ?? service['name']?.toString() ?? 'Service';
    final price = service['basePrice']?.toString() ?? '';
    final serviceId = service['id'];

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          width: 40, height: 40,
          decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(10)),
          child: Icon(Icons.miscellaneous_services_outlined, color: AppColors.accent, size: 20),
        ),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
        trailing: price.isNotEmpty
            ? Text('R$price', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.accent))
            : null,
        onTap: () {
          if (serviceId != null) {
            context.push('/book?serviceId=$serviceId&providerId=$providerId');
          }
        },
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final dynamic review;
  const _ReviewCard({required this.review});

  @override
  Widget build(BuildContext context) {
    final rating = review['rating'] as int? ?? 0;
    final comment = review['comment']?.toString() ?? '';
    final customerName = review['customerName']?.toString() ?? 'Customer';
    final createdAt = review['createdAt']?.toString() ?? '';
    final providerResponse = review['providerResponse']?.toString();

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundColor: AppColors.divider,
                  child: Text(customerName.isNotEmpty ? customerName[0] : '?',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(customerName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                      Row(
                        children: List.generate(5, (i) => Icon(
                          i < rating ? Icons.star : Icons.star_border,
                          size: 14,
                          color: i < rating ? Colors.amber : AppColors.textMuted,
                        )),
                      ),
                    ],
                  ),
                ),
                if (createdAt.isNotEmpty)
                  Text(_formatDate(createdAt), style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ],
            ),
            if (comment.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(comment, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4)),
            ],
            if (providerResponse != null && providerResponse != 'null' && providerResponse.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.divider,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Provider Response', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: AppColors.textSecondary)),
                    const SizedBox(height: 4),
                    Text(providerResponse, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso);
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return '';
    }
  }
}
