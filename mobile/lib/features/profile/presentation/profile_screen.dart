import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/features/auth/providers/auth_provider.dart';

final _profileProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final auth = ref.read(authProvider);
  final dio = ref.read(dioProvider);
  final endpoint = auth.isProvider ? '/providers/me' : '/customers/me';
  final response = await dio.get(endpoint);
  return Map<String, dynamic>.from(response.data as Map);
});

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final profile = ref.watch(_profileProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(_profileProvider),
        child: profile.when(
          data: (data) {
            final name = data['fullName']?.toString() ?? auth.email ?? 'User';
            final email = data['email']?.toString() ?? auth.email ?? '';
            final city = data['city']?.toString();
            final phone = data['phoneNumber']?.toString();
            final bio = data['bio']?.toString();
            final radius = data['serviceRadiusKm']?.toString();

            return ListView(
              padding: const EdgeInsets.fromLTRB(20, 40, 20, 100),
              children: [
                Text(
                  auth.isProvider ? 'Provider Profile' : 'Profile',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 72,
                            height: 72,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(36),
                              gradient: const LinearGradient(
                                colors: [Color(0xFF22D3EE), Color(0xFF2563EB)],
                              ),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              name.isNotEmpty ? name[0].toUpperCase() : '?',
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  name,
                                  style: const TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(email, style: const TextStyle(color: AppColors.textSecondary)),
                                if (phone != null && phone.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text(phone, style: const TextStyle(color: AppColors.textSecondary)),
                                ],
                                if (city != null && city.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text(city, style: const TextStyle(color: AppColors.textSecondary)),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                      if (bio != null && bio.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        const Text(
                          'About',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          bio,
                          style: const TextStyle(color: AppColors.textSecondary, height: 1.5),
                        ),
                      ],
                      if (radius != null && radius.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Text(
                          'Service radius: $radius km',
                          style: const TextStyle(color: AppColors.textSecondary),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Card(
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.edit_outlined),
                        title: const Text('Edit Profile'),
                        subtitle: const Text('Update your account details'),
                        onTap: () => context.push('/profile/edit'),
                      ),
                      if (!auth.isProvider)
                        ListTile(
                          leading: const Icon(Icons.location_on_outlined),
                          title: const Text('My Addresses'),
                          subtitle: const Text('Manage your saved addresses'),
                          onTap: () => context.push('/addresses'),
                        ),
                      if (!auth.isProvider)
                        ListTile(
                          leading: const Icon(Icons.gavel_outlined),
                          title: const Text('Disputes'),
                          subtitle: const Text('View or open service disputes'),
                          onTap: () => context.push('/disputes'),
                        ),
                      if (auth.isProvider)
                        ListTile(
                          leading: const Icon(Icons.miscellaneous_services_outlined),
                          title: const Text('My Services'),
                          subtitle: const Text('Manage published offerings'),
                          onTap: () => context.push('/provider/services'),
                        ),
                      if (auth.isProvider)
                        ListTile(
                          leading: const Icon(Icons.account_balance_wallet_outlined),
                          title: const Text('Wallet'),
                          subtitle: const Text('Track payouts and earnings'),
                          onTap: () => context.push('/provider/wallet'),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                FilledButton.tonalIcon(
                  onPressed: () async {
                    await ref.read(authProvider.notifier).logout();
                    if (context.mounted) {
                      context.go('/login');
                    }
                  },
                  icon: const Icon(Icons.logout_rounded),
                  label: const Text('Sign out'),
                ),
              ],
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => ListView(
            children: [
              const SizedBox(height: 140),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  'We could not load the profile.\n$error',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white70),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
