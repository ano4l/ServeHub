import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/features/auth/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final email = auth.email ?? 'sarah.johnson@email.com';
    final displayName = auth.email != null
        ? auth.email!.split('@').first.replaceAll('.', ' ').split(' ').map((w) => w.isEmpty ? '' : '${w[0].toUpperCase()}${w.substring(1)}').join(' ')
        : 'Sarah Johnson';

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
                child: Text(
                  'PROFILE',
                  style: TextStyle(fontSize: 11, letterSpacing: 2.4, color: AppColors.accent.withValues(alpha: 0.55), fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ),

          // Profile card
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        // Avatar
                        Stack(
                          children: [
                            Container(
                              width: 72, height: 72,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(36),
                                gradient: const LinearGradient(colors: [Color(0xFF22D3EE), Color(0xFF2563EB)]),
                              ),
                              alignment: Alignment.center,
                              child: Text(displayName[0], style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
                            ),
                            Positioned(
                              bottom: -2, right: -2,
                              child: Container(
                                width: 28, height: 28,
                                decoration: BoxDecoration(
                                  color: Colors.white, borderRadius: BorderRadius.circular(14),
                                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 8)],
                                ),
                                child: const Icon(Icons.camera_alt_rounded, size: 14, color: Color(0xFF07111F)),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(width: 16),
                        // Info
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(displayName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Colors.white)),
                                  const SizedBox(width: 8),
                                  Icon(Icons.edit_rounded, size: 16, color: Colors.white.withValues(alpha: 0.4)),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(email, style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.55))),
                              const SizedBox(height: 2),
                              Text('+27 83 123 4567', style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.45))),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Icon(Icons.location_on_outlined, size: 12, color: Colors.white.withValues(alpha: 0.4)),
                                  const SizedBox(width: 4),
                                  Text('Sandton, Johannesburg', style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.4))),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    // Stats row
                    const Row(
                      children: [
                        _StatBox(icon: Icons.calendar_today_rounded, value: '24', label: 'BOOKINGS'),
                        SizedBox(width: 12),
                        _StatBox(icon: Icons.star_rounded, value: '4.8', label: 'RATING'),
                        SizedBox(width: 12),
                        _StatBox(icon: Icons.account_balance_wallet_outlined, value: 'R12,450', label: 'SPENT'),
                        SizedBox(width: 12),
                        _StatBox(icon: Icons.favorite_outline_rounded, value: '8', label: 'SAVED'),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text('Member since January 2024', style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.35))),
                  ],
                ),
              ),
            ),
          ),

          // Saved addresses
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: _GlassSection(
                icon: Icons.location_on_outlined,
                title: 'Saved addresses',
                action: '+ Add new',
                children: [
                  _AddressRow(label: 'Home', address: '83 Rivonia Road, Sandton, 2196', isDefault: true),
                  _AddressRow(label: 'Office', address: '15 Tyrwhitt Avenue, Rosebank, 2196', isDefault: false),
                  _AddressRow(label: "Mom's place", address: '22 Jan Smuts Ave, Parktown, 2193', isDefault: false),
                ],
              ),
            ),
          ),

          // Payment methods
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: _GlassSection(
                icon: Icons.credit_card_rounded,
                title: 'Payment methods',
                action: '+ Add new',
                children: [
                  _PaymentRow(label: 'Visa ending 4289', isDefault: true),
                  _PaymentRow(label: 'Mastercard ending 7731', isDefault: false),
                  _PaymentRow(label: 'Instant EFT', isDefault: false),
                ],
              ),
            ),
          ),

          // Preferences
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: _SettingsSection(title: 'PREFERENCES', items: [
                _SettingsItem(icon: Icons.notifications_none_rounded, label: 'Notifications', desc: 'Push, email & SMS settings'),
                _SettingsItem(icon: Icons.dark_mode_outlined, label: 'Appearance', desc: 'Dark mode (active)', badge: 'Dark'),
                _SettingsItem(icon: Icons.language_rounded, label: 'Language', desc: 'English (South Africa)'),
              ]),
            ),
          ),

          // Account
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: _SettingsSection(title: 'ACCOUNT', items: [
                _SettingsItem(icon: Icons.shield_outlined, label: 'Privacy & Security', desc: 'Password, 2FA, data'),
                _SettingsItem(icon: Icons.help_outline_rounded, label: 'Help & Support', desc: 'FAQ, contact support'),
                _SettingsItem(icon: Icons.settings_outlined, label: 'App Settings', desc: 'Cache, defaults, debug'),
              ]),
            ),
          ),

          // Sign out
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: GestureDetector(
                onTap: () async {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) context.go('/login');
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.error.withValues(alpha: 0.2)),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.logout_rounded, color: AppColors.error, size: 16),
                      SizedBox(width: 8),
                      Text('Sign out', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w500, fontSize: 14)),
                    ],
                  ),
                ),
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(0, 16, 0, 100),
              child: Center(
                child: Text('ServeHub v1.0.0 · South Africa', style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.25))),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  const _StatBox({required this.icon, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Icon(icon, size: 16, color: AppColors.accent.withValues(alpha: 0.7)),
            const SizedBox(height: 6),
            Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 9, letterSpacing: 1, color: Colors.white.withValues(alpha: 0.4))),
          ],
        ),
      ),
    );
  }
}

class _GlassSection extends StatelessWidget {
  final IconData icon;
  final String title;
  final String action;
  final List<Widget> children;
  const _GlassSection({required this.icon, required this.title, required this.action, required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: AppColors.accent),
              const SizedBox(width: 8),
              Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
              const Spacer(),
              Text(action, style: const TextStyle(fontSize: 12, color: AppColors.accent)),
            ],
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }
}

class _AddressRow extends StatelessWidget {
  final String label;
  final String address;
  final bool isDefault;
  const _AddressRow({required this.label, required this.address, required this.isDefault});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.white)),
                      if (isDefault) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.accent.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: const Text('Default', style: TextStyle(fontSize: 10, color: AppColors.accent)),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(address, style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.45)), maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, size: 16, color: Colors.white.withValues(alpha: 0.3)),
          ],
        ),
      ),
    );
  }
}

class _PaymentRow extends StatelessWidget {
  final String label;
  final bool isDefault;
  const _PaymentRow({required this.label, required this.isDefault});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(Icons.credit_card_rounded, size: 16, color: Colors.white.withValues(alpha: 0.7)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Row(
                children: [
                  Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.white)),
                  if (isDefault) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.accent.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: const Text('Default', style: TextStyle(fontSize: 10, color: AppColors.accent)),
                    ),
                  ],
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, size: 16, color: Colors.white.withValues(alpha: 0.3)),
          ],
        ),
      ),
    );
  }
}

class _SettingsSection extends StatelessWidget {
  final String title;
  final List<_SettingsItem> items;
  const _SettingsSection({required this.title, required this.items});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(fontSize: 11, letterSpacing: 1.8, color: Colors.white.withValues(alpha: 0.35))),
          const SizedBox(height: 12),
          ...items.map((item) => _SettingsRow(item: item)),
        ],
      ),
    );
  }
}

class _SettingsItem {
  final IconData icon;
  final String label;
  final String desc;
  final String? badge;
  const _SettingsItem({required this.icon, required this.label, required this.desc, this.badge});
}

class _SettingsRow extends StatelessWidget {
  final _SettingsItem item;
  const _SettingsRow({required this.item});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Settings coming soon'), duration: Duration(seconds: 1)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(item.icon, size: 16, color: Colors.white.withValues(alpha: 0.7)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.white)),
                      Text(item.desc, style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.4))),
                    ],
                  ),
                ),
                if (item.badge != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Text(item.badge!, style: TextStyle(fontSize: 10, color: Colors.white.withValues(alpha: 0.6))),
                  ),
                  const SizedBox(width: 4),
                ],
                Icon(Icons.chevron_right_rounded, size: 16, color: Colors.white.withValues(alpha: 0.3)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
