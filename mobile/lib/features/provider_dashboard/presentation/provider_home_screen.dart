import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/features/auth/providers/auth_provider.dart';

final _providerStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  final auth = ref.read(authProvider);
  final stats = <String, dynamic>{
    'pendingBookings': 0,
    'activeBookings': 0,
    'completedBookings': 0,
    'balance': '0.00',
    'rating': '0.0',
    'reviewCount': 0,
  };

  try {
    final bookingsRes = await dio.get('/bookings', queryParameters: {'size': 100});
    final List bookings;
    if (bookingsRes.data is List) {
      bookings = bookingsRes.data as List;
    } else if (bookingsRes.data is Map && bookingsRes.data['content'] != null) {
      bookings = bookingsRes.data['content'] as List;
    } else {
      bookings = [];
    }
    stats['pendingBookings'] = bookings.where((b) => b['status'] == 'REQUESTED').length;
    stats['activeBookings'] = bookings.where((b) => b['status'] == 'ACCEPTED' || b['status'] == 'IN_PROGRESS').length;
    stats['completedBookings'] = bookings.where((b) => b['status'] == 'COMPLETED').length;
  } catch (_) {}

  try {
    final walletRes = await dio.get('/wallet/balance');
    stats['balance'] = walletRes.data['balance']?.toString() ?? '0.00';
  } catch (_) {}

  if (auth.providerId != null) {
    try {
      final provRes = await dio.get('/providers/${auth.providerId}');
      stats['rating'] = provRes.data['averageRating']?.toString() ?? '0.0';
      stats['reviewCount'] = provRes.data['reviewCount'] ?? 0;
    } catch (_) {}
  }

  return stats;
});

class ProviderHomeScreen extends ConsumerWidget {
  const ProviderHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(_providerStatsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.go('/provider/notifications'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(_providerStatsProvider),
        child: stats.when(
          data: (data) => _DashboardContent(stats: data),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => const Center(child: Text('Failed to load dashboard')),
        ),
      ),
    );
  }
}

class _DashboardContent extends StatelessWidget {
  final Map<String, dynamic> stats;
  const _DashboardContent({required this.stats});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Balance card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF0D2847), Color(0xFF1A1040)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Wallet Balance', style: TextStyle(color: Colors.white70, fontSize: 14)),
              const SizedBox(height: 4),
              Text(
                'R${stats['balance']}',
                style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {},
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white54),
                      ),
                      child: const Text('Request Payout'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {},
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white54),
                      ),
                      child: const Text('Transactions'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Stats grid
        Row(
          children: [
            Expanded(child: _StatCard(
              icon: Icons.pending_actions, label: 'Pending', value: '${stats['pendingBookings']}',
              color: AppColors.warning,
            )),
            const SizedBox(width: 12),
            Expanded(child: _StatCard(
              icon: Icons.play_circle_outline, label: 'Active', value: '${stats['activeBookings']}',
              color: AppColors.info,
            )),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _StatCard(
              icon: Icons.check_circle_outline, label: 'Completed', value: '${stats['completedBookings']}',
              color: AppColors.success,
            )),
            const SizedBox(width: 12),
            Expanded(child: _StatCard(
              icon: Icons.star_outline, label: 'Rating',
              value: '${stats['rating']} (${stats['reviewCount']})',
              color: Colors.amber,
            )),
          ],
        ),
        const SizedBox(height: 24),

        // Quick actions
        Text('Quick Actions',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        _ActionTile(
          icon: Icons.calendar_today_outlined,
          title: 'View Bookings',
          subtitle: 'Manage your booking requests',
          onTap: () => context.go('/provider/bookings'),
        ),
        _ActionTile(
          icon: Icons.edit_outlined,
          title: 'Edit Profile',
          subtitle: 'Update your services and bio',
          onTap: () => context.go('/provider/profile'),
        ),
        _ActionTile(
          icon: Icons.add_circle_outline,
          title: 'Add Service',
          subtitle: 'List a new service offering',
          onTap: () {},
        ),
        _ActionTile(
          icon: Icons.bar_chart_outlined,
          title: 'View Earnings',
          subtitle: 'Track your income and payouts',
          onTap: () {},
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  const _StatCard({required this.icon, required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  const _ActionTile({required this.icon, required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          width: 40, height: 40,
          decoration: BoxDecoration(
            color: AppColors.accent.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppColors.accent, size: 20),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted, size: 20),
        onTap: onTap,
      ),
    );
  }
}
