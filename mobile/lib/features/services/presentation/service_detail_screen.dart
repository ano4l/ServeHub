import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/features/services/providers/cart_provider.dart';
import 'package:serveify/features/services/presentation/services_directory_screen.dart'
    as dir;

const _kMockReviews = [
  {'name': 'Thandi M.', 'avatar': 'TM', 'rating': 5, 'date': '2 days ago', 'text': 'Absolutely fantastic service! Arrived on time, very professional, and left everything spotless.'},
  {'name': 'James K.', 'avatar': 'JK', 'rating': 5, 'date': '1 week ago', 'text': 'Great communication from start to finish. Fair pricing and quality work. Highly recommended!'},
  {'name': 'Priya N.', 'avatar': 'PN', 'rating': 4, 'date': '2 weeks ago', 'text': 'Good service overall. The provider was friendly and efficient. Only minor issue was a slight delay.'},
  {'name': 'David L.', 'avatar': 'DL', 'rating': 5, 'date': '3 weeks ago', 'text': 'This is my third time using this service and it never disappoints. Consistent quality every time.'},
  {'name': 'Sarah B.', 'avatar': 'SB', 'rating': 4, 'date': '1 month ago', 'text': 'Very happy with the result. The provider went above and beyond what I expected.'},
];

const _kFaqs = [
  {'q': 'How does pricing work?', 'a': 'Pricing is based on scope of work. You\'ll receive a firm quote before work begins.'},
  {'q': 'Can I cancel or reschedule?', 'a': 'Free cancellation up to 2 hours before. Rescheduling is always free.'},
  {'q': 'Are providers verified?', 'a': 'All providers go through ID verification, background checks, and skills assessment.'},
  {'q': 'What if I\'m not satisfied?', 'a': 'We offer a satisfaction guarantee. We\'ll resolve it or offer a refund.'},
];

class ServiceDetailScreen extends ConsumerStatefulWidget {
  final int serviceId;
  const ServiceDetailScreen({super.key, required this.serviceId});

  @override
  ConsumerState<ServiceDetailScreen> createState() => _ServiceDetailScreenState();
}

class _ServiceDetailScreenState extends ConsumerState<ServiceDetailScreen> {
  bool _liked = false;
  bool _addedFeedback = false;
  int? _expandedFaq;
  bool _showAllReviews = false;

  dir.ServiceItem? get _service {
    try {
      return dir.kAllServices.firstWhere((s) => s.id == widget.serviceId);
    } catch (_) {
      return null;
    }
  }

  dir.ServiceCategory? get _category {
    final s = _service;
    if (s == null) return null;
    try {
      return dir.kServiceCategories.firstWhere((c) => c.id == s.categoryId);
    } catch (_) {
      return null;
    }
  }

  List<dir.ServiceItem> get _relatedServices {
    final s = _service;
    if (s == null) return [];
    return dir.kAllServices
        .where((r) => r.categoryId == s.categoryId && r.id != s.id)
        .take(6)
        .toList();
  }

  void _handleAddToCart() {
    final s = _service;
    if (s == null) return;

    ref.read(cartProvider.notifier).addItem(ServiceItem(
      id: s.id,
      name: s.name,
      categoryId: s.categoryId,
      imageUrl: s.imageUrl,
      description: s.description,
      priceRange: s.priceRange,
      duration: s.duration,
      rating: s.rating,
      popular: s.popular,
    ));

    setState(() => _addedFeedback = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _addedFeedback = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final service = _service;
    final category = _category;
    final cart = ref.watch(cartProvider);
    final isInCart = service != null && cart.containsService(service.id);
    final cartItemCount = cart.itemCount;

    if (service == null) {
      return Scaffold(
        backgroundColor: const Color(0xFF07111F),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Service not found', style: TextStyle(color: Colors.white, fontSize: 18)),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () => context.go('/services'),
                child: const Text('Browse all services'),
              ),
            ],
          ),
        ),
      );
    }

    final reviews = _showAllReviews ? _kMockReviews : _kMockReviews.take(3).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF07111F),
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              // Hero image
              SliverAppBar(
                expandedHeight: 260,
                pinned: true,
                backgroundColor: const Color(0xFF07111F),
                leading: _circleButton(Icons.arrow_back, () => context.pop()),
                actions: [
                  _circleButton(
                    _liked ? Icons.favorite : Icons.favorite_border,
                    () => setState(() => _liked = !_liked),
                    color: _liked ? Colors.redAccent : Colors.white,
                  ),
                  const SizedBox(width: 4),
                  _circleButton(Icons.share, () {}),
                  const SizedBox(width: 12),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.network(
                        service.imageUrl.replaceAll('w=400', 'w=800'),
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(color: Colors.white10),
                      ),
                      Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.bottomCenter,
                            end: Alignment.topCenter,
                            colors: [Color(0xFF07111F), Colors.transparent],
                          ),
                        ),
                      ),
                      if (category != null)
                        Positioned(
                          bottom: 16,
                          left: 16,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.black54,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              '${category.emoji} ${category.name}',
                              style: const TextStyle(color: Colors.white70, fontSize: 12),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),

              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // Title
                    Text(
                      service.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Rating / duration / location
                    Wrap(
                      spacing: 12,
                      children: [
                        _infoChip(Icons.star, '${service.rating}  (${(service.rating * 47).floor()}+)', Colors.amber),
                        _infoChip(Icons.access_time, service.duration, Colors.white38),
                        _infoChip(Icons.location_on_outlined, 'Comes to you', Colors.white38),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Description
                    Text(
                      service.description,
                      style: const TextStyle(color: Colors.white54, fontSize: 15, height: 1.5),
                    ),
                    const SizedBox(height: 20),

                    // Price card + add to cart
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.04),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white10),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('PRICE RANGE', style: TextStyle(color: Colors.white.withValues(alpha: 0.3), fontSize: 10, letterSpacing: 1.2)),
                                const SizedBox(height: 4),
                                Text(service.priceRange, style: const TextStyle(color: Color(0xFF67E8F9), fontSize: 20, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 2),
                                Text('Final quote after provider review', style: TextStyle(color: Colors.white.withValues(alpha: 0.25), fontSize: 10)),
                              ],
                            ),
                          ),
                          _addToCartButton(isInCart),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Trust badges
                    Row(
                      children: [
                        _trustBadge(Icons.verified_user, 'Verified pros', 'Background checked'),
                        const SizedBox(width: 10),
                        _trustBadge(Icons.bolt, 'Quick response', 'Usually < 30 min'),
                        const SizedBox(width: 10),
                        _trustBadge(Icons.thumb_up_alt, 'Satisfaction', 'Guaranteed'),
                      ],
                    ),
                    const SizedBox(height: 28),

                    // What's included
                    const Text("What's included", style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    ...[
                      'Professional service provider at your location',
                      'All standard tools and equipment',
                      'Clean-up after the job is done',
                      '7-day workmanship guarantee',
                      'In-app communication with your provider',
                    ].map((item) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 20, height: 20,
                            decoration: BoxDecoration(
                              color: Colors.greenAccent.withValues(alpha: 0.15),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.check, size: 12, color: Colors.greenAccent),
                          ),
                          const SizedBox(width: 10),
                          Expanded(child: Text(item, style: const TextStyle(color: Colors.white54, fontSize: 14))),
                        ],
                      ),
                    )),
                    const SizedBox(height: 28),

                    // Reviews
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Reviews', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
                        Row(children: [
                          const Icon(Icons.star, color: Colors.amber, size: 16),
                          const SizedBox(width: 4),
                          Text('${service.rating}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                          Text(' (${(service.rating * 47).floor()}+)', style: const TextStyle(color: Colors.white38, fontSize: 13)),
                        ]),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ...reviews.map((r) => _reviewCard(r)),
                    if (!_showAllReviews && _kMockReviews.length > 3)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: OutlinedButton(
                          onPressed: () => setState(() => _showAllReviews = true),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Colors.white12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          child: Text('Show all ${_kMockReviews.length} reviews', style: const TextStyle(color: Colors.white54)),
                        ),
                      ),
                    const SizedBox(height: 28),

                    // FAQ
                    const Text('Frequently asked questions', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    ...List.generate(_kFaqs.length, (i) {
                      final faq = _kFaqs[i];
                      final expanded = _expandedFaq == i;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: GestureDetector(
                          onTap: () => setState(() => _expandedFaq = expanded ? null : i),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.03),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(child: Text(faq['q']!, style: const TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500))),
                                    Icon(expanded ? Icons.keyboard_arrow_down : Icons.chevron_right, color: Colors.white24, size: 20),
                                  ],
                                ),
                                if (expanded) ...[
                                  const SizedBox(height: 8),
                                  Text(faq['a']!, style: const TextStyle(color: Colors.white38, fontSize: 13, height: 1.4)),
                                ],
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                    const SizedBox(height: 28),

                    // Related services
                    if (_relatedServices.isNotEmpty) ...[
                      Text('More in ${category?.name ?? "this category"}', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 180,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: _relatedServices.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 12),
                          itemBuilder: (_, i) {
                            final related = _relatedServices[i];
                            return GestureDetector(
                              onTap: () => context.push('/services/${related.id}'),
                              child: SizedBox(
                                width: 160,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(14),
                                      child: SizedBox(
                                        height: 110,
                                        width: 160,
                                        child: Image.network(related.imageUrl, fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) => Container(color: Colors.white10)),
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(related.name, maxLines: 1, overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w500)),
                                    const SizedBox(height: 2),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(related.priceRange, style: const TextStyle(color: Color(0xFF67E8F9), fontSize: 11)),
                                        Row(children: [
                                          const Icon(Icons.star, color: Colors.amber, size: 10),
                                          const SizedBox(width: 2),
                                          Text('${related.rating}', style: const TextStyle(color: Colors.white38, fontSize: 11)),
                                        ]),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ]),
                ),
              ),
            ],
          ),

          // Sticky bottom bar
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: EdgeInsets.fromLTRB(16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
              decoration: BoxDecoration(
                color: const Color(0xFF0A1525).withValues(alpha: 0.95),
                border: const Border(top: BorderSide(color: Colors.white10)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(service.name, maxLines: 1, overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500)),
                        Text(service.priceRange, style: const TextStyle(color: Color(0xFF67E8F9), fontSize: 12)),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  _addToCartButton(isInCart),
                ],
              ),
            ),
          ),

          // Cart FAB
          if (cartItemCount > 0)
            Positioned(
              bottom: MediaQuery.of(context).padding.bottom + 80,
              right: 16,
              child: GestureDetector(
                onTap: () => _showCartSheet(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF06B6D4), Color(0xFF2563EB)]),
                    borderRadius: BorderRadius.circular(30),
                    boxShadow: [BoxShadow(color: const Color(0xFF06B6D4).withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4))],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.shopping_cart, color: Colors.white, size: 18),
                      const SizedBox(width: 8),
                      Text('View cart · $cartItemCount', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _addToCartButton(bool isInCart) {
    return GestureDetector(
      onTap: _addedFeedback ? null : _handleAddToCart,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          gradient: _addedFeedback
              ? null
              : const LinearGradient(colors: [Color(0xFF06B6D4), Color(0xFF2563EB)]),
          color: _addedFeedback ? Colors.greenAccent.withOpacity(0.15) : null,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _addedFeedback ? Icons.check : (isInCart ? Icons.add : Icons.shopping_cart),
              color: _addedFeedback ? Colors.greenAccent : Colors.white,
              size: 18,
            ),
            const SizedBox(width: 6),
            Text(
              _addedFeedback ? 'Added!' : (isInCart ? 'Add another' : 'Add to cart'),
              style: TextStyle(
                color: _addedFeedback ? Colors.greenAccent : Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _circleButton(IconData icon, VoidCallback onTap, {Color color = Colors.white}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40, height: 40,
        decoration: BoxDecoration(
          color: Colors.black38,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: color, size: 20),
      ),
    );
  }

  Widget _infoChip(IconData icon, String label, Color iconColor) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: iconColor),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(color: Colors.white54, fontSize: 13)),
      ],
    );
  }

  Widget _trustBadge(IconData icon, String title, String sub) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
        ),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFF67E8F9).withValues(alpha: 0.7), size: 22),
            const SizedBox(height: 6),
            Text(title, style: const TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.w500)),
            Text(sub, style: TextStyle(color: Colors.white.withValues(alpha: 0.25), fontSize: 9)),
          ],
        ),
      ),
    );
  }

  Widget _reviewCard(Map<String, dynamic> review) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: const Color(0xFF06B6D4).withValues(alpha: 0.2),
                child: Text(review['avatar'] as String, style: const TextStyle(color: Color(0xFF67E8F9), fontSize: 11, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(review['name'] as String, style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w500)),
                    Row(
                      children: [
                        ...List.generate(review['rating'] as int, (_) => const Icon(Icons.star, color: Colors.amber, size: 12)),
                        const SizedBox(width: 6),
                        Text(review['date'] as String, style: const TextStyle(color: Colors.white24, fontSize: 11)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(review['text'] as String, style: const TextStyle(color: Colors.white38, fontSize: 13, height: 1.4)),
        ],
      ),
    );
  }

  void _showCartSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0A1525),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => Consumer(
        builder: (context, ref, _) {
          final cartState = ref.watch(cartProvider);
          return Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(context).padding.bottom + 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white12, borderRadius: BorderRadius.circular(2))),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Icon(Icons.shopping_cart, color: Color(0xFF67E8F9), size: 20),
                    const SizedBox(width: 10),
                    Text('Your cart', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
                    const Spacer(),
                    Text('${cartState.itemCount} items', style: const TextStyle(color: Colors.white38, fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 12),
                ...cartState.items.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: SizedBox(
                          width: 48, height: 48,
                          child: Image.network(item.service.imageUrl, fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(color: Colors.white10)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.service.name, maxLines: 1, overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w500)),
                            Text(item.service.priceRange, style: const TextStyle(color: Color(0xFF67E8F9), fontSize: 12)),
                          ],
                        ),
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _miniBtn(Icons.remove, () => ref.read(cartProvider.notifier).updateQuantity(item.service.id, item.quantity - 1)),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            child: Text('${item.quantity}', style: const TextStyle(color: Colors.white, fontSize: 13)),
                          ),
                          _miniBtn(Icons.add, () => ref.read(cartProvider.notifier).updateQuantity(item.service.id, item.quantity + 1)),
                        ],
                      ),
                    ],
                  ),
                )),
                const Divider(color: Colors.white10, height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Estimated total', style: TextStyle(color: Colors.white38, fontSize: 13)),
                    Text('${cartState.cartTotal}+', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      context.push('/book');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF06B6D4),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: Text('Checkout · ${cartState.itemCount} services', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _miniBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 28, height: 28,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.white12),
          borderRadius: BorderRadius.circular(8),
          color: Colors.white.withValues(alpha: 0.05),
        ),
        child: Icon(icon, size: 14, color: Colors.white54),
      ),
    );
  }
}
