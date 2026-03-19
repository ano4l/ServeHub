import 'package:flutter/material.dart';
import 'package:serveify/core/theme/app_theme.dart';

class Skeleton extends StatefulWidget {
  final double width;
  final double height;
  final BorderRadius borderRadius;
  final bool isCircle;

  const Skeleton({
    super.key,
    this.width = double.infinity,
    this.height = 16,
    this.borderRadius = const BorderRadius.all(Radius.circular(8)),
    this.isCircle = false,
  });

  const Skeleton.circle({
    super.key,
    required double diameter,
  })  : width = diameter,
        height = diameter,
        borderRadius = const BorderRadius.all(Radius.circular(1000)),
        isCircle = true;

  const Skeleton.rounded({
    super.key,
    this.width = double.infinity,
    this.height = 16,
    this.borderRadius = const BorderRadius.all(Radius.circular(12)),
  }) : isCircle = false;

  @override
  State<Skeleton> createState() => _SkeletonState();
}

class _SkeletonState extends State<Skeleton> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat();

    _animation = Tween<double>(begin: -1, end: 2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: widget.borderRadius,
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: const [
                Color(0xFFE8E8E8),
                Color(0xFFF5F5F5),
                Color(0xFFE8E8E8),
              ],
              stops: [
                _animation.value - 0.3,
                _animation.value,
                _animation.value + 0.3,
              ],
            ),
          ),
        );
      },
    );
  }
}

class HomeSkeleton extends StatelessWidget {
  const HomeSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        const SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Skeleton(width: 120, height: 14, borderRadius: BorderRadius.all(Radius.circular(4))),
                SizedBox(height: 8),
                Skeleton(width: 180, height: 32, borderRadius: BorderRadius.all(Radius.circular(6))),
                SizedBox(height: 24),
                Skeleton(height: 52, borderRadius: BorderRadius.all(Radius.circular(16))),
                SizedBox(height: 24),
                Skeleton(width: 100, height: 16, borderRadius: BorderRadius.all(Radius.circular(4))),
                SizedBox(height: 16),
              ],
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: SizedBox(
            height: 100,
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              scrollDirection: Axis.horizontal,
              itemCount: 8,
              itemBuilder: (_, __) => const Padding(
                padding: EdgeInsets.only(right: 12),
                child: Column(
                  children: [
                    Skeleton.circle(diameter: 56),
                    SizedBox(height: 8),
                    Skeleton(width: 50, height: 12, borderRadius: BorderRadius.all(Radius.circular(4))),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.fromLTRB(20, 24, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Skeleton(width: 100, height: 16, borderRadius: BorderRadius.all(Radius.circular(4))),
                SizedBox(height: 16),
                Skeleton(height: 140, borderRadius: BorderRadius.all(Radius.circular(20))),
                SizedBox(height: 24),
                Skeleton(width: 120, height: 16, borderRadius: BorderRadius.all(Radius.circular(4))),
                SizedBox(height: 16),
              ],
            ),
          ),
        ),
        SliverList(
          delegate: SliverChildBuilderDelegate(
            (_, __) => const Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 12),
              child: Skeleton(height: 100, borderRadius: BorderRadius.all(Radius.circular(20))),
            ),
            childCount: 3,
          ),
        ),
      ],
    );
  }
}

class BrowseSkeleton extends StatelessWidget {
  const BrowseSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        const SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Skeleton(width: 80, height: 14, borderRadius: BorderRadius.all(Radius.circular(4))),
                SizedBox(height: 16),
                Skeleton(height: 44, borderRadius: BorderRadius.all(Radius.circular(14))),
                SizedBox(height: 20),
              ],
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: SizedBox(
            height: 88,
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              scrollDirection: Axis.horizontal,
              itemCount: 6,
              itemBuilder: (_, __) => const Padding(
                padding: EdgeInsets.only(right: 16),
                child: Column(
                  children: [
                    Skeleton.circle(diameter: 64),
                    SizedBox(height: 6),
                    Skeleton(width: 50, height: 10, borderRadius: BorderRadius.all(Radius.circular(3))),
                  ],
                ),
              ),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
            child: Row(
              children: List.generate(
                4,
                (_) => const Padding(
                  padding: EdgeInsets.only(right: 8),
                  child: Skeleton(width: 80, height: 36, borderRadius: BorderRadius.all(Radius.circular(12))),
                ),
              ),
            ),
          ),
        ),
        SliverList(
          delegate: SliverChildBuilderDelegate(
            (_, __) => const Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Skeleton(height: 200, borderRadius: BorderRadius.all(Radius.circular(20))),
                  SizedBox(height: 12),
                  Row(
                    children: [
                      Skeleton.circle(diameter: 40),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Skeleton(width: 120, height: 14, borderRadius: BorderRadius.all(Radius.circular(4))),
                            SizedBox(height: 6),
                            Skeleton(width: 80, height: 12, borderRadius: BorderRadius.all(Radius.circular(4))),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            childCount: 3,
          ),
        ),
      ],
    );
  }
}

class BookingsSkeleton extends StatelessWidget {
  const BookingsSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        const SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Skeleton(width: 100, height: 32, borderRadius: BorderRadius.all(Radius.circular(6))),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
            child: Row(
              children: List.generate(
                3,
                (_) => const Padding(
                  padding: EdgeInsets.only(right: 8),
                  child: Skeleton(width: 90, height: 36, borderRadius: BorderRadius.all(Radius.circular(12))),
                ),
              ),
            ),
          ),
        ),
        SliverList(
          delegate: SliverChildBuilderDelegate(
            (_, __) => const Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 12),
              child: Skeleton(height: 180, borderRadius: BorderRadius.all(Radius.circular(20))),
            ),
            childCount: 4,
          ),
        ),
      ],
    );
  }
}

class NotificationsSkeleton extends StatelessWidget {
  const NotificationsSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        const SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.fromLTRB(20, 16, 20, 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Skeleton(width: 120, height: 32, borderRadius: BorderRadius.all(Radius.circular(6))),
                Skeleton(width: 70, height: 16, borderRadius: BorderRadius.all(Radius.circular(4))),
              ],
            ),
          ),
        ),
        SliverList(
          delegate: SliverChildBuilderDelegate(
            (_, __) => Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: const Row(
                  children: [
                    Skeleton.circle(diameter: 44),
                    SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Skeleton(width: double.infinity, height: 14, borderRadius: BorderRadius.all(Radius.circular(4))),
                          SizedBox(height: 8),
                          Skeleton(width: 150, height: 12, borderRadius: BorderRadius.all(Radius.circular(4))),
                          SizedBox(height: 6),
                          Skeleton(width: 80, height: 10, borderRadius: BorderRadius.all(Radius.circular(3))),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            childCount: 6,
          ),
        ),
      ],
    );
  }
}
