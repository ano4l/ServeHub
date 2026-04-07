import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/core/widgets/app_text_field.dart';
import 'package:serveify/features/addresses/data/address_repository.dart';

class AddressesScreen extends ConsumerWidget {
  const AddressesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final addresses = ref.watch(addressListProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Addresses'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.plus),
            onPressed: () => _showAddressSheet(context, ref),
            tooltip: 'Add Address',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(addressListProvider),
        child: addresses.when(
          data: (items) {
            if (items.isEmpty) {
              return _EmptyView(
                onAdd: () => _showAddressSheet(context, ref),
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
              itemCount: items.length,
              itemBuilder: (context, index) => _AddressCard(
                address: items[index],
                onEdit: () => _showAddressSheet(context, ref, address: items[index]),
                onDelete: () => _confirmDelete(context, ref, items[index]),
                onSetDefault: () => _setDefault(context, ref, items[index]),
              ),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(LucideIcons.wifiOff, size: 48, color: AppColors.textMuted),
                const SizedBox(height: 12),
                const Text('Unable to load addresses',
                    style: TextStyle(color: AppColors.textSecondary)),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () => ref.invalidate(addressListProvider),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddressSheet(context, ref),
        backgroundColor: AppColors.accent,
        foregroundColor: AppColors.primary,
        icon: const Icon(LucideIcons.plus, size: 18),
        label: const Text('Add Address',
            style: TextStyle(fontWeight: FontWeight.w600)),
      ),
    );
  }

  void _showAddressSheet(BuildContext context, WidgetRef ref,
      {AddressModel? address}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _AddressFormSheet(ref: ref, existing: address),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, AddressModel address) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Address'),
        content: Text('Remove "${address.label}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                await ref.read(addressRepositoryProvider).delete(address.id);
                ref.invalidate(addressListProvider);
              } on DioException catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    content: Text(ApiException.fromDioError(e).message),
                    backgroundColor: AppColors.error,
                  ));
                }
              }
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  Future<void> _setDefault(
      BuildContext context, WidgetRef ref, AddressModel address) async {
    try {
      await ref.read(addressRepositoryProvider).update(
            address.id,
            label: address.label,
            value: address.value,
            note: address.note,
            defaultAddress: true,
          );
      ref.invalidate(addressListProvider);
    } on DioException catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(ApiException.fromDioError(e).message),
          backgroundColor: AppColors.error,
        ));
      }
    }
  }
}

// ── Empty State ─────────────────────────────────────────────────────

class _EmptyView extends StatelessWidget {
  final VoidCallback onAdd;
  const _EmptyView({required this.onAdd});

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
                child: const Icon(LucideIcons.mapPin,
                    color: AppColors.accent, size: 32),
              ),
              const SizedBox(height: 20),
              const Text('No saved addresses',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              const Text(
                'Add your home, work, or other addresses for quick booking.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                    height: 1.4),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: onAdd,
                  icon: const Icon(LucideIcons.plus, size: 16),
                  label: const Text('Add Your First Address'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accent,
                    foregroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
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

// ── Address Card ────────────────────────────────────────────────────

class _AddressCard extends StatelessWidget {
  final AddressModel address;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onSetDefault;

  const _AddressCard({
    required this.address,
    required this.onEdit,
    required this.onDelete,
    required this.onSetDefault,
  });

  IconData get _icon {
    final l = address.label.toLowerCase();
    if (l.contains('home')) return LucideIcons.home;
    if (l.contains('work') || l.contains('office')) return LucideIcons.building;
    return LucideIcons.mapPin;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: address.defaultAddress
              ? AppColors.accent.withValues(alpha: 0.4)
              : AppColors.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 38, height: 38,
                decoration: BoxDecoration(
                  color: address.defaultAddress
                      ? AppColors.accentLight
                      : AppColors.card,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(_icon,
                    size: 18,
                    color: address.defaultAddress
                        ? AppColors.accent
                        : AppColors.textMuted),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(address.label,
                            style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary)),
                        if (address.defaultAddress) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.accentLight,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('Default',
                                style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.accent)),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(address.value,
                        style: const TextStyle(
                            fontSize: 13, color: AppColors.textSecondary),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                icon: const Icon(LucideIcons.moreVertical,
                    size: 18, color: AppColors.textMuted),
                onSelected: (action) {
                  switch (action) {
                    case 'edit':
                      onEdit();
                      break;
                    case 'default':
                      onSetDefault();
                      break;
                    case 'delete':
                      onDelete();
                      break;
                  }
                },
                itemBuilder: (_) => [
                  const PopupMenuItem(
                      value: 'edit',
                      child: Row(children: [
                        Icon(LucideIcons.edit3, size: 16),
                        SizedBox(width: 8),
                        Text('Edit'),
                      ])),
                  if (!address.defaultAddress)
                    const PopupMenuItem(
                        value: 'default',
                        child: Row(children: [
                          Icon(LucideIcons.star, size: 16),
                          SizedBox(width: 8),
                          Text('Set as Default'),
                        ])),
                  const PopupMenuItem(
                      value: 'delete',
                      child: Row(children: [
                        Icon(LucideIcons.trash2, size: 16,
                            color: AppColors.error),
                        SizedBox(width: 8),
                        Text('Delete',
                            style: TextStyle(color: AppColors.error)),
                      ])),
                ],
              ),
            ],
          ),
          if (address.note != null && address.note!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.stickyNote,
                      size: 12, color: AppColors.textMuted),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(address.note!,
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.textSecondary)),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Add / Edit Sheet ────────────────────────────────────────────────

class _AddressFormSheet extends StatefulWidget {
  final WidgetRef ref;
  final AddressModel? existing;
  const _AddressFormSheet({required this.ref, this.existing});

  @override
  State<_AddressFormSheet> createState() => _AddressFormSheetState();
}

class _AddressFormSheetState extends State<_AddressFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _labelCtrl;
  late final TextEditingController _valueCtrl;
  late final TextEditingController _noteCtrl;
  late bool _isDefault;
  bool _submitting = false;

  bool get _isEditing => widget.existing != null;

  static const _quickLabels = ['Home', 'Work', 'Office', 'Other'];

  @override
  void initState() {
    super.initState();
    _labelCtrl = TextEditingController(text: widget.existing?.label ?? '');
    _valueCtrl = TextEditingController(text: widget.existing?.value ?? '');
    _noteCtrl = TextEditingController(text: widget.existing?.note ?? '');
    _isDefault = widget.existing?.defaultAddress ?? true;
  }

  @override
  void dispose() {
    _labelCtrl.dispose();
    _valueCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);

    try {
      final repo = widget.ref.read(addressRepositoryProvider);
      if (_isEditing) {
        await repo.update(
          widget.existing!.id,
          label: _labelCtrl.text.trim(),
          value: _valueCtrl.text.trim(),
          note: _noteCtrl.text.trim(),
          defaultAddress: _isDefault,
        );
      } else {
        await repo.create(
          label: _labelCtrl.text.trim(),
          value: _valueCtrl.text.trim(),
          note: _noteCtrl.text.trim(),
          defaultAddress: _isDefault,
        );
      }
      widget.ref.invalidate(addressListProvider);
      if (mounted) Navigator.pop(context);
    } on DioException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(ApiException.fromDioError(error).message),
          backgroundColor: AppColors.error,
        ));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
          24, 16, 24, MediaQuery.of(context).viewInsets.bottom + 24),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(_isEditing ? 'Edit Address' : 'Add New Address',
                  style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary)),
              const SizedBox(height: 4),
              Text(
                _isEditing
                    ? 'Update your saved address'
                    : 'Save an address for quick booking',
                style: const TextStyle(
                    fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 20),

              // Quick label chips
              const Text('Label',
                  style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textSecondary)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _quickLabels.map((label) {
                  final selected = _labelCtrl.text == label;
                  return ChoiceChip(
                    label: Text(label),
                    selected: selected,
                    onSelected: (_) =>
                        setState(() => _labelCtrl.text = label),
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
                        color:
                            selected ? AppColors.accent : AppColors.border,
                      ),
                    ),
                    visualDensity: VisualDensity.compact,
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              AppTextField(
                controller: _labelCtrl,
                label: 'Custom Label',
                hint: 'e.g. Mom\'s House',
                textInputAction: TextInputAction.next,
                prefixIcon: const Icon(LucideIcons.tag, size: 18),
                validator: (v) =>
                    (v == null || v.isEmpty) ? 'Label is required' : null,
              ),
              const SizedBox(height: 14),
              AppTextField(
                controller: _valueCtrl,
                label: 'Address',
                hint: '123 Main St, Suburb, City',
                maxLines: 2,
                textInputAction: TextInputAction.next,
                prefixIcon: const Icon(LucideIcons.mapPin, size: 18),
                validator: (v) =>
                    (v == null || v.isEmpty) ? 'Address is required' : null,
              ),
              const SizedBox(height: 14),
              AppTextField(
                controller: _noteCtrl,
                label: 'Note (optional)',
                hint: 'Gate code, landmark, etc.',
                textInputAction: TextInputAction.done,
                prefixIcon: const Icon(LucideIcons.stickyNote, size: 18),
              ),
              const SizedBox(height: 14),
              GestureDetector(
                onTap: () => setState(() => _isDefault = !_isDefault),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: _isDefault
                        ? AppColors.accent.withValues(alpha: 0.06)
                        : AppColors.card,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _isDefault
                          ? AppColors.accent.withValues(alpha: 0.3)
                          : AppColors.border,
                    ),
                  ),
                  child: Row(
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: 22, height: 22,
                        decoration: BoxDecoration(
                          color: _isDefault
                              ? AppColors.accent
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: _isDefault
                                ? AppColors.accent
                                : AppColors.textMuted,
                            width: 1.5,
                          ),
                        ),
                        child: _isDefault
                            ? const Icon(Icons.check,
                                size: 14, color: Colors.white)
                            : null,
                      ),
                      const SizedBox(width: 10),
                      const Text('Set as default address',
                          style: TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accent,
                    foregroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _submitting
                      ? const SizedBox(
                          width: 20, height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(_isEditing ? 'Save Changes' : 'Add Address',
                          style: const TextStyle(
                              fontWeight: FontWeight.w600, fontSize: 15)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
