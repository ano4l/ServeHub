import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/core/widgets/app_text_field.dart';
import 'package:serveify/features/auth/providers/auth_provider.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _cityController = TextEditingController();
  final _bioController = TextEditingController();
  final _radiusController = TextEditingController();

  bool _loading = false;
  bool _initialized = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _cityController.dispose();
    _bioController.dispose();
    _radiusController.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    if (_initialized) return;
    _initialized = true;

    final auth = ref.read(authProvider);
    final endpoint = auth.isProvider ? '/providers/me' : '/customers/me';

    try {
      final response = await ref.read(dioProvider).get(endpoint);
      final data = Map<String, dynamic>.from(response.data as Map);
      _nameController.text = data['fullName']?.toString() ?? '';
      _emailController.text = data['email']?.toString() ?? '';
      _phoneController.text = data['phoneNumber']?.toString() ?? '';
      _cityController.text = data['city']?.toString() ?? '';
      _bioController.text = data['bio']?.toString() ?? '';
      _radiusController.text = data['serviceRadiusKm']?.toString() ?? '';
      if (mounted) setState(() {});
    } catch (_) {}
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    final auth = ref.read(authProvider);
    final dio = ref.read(dioProvider);

    try {
      if (auth.isProvider) {
        await dio.put('/providers/me', data: {
          'bio': _bioController.text.trim(),
          'city': _cityController.text.trim(),
          'serviceRadiusKm': int.tryParse(_radiusController.text.trim()),
        });
      } else {
        await dio.put('/customers/me', data: {
          'fullName': _nameController.text.trim(),
          'email': _emailController.text.trim(),
          'phoneNumber': _phoneController.text.trim(),
        });
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.pop(context, true);
      }
    } on DioException catch (error) {
      setState(() {
        _error = ApiException.fromDioError(error).message;
        _loading = false;
      });
    } catch (error) {
      setState(() {
        _error = error.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    _loadProfile();
    final auth = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Edit Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_error != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    _error!,
                    style: const TextStyle(color: AppColors.error, fontSize: 13),
                  ),
                ),
              if (!auth.isProvider) ...[
                AppTextField(
                  controller: _nameController,
                  label: 'Full Name',
                  hint: 'Your full name',
                  prefixIcon: const Icon(Icons.person_outline),
                  validator: (value) =>
                      (value == null || value.isEmpty) ? 'Name is required' : null,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  controller: _emailController,
                  label: 'Email',
                  hint: 'you@example.com',
                  prefixIcon: const Icon(Icons.email_outlined),
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) =>
                      (value == null || value.isEmpty) ? 'Email is required' : null,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  controller: _phoneController,
                  label: 'Phone Number',
                  hint: '+27...',
                  prefixIcon: const Icon(Icons.phone_outlined),
                  keyboardType: TextInputType.phone,
                  validator: (value) =>
                      (value == null || value.isEmpty) ? 'Phone is required' : null,
                ),
              ] else ...[
                AppTextField(
                  controller: _cityController,
                  label: 'City',
                  hint: 'Johannesburg',
                  prefixIcon: const Icon(Icons.location_city_outlined),
                  validator: (value) =>
                      (value == null || value.isEmpty) ? 'City is required' : null,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  controller: _radiusController,
                  label: 'Service Radius (km)',
                  hint: '25',
                  prefixIcon: const Icon(Icons.map_outlined),
                  keyboardType: TextInputType.number,
                  validator: (value) =>
                      (value == null || value.isEmpty) ? 'Radius is required' : null,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  controller: _bioController,
                  label: 'Bio',
                  hint: 'Describe your services',
                  prefixIcon: const Icon(Icons.badge_outlined),
                  maxLines: 4,
                  validator: (value) =>
                      (value == null || value.isEmpty) ? 'Bio is required' : null,
                ),
              ],
              const SizedBox(height: 32),
              SizedBox(
                height: 50,
                child: ElevatedButton(
                  onPressed: _loading ? null : _save,
                  child: _loading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Save Changes'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
