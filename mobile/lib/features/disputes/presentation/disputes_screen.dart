import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';

final _disputesProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  try {
    final response = await dio.get('/disputes', queryParameters: {'size': 50});
    if (response.data is List) return response.data as List;
    if (response.data is Map && response.data['content'] != null) {
      return response.data['content'] as List;
    }
    return [];
  } catch (_) {
    return [];
  }
});

class DisputesScreen extends ConsumerWidget {
  const DisputesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final disputes = ref.watch(_disputesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Disputes')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(_disputesProvider),
        child: disputes.when(
          data: (list) => list.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.gavel_outlined, size: 48, color: AppColors.textMuted),
                      const SizedBox(height: 12),
                      const Text('No disputes', style: TextStyle(color: AppColors.textSecondary, fontSize: 15)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: list.length,
                  itemBuilder: (_, i) => _DisputeCard(dispute: list[i]),
                ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => const Center(child: Text('Failed to load disputes')),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateDisputeDialog(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Open Dispute'),
      ),
    );
  }

  void _showCreateDisputeDialog(BuildContext context, WidgetRef ref) {
    final bookingIdController = TextEditingController();
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Open Dispute'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: bookingIdController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Booking ID'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              maxLines: 4,
              decoration: const InputDecoration(labelText: 'Reason', hintText: 'Describe the issue...'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final bookingId = int.tryParse(bookingIdController.text);
              if (bookingId == null || reasonController.text.trim().isEmpty) return;
              try {
                await ref.read(dioProvider).post('/disputes', data: {
                  'bookingId': bookingId,
                  'reason': reasonController.text.trim(),
                });
                if (context.mounted) Navigator.pop(context);
                ref.invalidate(_disputesProvider);
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Failed: $e')),
                  );
                }
              }
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }
}

class _DisputeCard extends StatelessWidget {
  final dynamic dispute;
  const _DisputeCard({required this.dispute});

  @override
  Widget build(BuildContext context) {
    final status = dispute['status']?.toString() ?? 'UNKNOWN';
    final reason = dispute['reason']?.toString() ?? '';
    final bookingId = dispute['bookingId']?.toString() ?? '';
    final createdAt = dispute['createdAt']?.toString() ?? '';
    final resolutionType = dispute['resolutionType']?.toString();
    final resolutionNotes = dispute['resolutionNotes']?.toString();

    final (statusColor, statusBg) = switch (status) {
      'OPEN' => (AppColors.warning, AppColors.warning.withValues(alpha: 0.1)),
      'UNDER_REVIEW' => (AppColors.info, AppColors.info.withValues(alpha: 0.1)),
      'RESOLVED' => (AppColors.success, AppColors.success.withValues(alpha: 0.1)),
      'CLOSED' || 'DISMISSED' => (AppColors.textSecondary, AppColors.divider),
      _ => (AppColors.textSecondary, AppColors.divider),
    };

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Booking #$bookingId', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(6)),
                  child: Text(status.replaceAll('_', ' '),
                      style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(reason, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4)),
            if (resolutionType != null && resolutionType != 'null') ...[
              const Divider(height: 16),
              Text('Resolution: $resolutionType', style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
              if (resolutionNotes != null && resolutionNotes != 'null' && resolutionNotes.isNotEmpty)
                Text(resolutionNotes, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
            ],
            if (createdAt.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(_formatDate(createdAt), style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
            ],
          ],
        ),
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso);
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return '';
    }
  }
}
