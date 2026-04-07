import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/core/widgets/app_text_field.dart';
import 'package:serveify/features/auth/providers/auth_provider.dart';

class CustomerRegistrationScreen extends ConsumerStatefulWidget {
  const CustomerRegistrationScreen({super.key});

  @override
  ConsumerState<CustomerRegistrationScreen> createState() =>
      _CustomerRegistrationScreenState();
}

class _CustomerRegistrationScreenState
    extends ConsumerState<CustomerRegistrationScreen>
    with SingleTickerProviderStateMixin {
  final _pageController = PageController();
  int _currentPage = 0;
  static const _totalPages = 3;

  // Step 1 — Personal info
  final _step1Key = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();

  // Step 2 — Password & preferences
  final _step2Key = GlobalKey<FormState>();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _agreeToTerms = false;

  // Animation
  late AnimationController _fadeController;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );
    _fadeAnim = CurvedAnimation(parent: _fadeController, curve: Curves.easeOut);
    _fadeController.forward();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  void _goToPage(int page) {
    _fadeController.reset();
    _pageController.animateToPage(
      page,
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOutCubic,
    );
    _fadeController.forward();
    setState(() => _currentPage = page);
  }

  bool _validateCurrentPage() {
    switch (_currentPage) {
      case 0:
        return _step1Key.currentState?.validate() ?? false;
      case 1:
        return _step2Key.currentState?.validate() ?? false;
      case 2:
        return true;
      default:
        return false;
    }
  }

  void _next() {
    if (!_validateCurrentPage()) return;
    if (_currentPage < _totalPages - 1) {
      _goToPage(_currentPage + 1);
    }
  }

  void _back() {
    if (_currentPage > 0) {
      _goToPage(_currentPage - 1);
    } else {
      context.pop();
    }
  }

  Future<void> _handleSubmit() async {
    if (!_agreeToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please agree to the Terms of Service'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }
    await ref.read(authProvider.notifier).register(
          fullName: _nameCtrl.text.trim(),
          email: _emailCtrl.text.trim(),
          phoneNumber: _phoneCtrl.text.trim(),
          password: _passwordCtrl.text,
          role: 'CUSTOMER',
        );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    ref.listen<AuthState>(authProvider, (prev, next) {
      if (next.status == AuthStatus.authenticated) {
        context.go('/home');
      }
    });

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Top bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_rounded),
                    onPressed: _back,
                  ),
                  const Spacer(),
                  Text(
                    'Step ${_currentPage + 1} of $_totalPages',
                    style: const TextStyle(
                        color: AppColors.textMuted, fontSize: 13),
                  ),
                ],
              ),
            ),

            // Progress bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: _StepProgressBar(
                  current: _currentPage, total: _totalPages),
            ),
            const SizedBox(height: 8),

            // Pages
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                onPageChanged: (i) => setState(() => _currentPage = i),
                children: [
                  _buildStep1(),
                  _buildStep2(),
                  _buildStep3(),
                ],
              ),
            ),

            // Error
            if (authState.error != null)
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(authState.error!,
                      style: const TextStyle(
                          color: AppColors.error, fontSize: 13)),
                ),
              ),

            // Bottom action
            Padding(
              padding: EdgeInsets.fromLTRB(
                  24, 8, 24, MediaQuery.of(context).padding.bottom + 16),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: _currentPage == _totalPages - 1
                    ? ElevatedButton(
                        onPressed: authState.status == AuthStatus.loading
                            ? null
                            : _handleSubmit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.accent,
                          foregroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16)),
                        ),
                        child: authState.status == AuthStatus.loading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2))
                            : const Text('Create Account',
                                style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 15)),
                      )
                    : ElevatedButton(
                        onPressed: _next,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.accent,
                          foregroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Text('Continue',
                                style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 15)),
                            SizedBox(width: 8),
                            Icon(Icons.arrow_forward_rounded, size: 18),
                          ],
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Step 1: Personal Info ────────────────────────────────────────
  Widget _buildStep1() {
    return FadeTransition(
      opacity: _fadeAnim,
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Form(
          key: _step1Key,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _StepHeader(
                icon: LucideIcons.userPlus,
                title: 'Welcome to Serveify',
                subtitle: "Let's start with your basic information",
              ),
              const SizedBox(height: 28),
              AppTextField(
                controller: _nameCtrl,
                label: 'Full Name',
                textInputAction: TextInputAction.next,
                prefixIcon: const Icon(LucideIcons.user, size: 18),
                validator: (v) =>
                    (v == null || v.isEmpty) ? 'Name is required' : null,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _emailCtrl,
                label: 'Email Address',
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                prefixIcon: const Icon(LucideIcons.mail, size: 18),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Email is required';
                  if (!RegExp(r'^[\w\-\.]+@([\w\-]+\.)+[\w\-]{2,4}$')
                      .hasMatch(v)) {
                    return 'Enter a valid email';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _phoneCtrl,
                label: 'Phone Number',
                hint: '+27 XX XXX XXXX',
                keyboardType: TextInputType.phone,
                textInputAction: TextInputAction.done,
                prefixIcon: const Icon(LucideIcons.phone, size: 18),
                validator: (v) =>
                    (v == null || v.isEmpty) ? 'Phone is required' : null,
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Step 2: Password ─────────────────────────────────────────────
  Widget _buildStep2() {
    return FadeTransition(
      opacity: _fadeAnim,
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Form(
          key: _step2Key,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _StepHeader(
                icon: LucideIcons.shield,
                title: 'Secure your account',
                subtitle: 'Choose a strong password to protect your account',
              ),
              const SizedBox(height: 28),
              AppTextField(
                controller: _passwordCtrl,
                label: 'Password',
                obscureText: _obscurePassword,
                textInputAction: TextInputAction.next,
                prefixIcon: const Icon(LucideIcons.lock, size: 18),
                suffixIcon: IconButton(
                  icon: Icon(
                      _obscurePassword
                          ? LucideIcons.eyeOff
                          : LucideIcons.eye,
                      size: 18),
                  onPressed: () =>
                      setState(() => _obscurePassword = !_obscurePassword),
                ),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Password is required';
                  if (v.length < 8) return 'At least 8 characters';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _confirmPasswordCtrl,
                label: 'Confirm Password',
                obscureText: _obscureConfirm,
                textInputAction: TextInputAction.done,
                prefixIcon: const Icon(LucideIcons.lock, size: 18),
                suffixIcon: IconButton(
                  icon: Icon(
                      _obscureConfirm
                          ? LucideIcons.eyeOff
                          : LucideIcons.eye,
                      size: 18),
                  onPressed: () =>
                      setState(() => _obscureConfirm = !_obscureConfirm),
                ),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Please confirm password';
                  if (v != _passwordCtrl.text) return 'Passwords do not match';
                  return null;
                },
              ),
              const SizedBox(height: 24),
              _PasswordStrengthIndicator(password: _passwordCtrl.text),
            ],
          ),
        ),
      ),
    );
  }

  // ── Step 3: Review ───────────────────────────────────────────────
  Widget _buildStep3() {
    return FadeTransition(
      opacity: _fadeAnim,
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const _StepHeader(
              icon: LucideIcons.checkCircle,
              title: 'Almost there!',
              subtitle: 'Review your details and create your account',
            ),
            const SizedBox(height: 28),
            _ReviewCard(items: {
              'Name': _nameCtrl.text,
              'Email': _emailCtrl.text,
              'Phone': _phoneCtrl.text,
            }),
            const SizedBox(height: 20),
            GestureDetector(
              onTap: () => setState(() => _agreeToTerms = !_agreeToTerms),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _agreeToTerms
                      ? AppColors.success.withValues(alpha: 0.06)
                      : AppColors.surfaceAlt,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: _agreeToTerms
                        ? AppColors.success.withValues(alpha: 0.3)
                        : AppColors.border,
                  ),
                ),
                child: Row(
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: _agreeToTerms
                            ? AppColors.success
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(7),
                        border: Border.all(
                          color: _agreeToTerms
                              ? AppColors.success
                              : AppColors.textMuted,
                          width: 1.5,
                        ),
                      ),
                      child: _agreeToTerms
                          ? const Icon(Icons.check,
                              size: 16, color: Colors.white)
                          : null,
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'I agree to the Terms of Service and Privacy Policy',
                        style: TextStyle(
                            fontSize: 13,
                            color: AppColors.textSecondary,
                            height: 1.3),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('Already have an account?',
                    style: TextStyle(
                        color: AppColors.textMuted, fontSize: 13)),
                TextButton(
                  onPressed: () => context.go('/login'),
                  child: const Text('Sign In',
                      style: TextStyle(
                          color: AppColors.accent,
                          fontWeight: FontWeight.w600,
                          fontSize: 13)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Shared Widgets ──────────────────────────────────────────────────

class _StepProgressBar extends StatelessWidget {
  final int current;
  final int total;
  const _StepProgressBar({required this.current, required this.total});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(total, (i) {
        final isActive = i <= current;
        return Expanded(
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            height: 3,
            margin: EdgeInsets.only(right: i < total - 1 ? 6 : 0),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(2),
              color: isActive ? AppColors.accent : AppColors.border,
            ),
          ),
        );
      }),
    );
  }
}

class _StepHeader extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  const _StepHeader(
      {required this.icon, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.accentLight,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(icon, color: AppColors.accent, size: 24),
        ),
        const SizedBox(height: 16),
        Text(title,
            style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary)),
        const SizedBox(height: 6),
        Text(subtitle,
            style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
                height: 1.4)),
      ],
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final Map<String, String> items;
  const _ReviewCard({required this.items});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: items.entries
            .map((e) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 80,
                        child: Text(e.key,
                            style: const TextStyle(
                                fontSize: 13, color: AppColors.textMuted)),
                      ),
                      Expanded(
                        child: Text(
                          e.value.isEmpty ? '—' : e.value,
                          style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: AppColors.textPrimary),
                        ),
                      ),
                    ],
                  ),
                ))
            .toList(),
      ),
    );
  }
}

class _PasswordStrengthIndicator extends StatelessWidget {
  final String password;
  const _PasswordStrengthIndicator({required this.password});

  @override
  Widget build(BuildContext context) {
    final hasLength = password.length >= 8;
    final hasUpper = password.contains(RegExp(r'[A-Z]'));
    final hasNumber = password.contains(RegExp(r'[0-9]'));
    final hasSpecial = password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'));
    final strength =
        [hasLength, hasUpper, hasNumber, hasSpecial].where((e) => e).length;

    final color = switch (strength) {
      0 || 1 => AppColors.error,
      2 => AppColors.warning,
      3 => AppColors.info,
      _ => AppColors.success,
    };

    final label = switch (strength) {
      0 || 1 => 'Weak',
      2 => 'Fair',
      3 => 'Good',
      _ => 'Strong',
    };

    if (password.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('Password Strength: ',
                style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
            Text(label,
                style: TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w600, color: color)),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: strength / 4,
            backgroundColor: AppColors.border,
            valueColor: AlwaysStoppedAnimation(color),
            minHeight: 4,
          ),
        ),
        const SizedBox(height: 12),
        _RequirementRow(met: hasLength, text: 'At least 8 characters'),
        _RequirementRow(met: hasUpper, text: 'Contains uppercase letter'),
        _RequirementRow(met: hasNumber, text: 'Contains a number'),
        _RequirementRow(met: hasSpecial, text: 'Contains special character'),
      ],
    );
  }
}

class _RequirementRow extends StatelessWidget {
  final bool met;
  final String text;
  const _RequirementRow({required this.met, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(
            met ? LucideIcons.checkCircle : LucideIcons.circle,
            size: 14,
            color: met ? AppColors.success : AppColors.textMuted,
          ),
          const SizedBox(width: 8),
          Text(text,
              style: TextStyle(
                  fontSize: 12,
                  color: met ? AppColors.success : AppColors.textMuted)),
        ],
      ),
    );
  }
}
