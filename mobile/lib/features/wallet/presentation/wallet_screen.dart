import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';

final _balanceProvider = FutureProvider<String>((ref) async {
  final dio = ref.read(dioProvider);
  try {
    final response = await dio.get('/wallet/balance');
    return response.data['balance']?.toString() ?? '0.00';
  } catch (_) {
    return '0.00';
  }
});

final _transactionsProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  try {
    final response = await dio.get('/wallet/transactions', queryParameters: {'size': 50});
    if (response.data is List) return response.data as List;
    if (response.data is Map && response.data['content'] != null) {
      return response.data['content'] as List;
    }
    return [];
  } catch (_) {
    return [];
  }
});

class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final balance = ref.watch(_balanceProvider);
    final transactions = ref.watch(_transactionsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Wallet')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(_balanceProvider);
          ref.invalidate(_transactionsProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Balance card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
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
                  const Text('Available Balance',
                      style: TextStyle(color: Colors.white70, fontSize: 14)),
                  const SizedBox(height: 4),
                  balance.when(
                    data: (b) => Text('R$b',
                        style: const TextStyle(
                            color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold)),
                    loading: () => const SizedBox(
                        height: 36,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white)),
                    error: (_, __) => const Text('R0.00',
                        style: TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => _showPayoutDialog(context, ref),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.primary,
                      ),
                      child: const Text('Request Payout'),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Transaction history
            Text('Transaction History',
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),

            transactions.when(
              data: (list) => list.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Column(
                          children: [
                            Icon(Icons.receipt_long_outlined,
                                size: 48, color: AppColors.textMuted),
                            const SizedBox(height: 12),
                            const Text('No transactions yet',
                                style: TextStyle(
                                    color: AppColors.textSecondary, fontSize: 15)),
                          ],
                        ),
                      ),
                    )
                  : Column(
                      children: list
                          .map<Widget>((t) => _TransactionTile(transaction: t))
                          .toList(),
                    ),
              loading: () => const Center(
                  child: Padding(
                      padding: EdgeInsets.all(32),
                      child: CircularProgressIndicator())),
              error: (_, __) => const Center(child: Text('Failed to load')),
            ),
          ],
        ),
      ),
    );
  }

  void _showPayoutDialog(BuildContext context, WidgetRef ref) {
    final amountController = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Request Payout'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Enter the amount you want to withdraw (ZAR).',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
            const SizedBox(height: 16),
            TextField(
              controller: amountController,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Amount (R)',
                prefixText: 'R ',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final amount = double.tryParse(amountController.text);
              if (amount == null || amount <= 0) return;
              try {
                await ref.read(dioProvider).post('/wallet/payout',
                    data: {'amount': amount});
                if (context.mounted) Navigator.pop(context);
                ref.invalidate(_balanceProvider);
                ref.invalidate(_transactionsProvider);
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Payout failed: $e')),
                  );
                }
              }
            },
            child: const Text('Request'),
          ),
        ],
      ),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  final dynamic transaction;
  const _TransactionTile({required this.transaction});

  @override
  Widget build(BuildContext context) {
    final type = transaction['type']?.toString() ?? '';
    final amount = transaction['amount']?.toString() ?? '0';
    final description =
        transaction['description']?.toString() ?? type;
    final createdAt = transaction['createdAt']?.toString() ?? '';
    final balanceAfter = transaction['balanceAfter']?.toString();

    final isCredit =
        type == 'EARNING' || type == 'REFUND' || type == 'CREDIT';
    final icon = isCredit ? Icons.arrow_downward : Icons.arrow_upward;
    final color = isCredit ? AppColors.success : AppColors.error;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        title: Text(description,
            style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
        subtitle: Text(_formatDate(createdAt),
            style:
                const TextStyle(fontSize: 12, color: AppColors.textMuted)),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${isCredit ? '+' : '-'}R$amount',
              style: TextStyle(
                  fontWeight: FontWeight.w600, color: color, fontSize: 14),
            ),
            if (balanceAfter != null && balanceAfter != 'null')
              Text('Bal: R$balanceAfter',
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.textMuted)),
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
