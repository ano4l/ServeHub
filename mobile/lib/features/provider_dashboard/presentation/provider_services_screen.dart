import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/core/widgets/app_text_field.dart';
import 'package:serveify/features/auth/providers/auth_provider.dart';
import 'package:serveify/features/services/data/service_catalog_provider.dart';

const _serviceCategories = <String>[
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

class ProviderServicesScreen extends ConsumerWidget {
  const ProviderServicesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final providerId = int.tryParse(auth.providerId ?? '');

    if (providerId == null) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                LucideIcons.alertCircle,
                size: 48,
                color: AppColors.textMuted,
              ),
              SizedBox(height: 12),
              Text(
                'Provider profile not available',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    final services = ref.watch(providerServiceCatalogProvider(providerId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Services'),
        actions: [
          IconButton(
            onPressed: () => _openServiceEditor(
              context,
              ref,
              providerId: providerId,
            ),
            icon: const Icon(LucideIcons.plus),
            tooltip: 'Add service',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(providerServiceCatalogProvider(providerId));
          ref.invalidate(serviceCatalogProvider);
        },
        child: services.when(
          data: (items) {
            if (items.isEmpty) {
              return _EmptyServicesView(
                onAdd: () => _openServiceEditor(
                  context,
                  ref,
                  providerId: providerId,
                ),
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
              itemCount: items.length,
              itemBuilder: (context, index) {
                final service = items[index];
                return _ServiceCard(
                  service: service,
                  onEdit: () => _openServiceEditor(
                    context,
                    ref,
                    providerId: providerId,
                    service: service,
                  ),
                  onDelete: () => _confirmDeleteService(
                    context,
                    ref,
                    providerId: providerId,
                    service: service,
                  ),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    LucideIcons.wifiOff,
                    size: 48,
                    color: AppColors.textMuted,
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Unable to load services',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () =>
                        ref.invalidate(providerServiceCatalogProvider(providerId)),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openServiceEditor(
          context,
          ref,
          providerId: providerId,
        ),
        backgroundColor: AppColors.accent,
        foregroundColor: AppColors.primary,
        icon: const Icon(LucideIcons.plus, size: 18),
        label: const Text(
          'Add Service',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
    );
  }

  Future<void> _openServiceEditor(
    BuildContext context,
    WidgetRef ref, {
    required int providerId,
    ServiceOfferingModel? service,
  }) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _ServiceEditorSheet(
        providerId: providerId,
        service: service,
      ),
    );

    ref.invalidate(providerServiceCatalogProvider(providerId));
    ref.invalidate(serviceCatalogProvider);
    if (service != null) {
      ref.invalidate(serviceOfferingProvider(service.id));
    }
  }

  Future<void> _confirmDeleteService(
    BuildContext context,
    WidgetRef ref, {
    required int providerId,
    required ServiceOfferingModel service,
  }) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Delete service?'),
          content: Text(
            'Remove ${service.serviceName} from your published offerings?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton.tonal(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) {
      return;
    }

    try {
      await ref
          .read(serviceCatalogRepositoryProvider)
          .deleteOffering(service.id);
      ref.invalidate(providerServiceCatalogProvider(providerId));
      ref.invalidate(serviceCatalogProvider);
      ref.invalidate(serviceOfferingProvider(service.id));
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${service.serviceName} deleted')),
        );
      }
    } on DioException catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ApiException.fromDioError(error).message)),
        );
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    }
  }
}

class _EmptyServicesView extends StatelessWidget {
  final VoidCallback onAdd;

  const _EmptyServicesView({required this.onAdd});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(32),
      children: [
        const SizedBox(height: 60),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.surfaceAlt,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.accentLight,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(
                  LucideIcons.briefcase,
                  color: AppColors.accent,
                  size: 32,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'No services yet',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Add your first service to start receiving bookings from customers.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: onAdd,
                  icon: const Icon(LucideIcons.plus, size: 16),
                  label: const Text('Add your first service'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accent,
                    foregroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ServiceCard extends StatelessWidget {
  final ServiceOfferingModel service;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _ServiceCard({
    required this.service,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isHourly = service.pricingType == 'HOURLY';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      service.serviceName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      service.category,
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              PopupMenuButton<_ServiceCardAction>(
                onSelected: (action) {
                  if (action == _ServiceCardAction.edit) {
                    onEdit();
                  } else {
                    onDelete();
                  }
                },
                itemBuilder: (context) => const [
                  PopupMenuItem(
                    value: _ServiceCardAction.edit,
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Icon(Icons.edit_outlined),
                      title: Text('Edit'),
                    ),
                  ),
                  PopupMenuItem(
                    value: _ServiceCardAction.delete,
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Icon(Icons.delete_outline),
                      title: Text('Delete'),
                    ),
                  ),
                ],
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.more_horiz_rounded,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _InfoChip(
                icon: LucideIcons.creditCard,
                label: service.priceLabel + (isHourly ? '/hr' : ''),
              ),
              _InfoChip(
                icon: LucideIcons.clock,
                label: service.durationLabel,
              ),
              _InfoChip(
                icon: LucideIcons.tag,
                label: isHourly ? 'Hourly' : 'Fixed',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

enum _ServiceCardAction { edit, delete }

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoChip({
    required this.icon,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: AppColors.textMuted),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _ServiceEditorSheet extends ConsumerStatefulWidget {
  final int providerId;
  final ServiceOfferingModel? service;

  const _ServiceEditorSheet({
    required this.providerId,
    this.service,
  });

  @override
  ConsumerState<_ServiceEditorSheet> createState() => _ServiceEditorSheetState();
}

class _ServiceEditorSheetState extends ConsumerState<_ServiceEditorSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _categoryController;
  late final TextEditingController _priceController;
  late final TextEditingController _durationController;

  late String _pricingType;
  bool _submitting = false;

  bool get _editing => widget.service != null;

  @override
  void initState() {
    super.initState();
    final service = widget.service;
    _nameController = TextEditingController(text: service?.serviceName ?? '');
    _categoryController = TextEditingController(text: service?.category ?? '');
    _priceController = TextEditingController(
      text: service == null ? '' : service.price.toStringAsFixed(2),
    );
    _durationController = TextEditingController(
      text: (service?.estimatedDurationMinutes ?? 60).toString(),
    );
    _pricingType = service?.pricingType ?? 'FIXED';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _categoryController.dispose();
    _priceController.dispose();
    _durationController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_submitting || !_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _submitting = true);

    try {
      final repository = ref.read(serviceCatalogRepositoryProvider);
      final price = double.parse(_priceController.text.trim());
      final duration = int.parse(_durationController.text.trim());

      if (_editing) {
        await repository.updateOffering(
          offeringId: widget.service!.id,
          category: _categoryController.text.trim(),
          serviceName: _nameController.text.trim(),
          pricingType: _pricingType,
          price: price,
          estimatedDurationMinutes: duration,
        );
      } else {
        await repository.createOffering(
          providerId: widget.providerId,
          category: _categoryController.text.trim(),
          serviceName: _nameController.text.trim(),
          pricingType: _pricingType,
          price: price,
          estimatedDurationMinutes: duration,
        );
      }

      ref.invalidate(providerServiceCatalogProvider(widget.providerId));
      ref.invalidate(serviceCatalogProvider);
      if (_editing) {
        ref.invalidate(serviceOfferingProvider(widget.service!.id));
      }

      if (!mounted) {
        return;
      }

      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _editing ? 'Service updated' : 'Service created',
          ),
        ),
      );
    } on DioException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ApiException.fromDioError(error).message)),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        24,
        16,
        24,
        MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                _editing ? 'Edit service' : 'Add new service',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                _editing
                    ? 'Update pricing, duration, or category for this offering.'
                    : 'Create a service offering for customers to book.',
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 24),
              AppTextField(
                controller: _nameController,
                label: 'Service name',
                hint: 'e.g. Pipe repair, house cleaning',
                textInputAction: TextInputAction.next,
                prefixIcon: const Icon(LucideIcons.wrench, size: 18),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 14),
              const Text(
                'Category',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _serviceCategories.map((category) {
                  final selected = _categoryController.text == category;
                  return ChoiceChip(
                    label: Text(category),
                    selected: selected,
                    onSelected: (_) {
                      setState(() => _categoryController.text = category);
                    },
                    selectedColor: AppColors.accentLight,
                    labelStyle: TextStyle(
                      color: selected
                          ? AppColors.accent
                          : AppColors.textSecondary,
                      fontWeight:
                          selected ? FontWeight.w600 : FontWeight.w400,
                      fontSize: 12,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                      side: BorderSide(
                        color: selected ? AppColors.accent : AppColors.border,
                      ),
                    ),
                    visualDensity: VisualDensity.compact,
                  );
                }).toList(),
              ),
              const SizedBox(height: 8),
              AppTextField(
                controller: _categoryController,
                label: 'Category',
                hint: 'Choose a chip or type your own',
                textInputAction: TextInputAction.next,
                prefixIcon: const Icon(LucideIcons.tag, size: 18),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      controller: _priceController,
                      label: 'Price (R)',
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      textInputAction: TextInputAction.next,
                      prefixIcon:
                          const Icon(LucideIcons.banknote, size: 18),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Required';
                        }
                        if (double.tryParse(value.trim()) == null) {
                          return 'Invalid';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppTextField(
                      controller: _durationController,
                      label: 'Duration (min)',
                      keyboardType: TextInputType.number,
                      textInputAction: TextInputAction.done,
                      prefixIcon: const Icon(LucideIcons.clock, size: 18),
                      validator: (value) {
                        final minutes = int.tryParse(value?.trim() ?? '');
                        if (minutes == null) {
                          return 'Invalid';
                        }
                        if (minutes < 15) {
                          return 'Min 15';
                        }
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              const Text(
                'Pricing type',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  _PricingToggle(
                    label: 'Fixed price',
                    icon: LucideIcons.tag,
                    selected: _pricingType == 'FIXED',
                    onTap: () => setState(() => _pricingType = 'FIXED'),
                  ),
                  const SizedBox(width: 10),
                  _PricingToggle(
                    label: 'Hourly rate',
                    icon: LucideIcons.clock,
                    selected: _pricingType == 'HOURLY',
                    onTap: () => setState(() => _pricingType = 'HOURLY'),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accent,
                    foregroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: _submitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(
                          _editing ? 'Save changes' : 'Create service',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PricingToggle extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _PricingToggle({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: selected ? AppColors.accentLight : AppColors.card,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? AppColors.accent : AppColors.border,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 16,
                color: selected ? AppColors.accent : AppColors.textMuted,
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight:
                      selected ? FontWeight.w600 : FontWeight.w400,
                  color: selected
                      ? AppColors.accent
                      : AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
