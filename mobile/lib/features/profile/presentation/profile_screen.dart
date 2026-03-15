import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/core/demo/customer_demo_data.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/features/auth/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final email = auth.email ?? 'alex@example.com';
    final displayName = email.split('@').first.replaceAll('.', ' ').split(' ').map(_capitalise).join(' ');

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Text('Profile', style: Theme.of(context).textTheme.headlineMedium),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: _softShadow,
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: AppColors.accentLight,
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Center(
                          child: Text(
                            _initials(displayName),
                            style: const TextStyle(
                              color: AppColors.accent,
                              fontWeight: FontWeight.w800,
                              fontSize: 28,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(displayName, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20)),
                      const SizedBox(height: 4),
                      Text(email, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.accentLight,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          auth.role ?? 'CUSTOMER',
                          style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.w700, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          ...CustomerDemoData.profileSections.map((section) {
            final title = section['title']?.toString() ?? '';
            final items = (section['items'] as List).map((item) => item.toString()).toList();
            return SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, title == 'Account' ? 24 : 20, 20, 0),
                child: _ProfileSection(title: title, items: items),
              ),
            );
          }),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: InkWell(
                borderRadius: BorderRadius.circular(18),
                onTap: () async {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) context.go('/login');
                },
                child: Ink(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.logout_rounded, color: AppColors.error),
                      SizedBox(width: 8),
                      Text(
                        'Sign Out',
                        style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w700, fontSize: 15),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text('Serveify v1.0.0', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileSection extends StatelessWidget {
  final String title;
  final List<String> items;

  const _ProfileSection({required this.title, required this.items});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(color: AppColors.textMuted, fontSize: 13, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(20),
            boxShadow: _softShadow,
          ),
          child: Column(
            children: items.asMap().entries.map((entry) {
              return Column(
                children: [
                  _ProfileRow(label: entry.value, icon: _iconForLabel(entry.value)),
                  if (entry.key < items.length - 1)
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 18),
                      child: Divider(height: 1, color: AppColors.divider),
                    ),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

class _ProfileRow extends StatelessWidget {
  final String label;
  final IconData icon;

  const _ProfileRow({required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.surfaceAlt,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.textSecondary, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
          ),
          const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
        ],
      ),
    );
  }
}

IconData _iconForLabel(String label) {
  switch (label) {
    case 'Edit Profile':
      return Icons.person_outline_rounded;
    case 'Saved Addresses':
      return Icons.location_on_outlined;
    case 'Notifications':
      return Icons.notifications_none_rounded;
    case 'My Reviews':
      return Icons.star_outline_rounded;
    case 'Payment Methods':
      return Icons.credit_card_rounded;
    case 'Support Tickets':
      return Icons.support_agent_rounded;
    case 'Help Center':
      return Icons.help_outline_rounded;
    case 'Privacy Policy':
      return Icons.shield_outlined;
    case 'Terms of Service':
      return Icons.description_outlined;
    default:
      return Icons.chevron_right_rounded;
  }
}

String _capitalise(String value) {
  if (value.isEmpty) return value;
  return value[0].toUpperCase() + value.substring(1);
}

String _initials(String name) {
  final parts = name.split(' ').where((part) => part.isNotEmpty).take(2).toList();
  if (parts.isEmpty) return '?';
  return parts.map((part) => part[0].toUpperCase()).join();
}

const _softShadow = <BoxShadow>[
  BoxShadow(
    color: Color(0x14000000),
    blurRadius: 16,
    offset: Offset(0, 4),
  ),
];
