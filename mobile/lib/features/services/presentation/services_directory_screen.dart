import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

// ─── Service directory data (100 services, 11 categories) ───

class ServiceCategory {
  final String id;
  final String name;
  final String emoji;
  final IconData icon;
  final Color color;
  final List<ServiceItem> services;

  const ServiceCategory({
    required this.id,
    required this.name,
    required this.emoji,
    required this.icon,
    required this.color,
    required this.services,
  });
}

class ServiceItem {
  final int id;
  final String name;
  final String categoryId;
  final bool popular;
  final String imageUrl;
  final String description;
  final String priceRange;
  final String duration;
  final double rating;

  const ServiceItem({
    required this.id,
    required this.name,
    required this.categoryId,
    this.popular = false,
    this.imageUrl = '',
    this.description = '',
    this.priceRange = 'R150 – R500',
    this.duration = '1–2 hrs',
    this.rating = 4.7,
  });
}

final List<ServiceCategory> kServiceCategories = [
  ServiceCategory(
    id: 'home-repair', name: 'Home Repair', emoji: '🔧', icon: Icons.build_rounded, color: const Color(0xFF3B82F6),
    services: const [
      ServiceItem(id: 1, name: 'Plumbing', categoryId: 'home-repair', popular: true),
      ServiceItem(id: 2, name: 'Emergency plumber', categoryId: 'home-repair', popular: true),
      ServiceItem(id: 3, name: 'Electrical repairs', categoryId: 'home-repair', popular: true),
      ServiceItem(id: 4, name: 'Appliance repair', categoryId: 'home-repair'),
      ServiceItem(id: 5, name: 'Refrigerator repair', categoryId: 'home-repair'),
      ServiceItem(id: 6, name: 'Washing machine repair', categoryId: 'home-repair'),
      ServiceItem(id: 7, name: 'Dishwasher repair', categoryId: 'home-repair'),
      ServiceItem(id: 8, name: 'Air conditioner repair', categoryId: 'home-repair'),
      ServiceItem(id: 9, name: 'Air conditioner installation', categoryId: 'home-repair'),
      ServiceItem(id: 10, name: 'Geyser repair', categoryId: 'home-repair', popular: true),
      ServiceItem(id: 11, name: 'Geyser installation', categoryId: 'home-repair'),
      ServiceItem(id: 12, name: 'Locksmith', categoryId: 'home-repair'),
      ServiceItem(id: 13, name: 'Emergency locksmith', categoryId: 'home-repair'),
      ServiceItem(id: 14, name: 'Glass repair', categoryId: 'home-repair'),
      ServiceItem(id: 15, name: 'Window installation', categoryId: 'home-repair'),
      ServiceItem(id: 16, name: 'Door installation', categoryId: 'home-repair'),
      ServiceItem(id: 17, name: 'Carpentry', categoryId: 'home-repair'),
      ServiceItem(id: 18, name: 'Furniture assembly', categoryId: 'home-repair'),
      ServiceItem(id: 19, name: 'Furniture repair', categoryId: 'home-repair'),
      ServiceItem(id: 20, name: 'Handyman services', categoryId: 'home-repair', popular: true),
    ],
  ),
  ServiceCategory(
    id: 'cleaning', name: 'Cleaning', emoji: '🧹', icon: Icons.cleaning_services_rounded, color: const Color(0xFF10B981),
    services: const [
      ServiceItem(id: 21, name: 'House cleaning', categoryId: 'cleaning', popular: true),
      ServiceItem(id: 22, name: 'Deep cleaning', categoryId: 'cleaning', popular: true),
      ServiceItem(id: 23, name: 'Carpet cleaning', categoryId: 'cleaning'),
      ServiceItem(id: 24, name: 'Mattress cleaning', categoryId: 'cleaning'),
      ServiceItem(id: 25, name: 'Couch cleaning', categoryId: 'cleaning'),
      ServiceItem(id: 26, name: 'Window cleaning', categoryId: 'cleaning'),
      ServiceItem(id: 27, name: 'Office cleaning', categoryId: 'cleaning'),
      ServiceItem(id: 28, name: 'Post-construction cleaning', categoryId: 'cleaning'),
      ServiceItem(id: 29, name: 'Garden cleaning', categoryId: 'cleaning'),
      ServiceItem(id: 30, name: 'Waste removal', categoryId: 'cleaning'),
    ],
  ),
  ServiceCategory(
    id: 'outdoor', name: 'Outdoor & Garden', emoji: '🌿', icon: Icons.park_rounded, color: const Color(0xFF22C55E),
    services: const [
      ServiceItem(id: 31, name: 'Lawn mowing', categoryId: 'outdoor', popular: true),
      ServiceItem(id: 32, name: 'Garden maintenance', categoryId: 'outdoor', popular: true),
      ServiceItem(id: 33, name: 'Landscaping', categoryId: 'outdoor'),
      ServiceItem(id: 34, name: 'Tree cutting', categoryId: 'outdoor'),
      ServiceItem(id: 35, name: 'Tree trimming', categoryId: 'outdoor'),
      ServiceItem(id: 36, name: 'Irrigation system repair', categoryId: 'outdoor'),
      ServiceItem(id: 37, name: 'Borehole maintenance', categoryId: 'outdoor'),
      ServiceItem(id: 38, name: 'Pool cleaning', categoryId: 'outdoor', popular: true),
      ServiceItem(id: 39, name: 'Pool repair', categoryId: 'outdoor'),
      ServiceItem(id: 40, name: 'Pest control', categoryId: 'outdoor'),
    ],
  ),
  ServiceCategory(
    id: 'vehicle', name: 'Vehicle Services', emoji: '🚗', icon: Icons.directions_car_rounded, color: const Color(0xFFF97316),
    services: const [
      ServiceItem(id: 41, name: 'Mobile mechanic', categoryId: 'vehicle', popular: true),
      ServiceItem(id: 42, name: 'Car diagnostic', categoryId: 'vehicle'),
      ServiceItem(id: 43, name: 'Car battery replacement', categoryId: 'vehicle'),
      ServiceItem(id: 44, name: 'Mobile car wash', categoryId: 'vehicle', popular: true),
      ServiceItem(id: 45, name: 'Mobile car detailing', categoryId: 'vehicle'),
      ServiceItem(id: 46, name: 'Tyre replacement', categoryId: 'vehicle'),
      ServiceItem(id: 47, name: 'Tyre repair', categoryId: 'vehicle'),
      ServiceItem(id: 48, name: 'Vehicle towing', categoryId: 'vehicle'),
      ServiceItem(id: 49, name: 'Fuel delivery', categoryId: 'vehicle'),
      ServiceItem(id: 50, name: 'Car locksmith', categoryId: 'vehicle'),
    ],
  ),
  ServiceCategory(
    id: 'construction', name: 'Construction', emoji: '🧑‍🔧', icon: Icons.construction_rounded, color: const Color(0xFFEAB308),
    services: const [
      ServiceItem(id: 51, name: 'Painting', categoryId: 'construction', popular: true),
      ServiceItem(id: 52, name: 'Interior painting', categoryId: 'construction'),
      ServiceItem(id: 53, name: 'Exterior painting', categoryId: 'construction'),
      ServiceItem(id: 54, name: 'Tiling installation', categoryId: 'construction'),
      ServiceItem(id: 55, name: 'Floor installation', categoryId: 'construction'),
      ServiceItem(id: 56, name: 'Ceiling installation', categoryId: 'construction'),
      ServiceItem(id: 57, name: 'Drywall installation', categoryId: 'construction'),
      ServiceItem(id: 58, name: 'Roofing repair', categoryId: 'construction', popular: true),
      ServiceItem(id: 59, name: 'Waterproofing', categoryId: 'construction'),
      ServiceItem(id: 60, name: 'Building contractor', categoryId: 'construction'),
    ],
  ),
  ServiceCategory(
    id: 'tech', name: 'Tech & Digital', emoji: '🧑‍💻', icon: Icons.computer_rounded, color: const Color(0xFF8B5CF6),
    services: const [
      ServiceItem(id: 61, name: 'WiFi installation', categoryId: 'tech', popular: true),
      ServiceItem(id: 62, name: 'Router setup', categoryId: 'tech'),
      ServiceItem(id: 63, name: 'CCTV installation', categoryId: 'tech', popular: true),
      ServiceItem(id: 64, name: 'Alarm system installation', categoryId: 'tech'),
      ServiceItem(id: 65, name: 'Smart home setup', categoryId: 'tech'),
      ServiceItem(id: 66, name: 'Computer repair', categoryId: 'tech'),
      ServiceItem(id: 67, name: 'Laptop repair', categoryId: 'tech'),
      ServiceItem(id: 68, name: 'Printer repair', categoryId: 'tech'),
      ServiceItem(id: 69, name: 'Data recovery', categoryId: 'tech'),
      ServiceItem(id: 70, name: 'IT support', categoryId: 'tech'),
    ],
  ),
  ServiceCategory(
    id: 'personal', name: 'Personal & Lifestyle', emoji: '💇', icon: Icons.content_cut_rounded, color: const Color(0xFFEC4899),
    services: const [
      ServiceItem(id: 71, name: 'Barber (mobile haircut)', categoryId: 'personal', popular: true),
      ServiceItem(id: 72, name: 'Hair stylist', categoryId: 'personal', popular: true),
      ServiceItem(id: 73, name: 'Makeup artist', categoryId: 'personal'),
      ServiceItem(id: 74, name: 'Nail technician', categoryId: 'personal'),
      ServiceItem(id: 75, name: 'Massage therapist', categoryId: 'personal', popular: true),
      ServiceItem(id: 76, name: 'Personal trainer', categoryId: 'personal'),
      ServiceItem(id: 77, name: 'Yoga instructor', categoryId: 'personal'),
      ServiceItem(id: 78, name: 'Dietitian consultation', categoryId: 'personal'),
      ServiceItem(id: 79, name: 'Tattoo artist', categoryId: 'personal'),
      ServiceItem(id: 80, name: 'Photographer', categoryId: 'personal'),
    ],
  ),
  ServiceCategory(
    id: 'pet', name: 'Pet Services', emoji: '🐶', icon: Icons.pets_rounded, color: const Color(0xFFF59E0B),
    services: const [
      ServiceItem(id: 81, name: 'Pet grooming', categoryId: 'pet', popular: true),
      ServiceItem(id: 82, name: 'Dog walking', categoryId: 'pet', popular: true),
      ServiceItem(id: 83, name: 'Pet sitting', categoryId: 'pet'),
      ServiceItem(id: 84, name: 'Mobile vet', categoryId: 'pet'),
      ServiceItem(id: 85, name: 'Pet training', categoryId: 'pet'),
    ],
  ),
  ServiceCategory(
    id: 'moving', name: 'Moving & Delivery', emoji: '📦', icon: Icons.local_shipping_rounded, color: const Color(0xFF0EA5E9),
    services: const [
      ServiceItem(id: 86, name: 'Moving services', categoryId: 'moving', popular: true),
      ServiceItem(id: 87, name: 'Furniture moving', categoryId: 'moving'),
      ServiceItem(id: 88, name: 'Small parcel delivery', categoryId: 'moving'),
      ServiceItem(id: 89, name: 'Courier service', categoryId: 'moving', popular: true),
      ServiceItem(id: 90, name: 'Grocery delivery', categoryId: 'moving'),
    ],
  ),
  ServiceCategory(
    id: 'business', name: 'Business & Professional', emoji: '🏢', icon: Icons.business_center_rounded, color: const Color(0xFF64748B),
    services: const [
      ServiceItem(id: 91, name: 'Accountant', categoryId: 'business'),
      ServiceItem(id: 92, name: 'Tax consultant', categoryId: 'business'),
      ServiceItem(id: 93, name: 'Legal consultation', categoryId: 'business'),
      ServiceItem(id: 94, name: 'Business consultant', categoryId: 'business'),
      ServiceItem(id: 95, name: 'Marketing consultant', categoryId: 'business'),
    ],
  ),
  ServiceCategory(
    id: 'emergency', name: 'Emergency', emoji: '⚡', icon: Icons.flash_on_rounded, color: const Color(0xFFEF4444),
    services: const [
      ServiceItem(id: 96, name: 'Emergency electrician', categoryId: 'emergency', popular: true),
      ServiceItem(id: 97, name: 'Emergency plumber', categoryId: 'emergency', popular: true),
      ServiceItem(id: 98, name: 'Emergency locksmith', categoryId: 'emergency'),
      ServiceItem(id: 99, name: 'Roadside assistance', categoryId: 'emergency', popular: true),
      ServiceItem(id: 100, name: 'Emergency generator repair', categoryId: 'emergency'),
    ],
  ),
];

final List<ServiceItem> kAllServices = kServiceCategories.expand((c) => c.services).toList();
final List<ServiceItem> kPopularServices = kAllServices.where((s) => s.popular).toList();

// ─── Screen ───

class ServicesDirectoryScreen extends StatefulWidget {
  const ServicesDirectoryScreen({super.key});

  @override
  State<ServicesDirectoryScreen> createState() => _ServicesDirectoryScreenState();
}

class _ServicesDirectoryScreenState extends State<ServicesDirectoryScreen> {
  String _query = '';
  String? _selectedCategoryId;
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();

  List<ServiceItem> get _filteredServices {
    final q = _query.trim().toLowerCase();
    List<ServiceItem> results = _selectedCategoryId != null
        ? kAllServices.where((s) => s.categoryId == _selectedCategoryId).toList()
        : kAllServices;
    if (q.isNotEmpty) {
      results = results.where((s) {
        final cat = kServiceCategories.firstWhere((c) => c.id == s.categoryId);
        return s.name.toLowerCase().contains(q) || cat.name.toLowerCase().contains(q);
      }).toList();
    }
    return results;
  }

  ServiceCategory? get _selectedCategory =>
      _selectedCategoryId != null ? kServiceCategories.firstWhere((c) => c.id == _selectedCategoryId, orElse: () => kServiceCategories.first) : null;

  bool get _showCategoryGrid => _query.isEmpty && _selectedCategoryId == null;

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _selectCategory(String? id) {
    setState(() {
      _selectedCategoryId = id;
      _query = '';
      _searchController.clear();
    });
  }

  void _tapService(ServiceItem service) {
    context.push('/services/${service.id}');
  }

  @override
  Widget build(BuildContext context) {
    const bg = Color(0xFF07111F);
    return Scaffold(
      backgroundColor: bg,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // ─── Sticky header ───
            Container(
              color: bg.withValues(alpha: 0.95),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: Row(
                      children: [
                        if (_selectedCategoryId != null)
                          GestureDetector(
                            onTap: () => _selectCategory(null),
                            child: Container(
                              width: 40, height: 40,
                              margin: const EdgeInsets.only(right: 10),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Icon(Icons.arrow_back_rounded, color: Colors.white70, size: 20),
                            ),
                          ),
                        Expanded(
                          child: Container(
                            height: 48,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                            ),
                            child: TextField(
                              controller: _searchController,
                              onChanged: (v) => setState(() => _query = v),
                              style: const TextStyle(color: Colors.white, fontSize: 15),
                              decoration: InputDecoration(
                                hintText: _selectedCategory != null
                                    ? 'Search ${_selectedCategory!.name}…'
                                    : 'Search all 100 services…',
                                hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
                                prefixIcon: Icon(Icons.search_rounded, color: Colors.white.withValues(alpha: 0.4)),
                                suffixIcon: _query.isNotEmpty
                                    ? IconButton(
                                        icon: Icon(Icons.close_rounded, color: Colors.white.withValues(alpha: 0.4), size: 18),
                                        onPressed: () {
                                          _searchController.clear();
                                          setState(() => _query = '');
                                        },
                                      )
                                    : null,
                                border: InputBorder.none,
                                contentPadding: const EdgeInsets.symmetric(vertical: 14),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  // Horizontal category chips
                  SizedBox(
                    height: 36,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      children: [
                        _Chip(
                          label: 'All',
                          selected: _selectedCategoryId == null,
                          onTap: () => _selectCategory(null),
                        ),
                        ...kServiceCategories.map((cat) => Padding(
                          padding: const EdgeInsets.only(left: 8),
                          child: _Chip(
                            label: cat.emoji,
                            selected: _selectedCategoryId == cat.id,
                            onTap: () => _selectCategory(cat.id),
                          ),
                        )),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Divider(height: 1, color: Colors.white.withValues(alpha: 0.06)),
                ],
              ),
            ),

            // ─── Content ───
            Expanded(
              child: _showCategoryGrid
                  ? _buildCategoryGridView()
                  : _buildFilteredListView(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryGridView() {
    return ListView(
      controller: _scrollController,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        // Popular services
        Row(
          children: [
            const Icon(Icons.flash_on_rounded, color: Color(0xFFFBBF24), size: 18),
            const SizedBox(width: 6),
            Text('Popular right now', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white)),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: kPopularServices.take(9).map((s) => _ServiceChipButton(
            service: s,
            onTap: () => _tapService(s),
          )).toList(),
        ),
        const SizedBox(height: 28),
        // All categories
        Text('All categories', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white)),
        const SizedBox(height: 2),
        Text(
          '${kServiceCategories.length} categories · ${kAllServices.length} services',
          style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.4)),
        ),
        const SizedBox(height: 14),
        ...kServiceCategories.map((cat) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: _CategoryRow(category: cat, onTap: () => _selectCategory(cat.id)),
        )),
      ],
    );
  }

  Widget _buildFilteredListView() {
    final items = _filteredServices;
    final cat = _selectedCategory;

    return ListView(
      controller: _scrollController,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        if (cat != null) ...[
          Row(
            children: [
              Text(cat.emoji, style: const TextStyle(fontSize: 28)),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(cat.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Colors.white)),
                  Text('${cat.services.length} services', style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.4))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
        if (_query.isNotEmpty && _selectedCategoryId == null)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              '${items.length} result${items.length == 1 ? '' : 's'} for "$_query"',
              style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.4)),
            ),
          ),
        if (items.isEmpty)
          _EmptyState(query: _query, onClear: () {
            _searchController.clear();
            setState(() => _query = '');
          })
        else
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: items.map((s) => _ServiceChipButton(
              service: s,
              onTap: () => _tapService(s),
            )).toList(),
          ),
      ],
    );
  }
}

// ─── Chip ───
class _Chip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _Chip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? Colors.white : Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(20),
          border: selected ? null : Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: selected ? const Color(0xFF07111F) : Colors.white.withValues(alpha: 0.6),
          ),
        ),
      ),
    );
  }
}

// ─── Service chip button ───
class _ServiceChipButton extends StatelessWidget {
  final ServiceItem service;
  final VoidCallback onTap;

  const _ServiceChipButton({required this.service, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cat = kServiceCategories.firstWhere((c) => c.id == service.categoryId);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (service.popular) ...[
              const Icon(Icons.star_rounded, color: Color(0xFFFBBF24), size: 14),
              const SizedBox(width: 4),
            ],
            Flexible(
              child: Text(
                service.name,
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Colors.white.withValues(alpha: 0.9)),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 6),
            Text(cat.emoji, style: const TextStyle(fontSize: 12)),
          ],
        ),
      ),
    );
  }
}

// ─── Category row ───
class _CategoryRow extends StatelessWidget {
  final ServiceCategory category;
  final VoidCallback onTap;

  const _CategoryRow({required this.category, required this.onTap});

  @override
  Widget build(BuildContext context) {
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
              width: 48, height: 48,
              decoration: BoxDecoration(
                color: category.color.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Center(child: Text(category.emoji, style: const TextStyle(fontSize: 22))),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(category.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: Colors.white)),
                  Text('${category.services.length} services', style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.4))),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: Colors.white.withValues(alpha: 0.25)),
          ],
        ),
      ),
    );
  }
}

// ─── Empty state ───
class _EmptyState extends StatelessWidget {
  final String query;
  final VoidCallback onClear;

  const _EmptyState({required this.query, required this.onClear});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 48),
        child: Column(
          children: [
            Container(
              width: 64, height: 64,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.06),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.search_rounded, color: Colors.white.withValues(alpha: 0.25), size: 28),
            ),
            const SizedBox(height: 16),
            Text('No services found', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.6))),
            const SizedBox(height: 4),
            Text('No match for "$query"', style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.3))),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: onClear,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text('Clear search', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.7))),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
