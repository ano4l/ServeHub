import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/core/widgets/animations.dart';
import 'package:serveify/core/widgets/skeleton.dart';
import 'package:serveify/features/browse/data/categories_provider.dart';

final _servicesProvider = FutureProvider.family<List<dynamic>, String>((ref, query) async {
  // Demo mode - return rich dummy data
  return [
    {
      'id': '1',
      'name': 'Professional Home Cleaning',
      'title': 'Professional Home Cleaning',
      'description': 'Deep cleaning service for your entire home. Eco-friendly products, insured professionals. Kitchen, bathrooms, living areas - we handle it all!',
      'basePrice': 450.00,
      'providerName': 'Sarah Johnson',
      'categoryName': 'Cleaning',
      'durationMinutes': 120,
      'rating': 4.9,
      'reviews': 342,
      'verified': true,
      'images': ['cleaning1.jpg', 'cleaning2.jpg'],
      'tags': ['Eco-friendly', 'Insured', 'Same-day'],
      'availability': 'Available today',
      'responseTime': '15 min'
    },
    {
      'id': '2',
      'name': 'AC Installation & Repair',
      'title': 'AC Installation & Repair',
      'description': 'Expert HVAC services including installation, repair, and maintenance. Licensed technicians, 24/7 emergency service available.',
      'basePrice': 850.00,
      'providerName': 'Mike Chen HVAC',
      'categoryName': 'HVAC',
      'durationMinutes': 180,
      'rating': 4.8,
      'reviews': 287,
      'verified': true,
      'images': ['hvac1.jpg'],
      'tags': ['Licensed', '24/7 Emergency', 'Warranty'],
      'availability': 'Available tomorrow',
      'responseTime': '30 min'
    },
    {
      'id': '3',
      'name': 'Emergency Plumbing Services',
      'title': 'Emergency Plumbing Services',
      'description': 'Fast, reliable plumbing for emergencies and routine maintenance. Fix leaks, unclog drains, install fixtures. Licensed & insured.',
      'basePrice': 650.00,
      'providerName': 'David Williams',
      'categoryName': 'Plumbing',
      'durationMinutes': 90,
      'rating': 4.7,
      'reviews': 198,
      'verified': true,
      'images': ['plumbing1.jpg'],
      'tags': ['24/7 Emergency', 'Licensed', 'Insured'],
      'availability': 'Available now',
      'responseTime': '20 min'
    },
    {
      'id': '4',
      'name': 'Electrical Installation & Repair',
      'title': 'Electrical Installation & Repair',
      'description': 'Complete electrical services - panel upgrades, lighting installation, troubleshooting. Master electrician, fully insured.',
      'basePrice': 750.00,
      'providerName': 'Emma Rodriguez',
      'categoryName': 'Electrical',
      'durationMinutes': 120,
      'rating': 5.0,
      'reviews': 156,
      'verified': true,
      'images': ['electrical1.jpg'],
      'tags': ['Master Electrician', 'Permitted', 'Warranty'],
      'availability': 'Available this week',
      'responseTime': '10 min'
    },
    {
      'id': '5',
      'name': 'Interior & Exterior Painting',
      'title': 'Interior & Exterior Painting',
      'description': 'Professional painting services for homes and offices. Premium paints, detailed prep work, clean finish. Free estimates.',
      'basePrice': 1200.00,
      'providerName': 'James Taylor',
      'categoryName': 'Painting',
      'durationMinutes': 480,
      'rating': 4.6,
      'reviews': 89,
      'verified': false,
      'images': ['painting1.jpg', 'painting2.jpg'],
      'tags': ['Premium Paints', 'Free Estimate', 'Detail-oriented'],
      'availability': 'Next week',
      'responseTime': '45 min'
    },
    {
      'id': '6',
      'name': 'Garden Design & Landscaping',
      'title': 'Garden Design & Landscaping',
      'description': 'Transform your outdoor space with professional landscaping. Design, planting, hardscaping, maintenance services.',
      'basePrice': 950.00,
      'providerName': 'Lisa Green',
      'categoryName': 'Gardening',
      'durationMinutes': 240,
      'rating': 4.8,
      'reviews': 124,
      'verified': true,
      'images': ['garden1.jpg', 'garden2.jpg'],
      'tags': ['Design Expert', 'Sustainable', 'Maintenance'],
      'availability': 'Available this weekend',
      'responseTime': '25 min'
    },
    {
      'id': '7',
      'name': 'Custom Furniture Building',
      'title': 'Custom Furniture Building',
      'description': 'Handcrafted custom furniture for your home. Tables, chairs, cabinets, built-ins. Quality materials, expert craftsmanship.',
      'basePrice': 1500.00,
      'providerName': 'Robert Wood',
      'categoryName': 'Carpentry',
      'durationMinutes': 600,
      'rating': 4.9,
      'reviews': 67,
      'verified': true,
      'images': ['carpentry1.jpg'],
      'tags': ['Custom Design', 'Quality Materials', 'Artisan'],
      'availability': '2 weeks',
      'responseTime': '2 hours'
    },
    {
      'id': '8',
      'name': 'Smart Home Installation',
      'title': 'Smart Home Installation',
      'description': 'Complete smart home setup - lighting, thermostats, security, entertainment systems. Integration with all major platforms.',
      'basePrice': 1100.00,
      'providerName': 'Tech Solutions Pro',
      'categoryName': 'Electrical',
      'durationMinutes': 180,
      'rating': 4.7,
      'reviews': 93,
      'verified': true,
      'images': ['smart1.jpg'],
      'tags': ['Smart Home', 'Integration', 'Support'],
      'availability': 'Available this week',
      'responseTime': '1 hour'
    }
  ];
});

final _providersProvider = FutureProvider<List<dynamic>>((ref) async {
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
      'avatar': 'SJ',
      'badge': 'Top Rated',
      'online': true
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
      'avatar': 'MC',
      'badge': 'Pro',
      'online': true
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
      'avatar': 'DW',
      'badge': 'Fast Response',
      'online': false
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
      'avatar': 'ER',
      'badge': 'Master',
      'online': true
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
      'avatar': 'JT',
      'badge': null,
      'online': false
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
      'avatar': 'LG',
      'badge': 'Eco-Friendly',
      'online': true
    }
  ];
});

// Pastel colors for provider avatar rings
const _avatarColors = [
  AppColors.pastelPurple,
  AppColors.pastelBlue,
  AppColors.pastelGreen,
  AppColors.pastelPink,
  AppColors.pastelOrange,
  AppColors.pastelMint,
];

// Pastel colors for service post banners
const _bannerColors = [
  Color(0xFFE8DEF8),
  Color(0xFFDCE8F5),
  Color(0xFFDAEFD8),
  Color(0xFFFFF3D4),
  Color(0xFFFADDE1),
  Color(0xFFD0F0E0),
  Color(0xFFD4F1F9),
  Color(0xFFFFE4CC),
];

class BrowseScreen extends ConsumerStatefulWidget {
  const BrowseScreen({super.key});

  @override
  ConsumerState<BrowseScreen> createState() => _BrowseScreenState();
}

class _BrowseScreenState extends ConsumerState<BrowseScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedCategory = 'All';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final services = ref.watch(_servicesProvider(_searchQuery));
    final providers = ref.watch(_providersProvider);
    final categories = ref.watch(categoriesProvider);

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
                    Text('Explore', style: Theme.of(context).textTheme.headlineMedium),
                    const SizedBox(height: 16),

                    // Search bar
                    TextField(
                      controller: _searchController,
                      onChanged: (v) => setState(() => _searchQuery = v),
                      style: const TextStyle(fontSize: 15),
                      decoration: InputDecoration(
                        hintText: 'Search services, providers...',
                        prefixIcon: const Icon(Icons.search_rounded, size: 22),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.close_rounded, size: 20),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() => _searchQuery = '');
                                },
                              )
                            : null,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Provider stories row (Instagram-style)
          SliverToBoxAdapter(
            child: SizedBox(
              height: 120,
              child: providers.when(
                data: (list) => ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.fromLTRB(20, 18, 8, 0),
                  itemCount: list.length,
                  itemBuilder: (_, i) {
                    final p = list[i];
                    final name = p['fullName']?.toString() ?? p['userName']?.toString() ?? 'Pro';
                    final id = p['id'];
                    final firstName = name.split(' ').first;
                    final avatar = p['avatar']?.toString() ?? name.isNotEmpty ? name[0].toUpperCase() : '?';
                    final badge = p['badge']?.toString();
                    final online = p['online'] == true;
                    final rating = p['rating']?.toDouble() ?? 0.0;
                    final responseTime = p['responseTime']?.toString() ?? '';
                    
                    return Pressable(
                      onTap: () { if (id != null) context.push('/providers/$id'); },
                      child: Padding(
                        padding: const EdgeInsets.only(right: 16),
                        child: Column(
                          children: [
                            // Avatar with online indicator
                            Stack(
                              children: [
                                Container(
                                  width: 72,
                                  height: 72,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: _avatarColors[i % _avatarColors.length],
                                      width: 3,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: _avatarColors[i % _avatarColors.length].withValues(alpha: 0.3),
                                        blurRadius: 8,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Center(
                                    child: Container(
                                      width: 64,
                                      height: 64,
                                      decoration: BoxDecoration(
                                        color: _avatarColors[i % _avatarColors.length].withValues(alpha: 0.4),
                                        shape: BoxShape.circle,
                                      ),
                                      child: Center(
                                        child: Text(
                                          avatar,
                                          style: TextStyle(
                                            fontWeight: FontWeight.w800,
                                            fontSize: 22,
                                            color: AppColors.textPrimary.withValues(alpha: 0.8),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                // Online indicator
                                if (online)
                                  Positioned(
                                    bottom: 2,
                                    right: 2,
                                    child: Container(
                                      width: 18,
                                      height: 18,
                                      decoration: BoxDecoration(
                                        color: AppColors.success,
                                        shape: BoxShape.circle,
                                        border: Border.all(color: Colors.white, width: 3),
                                      ),
                                    ),
                                  ),
                                // Badge
                                if (badge != null)
                                  Positioned(
                                    top: -4,
                                    right: -4,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary,
                                        borderRadius: BorderRadius.circular(12),
                                        boxShadow: [
                                          BoxShadow(
                                            color: AppColors.primary.withValues(alpha: 0.3),
                                            blurRadius: 6,
                                            offset: const Offset(0, 2),
                                          ),
                                        ],
                                      ),
                                      child: Text(
                                        badge,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 8,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            // Provider name
                            SizedBox(
                              width: 80,
                              child: Text(
                                firstName,
                                style: const TextStyle(
                                  fontSize: 12, 
                                  fontWeight: FontWeight.w700
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.center,
                              ),
                            ),
                            // Rating and response time
                            if (rating > 0)
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.star_rounded, 
                                    color: Colors.amber, 
                                    size: 10
                                  ),
                                  const SizedBox(width: 2),
                                  Text(
                                    rating.toStringAsFixed(1),
                                    style: const TextStyle(
                                      color: AppColors.textSecondary, 
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600
                                    ),
                                  ),
                                ],
                              ),
                            if (responseTime.isNotEmpty)
                              Text(
                                responseTime,
                                style: const TextStyle(
                                  color: AppColors.textMuted, 
                                  fontSize: 9
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                loading: () => const SizedBox(
                  height: 120,
                  child: BrowseSkeleton(),
                ),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ),
          ),

          // Category filter chips
          SliverToBoxAdapter(
            child: SizedBox(
              height: 48,
              child: categories.when(
                data: (cats) {
                  final allCats = ['All', ...cats.map((c) => c.name)];
                  return ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: allCats.length,
                    itemBuilder: (_, i) {
                      final cat = allCats[i];
                      final selected = cat == _selectedCategory;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedCategory = cat),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                            decoration: BoxDecoration(
                              color: selected ? AppColors.primary : AppColors.surface,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Text(
                              cat,
                              style: TextStyle(
                                color: selected ? Colors.white : AppColors.textSecondary,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
                loading: () => const SizedBox(
                  height: 48,
                  child: BrowseSkeleton(),
                ),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ),
          ),

          // Services feed (social media post style)
          services.when(
            data: (list) {
              final filtered = _selectedCategory == 'All'
                  ? list
                  : list.where((s) =>
                      (s['categoryName']?.toString() ?? '').toLowerCase() == _selectedCategory.toLowerCase()
                    ).toList();

              if (filtered.isEmpty) {
                return SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(48),
                    child: Column(
                      children: [
                        Container(
                          width: 64, height: 64,
                          decoration: BoxDecoration(
                            color: AppColors.surfaceAlt,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(Icons.search_off_rounded, color: AppColors.textMuted, size: 28),
                        ),
                        const SizedBox(height: 16),
                        const Text('No services found', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                        const SizedBox(height: 4),
                        const Text('Try a different search or category', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                      ],
                    ),
                  ),
                );
              }

              return SliverList(
                delegate: SliverChildBuilderDelegate(
                  (_, i) => FadeIn(
                    delay: Duration(milliseconds: i * 30),
                    child: _ServicePost(service: filtered[i], index: i),
                  ),
                  childCount: filtered.length,
                ),
              );
            },
            loading: () => const SliverToBoxAdapter(
              child: BrowseSkeleton(),
            ),
            error: (_, __) => const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(48),
                child: Center(child: Text('Something went wrong')),
              ),
            ),
          ),
          // Bottom padding
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }
}

class _PostAction extends StatelessWidget {
  final IconData icon;
  final String label;
  const _PostAction({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w500)),
      ],
    );
  }
}

// --- Service Post (Instagram-style card) ---
class _ServicePost extends StatelessWidget {
  final dynamic service;
  final int index;
  const _ServicePost({required this.service, required this.index});

  @override
  Widget build(BuildContext context) {
    final name = service['name']?.toString() ?? service['title']?.toString() ?? 'Service';
    final description = service['description']?.toString() ?? '';
    final price = service['basePrice'];
    final priceStr = price != null ? 'R${double.tryParse(price.toString())?.toStringAsFixed(0) ?? price}' : '';
    final provider = service['providerName']?.toString() ?? 'Business';
    final category = service['categoryName']?.toString() ?? '';
    final duration = service['durationMinutes'];
    final durationStr = duration != null ? '${duration}min' : '';
    final rating = service['rating']?.toDouble() ?? 0.0;
    final reviews = service['reviews']?.toInt() ?? 0;
    final verified = service['verified'] == true;
    final availability = service['availability']?.toString() ?? '';
    final tags = service['tags'] as List<dynamic>? ?? [];
    final bannerColor = _bannerColors[index % _bannerColors.length];

    return Pressable(
      onTap: () {},
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 20,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Banner image placeholder with icon and gradient overlay
              Container(
                height: 200,
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      bannerColor,
                      bannerColor.withValues(alpha: 0.7),
                    ],
                  ),
                ),
                child: Stack(
                  children: [
                    // Center icon
                    Center(
                      child: Icon(
                        _serviceIcon(category),
                        size: 64,
                        color: Colors.white.withValues(alpha: 0.3),
                      ),
                    ),
                    // Price tag
                    if (priceStr.isNotEmpty)
                      Positioned(
                        top: 16,
                        right: 16,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.95),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Text(
                            priceStr,
                            style: const TextStyle(
                              fontWeight: FontWeight.w800, 
                              fontSize: 16, 
                              color: AppColors.textPrimary
                            ),
                          ),
                        ),
                      ),
                    // Category tag
                    if (category.isNotEmpty)
                      Positioned(
                        top: 16,
                        left: 16,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.9),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            category,
                            style: const TextStyle(
                              fontSize: 12, 
                              fontWeight: FontWeight.w700, 
                              color: AppColors.textSecondary
                            ),
                          ),
                        ),
                      ),
                    // Availability badge
                    if (availability.isNotEmpty)
                      Positioned(
                        bottom: 16,
                        left: 16,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.success,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            availability,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),

              // Post content
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Provider info row with rating
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
                              provider.isNotEmpty ? provider.substring(0, 2).toUpperCase() : '??',
                              style: const TextStyle(
                                color: AppColors.accent, 
                                fontWeight: FontWeight.w700, 
                                fontSize: 16
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
                                  Text(
                                    provider,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700, 
                                      fontSize: 15
                                    ),
                                  ),
                                  if (verified) ...[
                                    const SizedBox(width: 4),
                                    const Icon(
                                      Icons.verified_rounded, 
                                      color: AppColors.primary, 
                                      size: 16
                                    ),
                                  ],
                                ],
                              ),
                              if (durationStr.isNotEmpty)
                                Text(
                                  durationStr,
                                  style: const TextStyle(
                                    color: AppColors.textMuted, 
                                    fontSize: 12
                                  ),
                                ),
                            ],
                          ),
                        ),
                        // Rating
                        Column(
                          children: [
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.star_rounded, 
                                  color: Colors.amber, 
                                  size: 16
                                ),
                                const SizedBox(width: 2),
                                Text(
                                  rating.toStringAsFixed(1),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700, 
                                    fontSize: 14
                                  ),
                                ),
                              ],
                            ),
                            Text(
                              '($reviews)',
                              style: const TextStyle(
                                color: AppColors.textMuted, 
                                fontSize: 11
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Service name
                    Text(
                      name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800, 
                        fontSize: 18, 
                        color: AppColors.textPrimary
                      ),
                    ),
                    if (description.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.textSecondary, 
                          fontSize: 14, 
                          height: 1.4
                        ),
                      ),
                    ],
                    
                    // Tags
                    if (tags.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        children: tags.take(3).map((tag) => Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceAlt,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            tag.toString(),
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        )).toList(),
                      ),
                    ],
                    
                    const SizedBox(height: 16),

                    // Action row
                    Row(
                      children: [
                        LikeButton(
                          isLiked: false,
                          onTap: () {},
                          count: 12 + index * 3,
                        ),
                        const SizedBox(width: 20),
                        _PostAction(icon: Icons.chat_bubble_outline_rounded, label: '${2 + index}'),
                        const SizedBox(width: 20),
                        _PostAction(icon: Icons.share_outlined, label: 'Share'),
                        const Spacer(),
                        Pressable(
                          onTap: () => context.push('/book?serviceId=${service['id']}'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(14),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withValues(alpha: 0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Text(
                              'Book Now',
                              style: TextStyle(
                                color: Colors.white, 
                                fontWeight: FontWeight.w700, 
                                fontSize: 14
                              ),
                            ),
                          ),
                        ),
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

  IconData _serviceIcon(String category) {
    return switch (category.toLowerCase()) {
      'plumbing' => Icons.water_drop_rounded,
      'electrical' => Icons.bolt_rounded,
      'cleaning' => Icons.cleaning_services_rounded,
      'gardening' => Icons.yard_rounded,
      'painting' => Icons.format_paint_rounded,
      'carpentry' => Icons.handyman_rounded,
      _ => Icons.home_repair_service_rounded,
    };
  }
}
