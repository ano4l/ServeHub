import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:serveify/core/network/upload_service.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/core/widgets/app_text_field.dart';
import 'package:serveify/features/auth/providers/auth_provider.dart';

class ProviderOnboardingScreen extends ConsumerStatefulWidget {
  const ProviderOnboardingScreen({super.key});

  @override
  ConsumerState<ProviderOnboardingScreen> createState() =>
      _ProviderOnboardingScreenState();
}

class _ProviderOnboardingScreenState
    extends ConsumerState<ProviderOnboardingScreen>
    with TickerProviderStateMixin {
  final _pageController = PageController();
  int _currentPage = 0;
  static const _totalPages = 4;

  // Step 1 — Account
  final _step1Key = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscurePassword = true;

  // Step 2 — Provider details
  final _step2Key = GlobalKey<FormState>();
  final _cityCtrl = TextEditingController();
  final _radiusCtrl = TextEditingController(text: '25');
  final _bioCtrl = TextEditingController();
  String _selectedCategory = '';
  final List<String> _categories = [
    'Plumbing',
    'Electrical',
    'Cleaning',
    'Painting',
    'Gardening',
    'Moving',
    'Beauty',
    'Tutoring',
    'Fitness',
    'Other',
  ];

  // Step 3 — Documents
  XFile? _idDocument;
  XFile? _proofOfAddress;
  XFile? _profilePhoto;
  final _picker = ImagePicker();

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
    _cityCtrl.dispose();
    _radiusCtrl.dispose();
    _bioCtrl.dispose();
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
        return true; // Documents optional for initial submission
      case 3:
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

  Future<void> _pickFile(String type) async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),
              Text('Upload $type',
                  style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary)),
              const SizedBox(height: 20),
              ListTile(
                leading: const Icon(LucideIcons.camera, color: AppColors.accent),
                title: const Text('Camera',
                    style: TextStyle(color: AppColors.textPrimary)),
                onTap: () => Navigator.pop(context, ImageSource.camera),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              ListTile(
                leading:
                    const Icon(LucideIcons.image, color: AppColors.accent),
                title: const Text('Gallery',
                    style: TextStyle(color: AppColors.textPrimary)),
                onTap: () => Navigator.pop(context, ImageSource.gallery),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ],
          ),
        ),
      ),
    );
    if (source == null) return;

    final picked = await _picker.pickImage(source: source, imageQuality: 80);
    if (picked == null) return;

    setState(() {
      switch (type) {
        case 'ID Document':
          _idDocument = picked;
          break;
        case 'Proof of Address':
          _proofOfAddress = picked;
          break;
        case 'Profile Photo':
          _profilePhoto = picked;
          break;
      }
    });
  }

  Future<void> _handleSubmit() async {
    await ref.read(authProvider.notifier).register(
          fullName: _nameCtrl.text.trim(),
          email: _emailCtrl.text.trim(),
          phoneNumber: _phoneCtrl.text.trim(),
          password: _passwordCtrl.text,
          role: 'PROVIDER',
          city: _cityCtrl.text.trim(),
          serviceRadiusKm: int.tryParse(_radiusCtrl.text),
          bio: _bioCtrl.text.trim(),
        );

    // Upload documents after successful registration
    final authState = ref.read(authProvider);
    if (authState.status == AuthStatus.authenticated) {
      await _uploadDocuments();
    }
  }

  Future<void> _uploadDocuments() async {
    final uploadService = ref.read(uploadServiceProvider);
    try {
      if (_profilePhoto != null) {
        await uploadService.uploadAvatar(_profilePhoto!);
      }
      if (_idDocument != null) {
        await uploadService.uploadDocument(_idDocument!, 'ID_DOCUMENT');
      }
      if (_proofOfAddress != null) {
        await uploadService.uploadDocument(_proofOfAddress!, 'PROOF_OF_ADDRESS');
      }
    } catch (_) {
      // Documents can be uploaded later from profile — don't block onboarding
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    ref.listen<AuthState>(authProvider, (prev, next) {
      if (next.status == AuthStatus.authenticated) {
        context.go('/provider');
      }
    });

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Top bar
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
                  _buildStep4(),
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
                            : const Text('Create Provider Account',
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

  // ── Step 1: Account Info ─────────────────────────────────────────
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
                title: 'Create your account',
                subtitle: 'Enter your personal details to get started',
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
                textInputAction: TextInputAction.next,
                prefixIcon: const Icon(LucideIcons.phone, size: 18),
                validator: (v) =>
                    (v == null || v.isEmpty) ? 'Phone is required' : null,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _passwordCtrl,
                label: 'Password',
                obscureText: _obscurePassword,
                textInputAction: TextInputAction.done,
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
            ],
          ),
        ),
      ),
    );
  }

  // ── Step 2: Provider Details ─────────────────────────────────────
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
                icon: LucideIcons.briefcase,
                title: 'Provider Details',
                subtitle: 'Tell us about the services you offer',
              ),
              const SizedBox(height: 28),
              AppTextField(
                controller: _cityCtrl,
                label: 'City',
                textInputAction: TextInputAction.next,
                prefixIcon:
                    const Icon(LucideIcons.mapPin, size: 18),
                validator: (v) =>
                    (v == null || v.isEmpty) ? 'City is required' : null,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _radiusCtrl,
                label: 'Service Radius (km)',
                keyboardType: TextInputType.number,
                textInputAction: TextInputAction.next,
                prefixIcon: const Icon(LucideIcons.radar, size: 18),
                validator: (v) {
                  final n = int.tryParse(v ?? '');
                  if (n == null || n < 1 || n > 200) return '1–200 km';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _bioCtrl,
                label: 'Bio',
                hint: 'Describe your experience & services...',
                maxLines: 4,
                prefixIcon: const Icon(LucideIcons.fileText, size: 18),
                validator: (v) =>
                    (v == null || v.isEmpty) ? 'Bio is required' : null,
              ),
              const SizedBox(height: 24),
              const Text('Primary Category',
                  style: TextStyle(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w500,
                      fontSize: 13)),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _categories.map((cat) {
                  final selected = _selectedCategory == cat;
                  return ChoiceChip(
                    label: Text(cat),
                    selected: selected,
                    onSelected: (_) =>
                        setState(() => _selectedCategory = cat),
                    selectedColor: AppColors.accentLight,
                    labelStyle: TextStyle(
                      color: selected
                          ? AppColors.accent
                          : AppColors.textSecondary,
                      fontWeight:
                          selected ? FontWeight.w600 : FontWeight.w400,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(
                        color: selected
                            ? AppColors.accent
                            : AppColors.border,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Step 3: Documents ────────────────────────────────────────────
  Widget _buildStep3() {
    return FadeTransition(
      opacity: _fadeAnim,
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const _StepHeader(
              icon: LucideIcons.fileCheck,
              title: 'Upload Documents',
              subtitle:
                  'We need these to verify your identity. You can also add them later.',
            ),
            const SizedBox(height: 28),
            _DocumentTile(
              label: 'Profile Photo',
              description: 'A clear photo of yourself',
              icon: LucideIcons.camera,
              file: _profilePhoto,
              onTap: () => _pickFile('Profile Photo'),
            ),
            const SizedBox(height: 12),
            _DocumentTile(
              label: 'ID Document',
              description: 'National ID, passport or drivers license',
              icon: LucideIcons.creditCard,
              file: _idDocument,
              onTap: () => _pickFile('ID Document'),
            ),
            const SizedBox(height: 12),
            _DocumentTile(
              label: 'Proof of Address',
              description: 'Utility bill or bank statement',
              icon: LucideIcons.home,
              file: _proofOfAddress,
              onTap: () => _pickFile('Proof of Address'),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.info.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(LucideIcons.info, size: 16,
                      color: AppColors.info),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Documents are reviewed within 24 hours. You can start setting up your profile while we verify.',
                      style: TextStyle(
                          color: AppColors.info.withValues(alpha: 0.9),
                          fontSize: 12.5,
                          height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Step 4: Review ───────────────────────────────────────────────
  Widget _buildStep4() {
    return FadeTransition(
      opacity: _fadeAnim,
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const _StepHeader(
              icon: LucideIcons.checkCircle,
              title: 'Review & Submit',
              subtitle: 'Make sure everything looks good',
            ),
            const SizedBox(height: 28),
            _ReviewSection(title: 'Account', items: {
              'Name': _nameCtrl.text,
              'Email': _emailCtrl.text,
              'Phone': _phoneCtrl.text,
            }),
            const SizedBox(height: 16),
            _ReviewSection(title: 'Provider', items: {
              'City': _cityCtrl.text,
              'Radius': '${_radiusCtrl.text} km',
              'Category': _selectedCategory.isNotEmpty
                  ? _selectedCategory
                  : 'Not selected',
              'Bio': _bioCtrl.text.length > 80
                  ? '${_bioCtrl.text.substring(0, 80)}...'
                  : _bioCtrl.text,
            }),
            const SizedBox(height: 16),
            _ReviewSection(title: 'Documents', items: {
              'Profile Photo':
                  _profilePhoto != null ? 'Uploaded' : 'Not uploaded',
              'ID Document':
                  _idDocument != null ? 'Uploaded' : 'Not uploaded',
              'Proof of Address':
                  _proofOfAddress != null ? 'Uploaded' : 'Not uploaded',
            }),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(LucideIcons.shield, size: 16,
                      color: AppColors.success),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'By creating an account you agree to our Terms of Service and Privacy Policy.',
                      style: TextStyle(
                          color: AppColors.success.withValues(alpha: 0.9),
                          fontSize: 12.5,
                          height: 1.4),
                    ),
                  ),
                ],
              ),
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

class _DocumentTile extends StatelessWidget {
  final String label;
  final String description;
  final IconData icon;
  final XFile? file;
  final VoidCallback onTap;

  const _DocumentTile({
    required this.label,
    required this.description,
    required this.icon,
    required this.file,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final hasFile = file != null;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: hasFile
              ? AppColors.success.withValues(alpha: 0.06)
              : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: hasFile ? AppColors.success.withValues(alpha: 0.3) : AppColors.border,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: hasFile ? AppColors.success.withValues(alpha: 0.1) : AppColors.card,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                hasFile ? LucideIcons.checkCircle : icon,
                color: hasFile ? AppColors.success : AppColors.textMuted,
                size: 20,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: AppColors.textPrimary)),
                  const SizedBox(height: 2),
                  Text(
                    hasFile ? file!.name : description,
                    style: TextStyle(
                        fontSize: 12,
                        color: hasFile
                            ? AppColors.success
                            : AppColors.textMuted),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Icon(
              hasFile ? LucideIcons.refreshCw : LucideIcons.upload,
              size: 16,
              color: AppColors.textMuted,
            ),
          ],
        ),
      ),
    );
  }
}

class _ReviewSection extends StatelessWidget {
  final String title;
  final Map<String, String> items;
  const _ReviewSection({required this.title, required this.items});

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
        children: [
          Text(title,
              style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                  color: AppColors.accent)),
          const SizedBox(height: 12),
          ...items.entries.map((e) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 90,
                      child: Text(e.key,
                          style: const TextStyle(
                              fontSize: 13, color: AppColors.textMuted)),
                    ),
                    Expanded(
                      child: Text(
                        e.value.isEmpty ? '—' : e.value,
                        style: const TextStyle(
                            fontSize: 13, color: AppColors.textPrimary),
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}
