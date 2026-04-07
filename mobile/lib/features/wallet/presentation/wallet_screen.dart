import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';

final _balanceProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  final response = await dio.get('/wallet/balance');
  return response.data is Map<String, dynamic>
      ? Map<String, dynamic>.from(response.data)
      : const <String, dynamic>{};
});

final _transactionsProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  final response = await dio.get('/wallet/transactions', queryParameters: {'size': 50});
  if (response.data is List) return response.data as List;
  if (response.data is Map && response.data['content'] != null) {
    return response.data['content'] as List;
  }
  return [];
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
            balance.when(
              data: (data) {
                final available = _formatAmount(data['available']);
                final pending = _formatAmount(data['pending']);
                final total = _formatAmount(data['totalEarnings']);
                return Container(
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
                      const Text(
                        'Available Balance',
                        style: TextStyle(color: Colors.white70, fontSize: 14),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        available,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(child: _BalanceStat(label: 'Pending', value: pending)),
                          const SizedBox(width: 12),
                          Expanded(child: _BalanceStat(label: 'Total Earned', value: total)),
                        ],
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
                );
              },
              loading: () => const SizedBox(
                height: 220,
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (error, _) => Padding(
                padding: const EdgeInsets.all(24),
                child: Text('Failed to load wallet balance: $error'),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Transaction History',
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            transactions.when(
              data: (list) => list.isEmpty
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32),
                        child: Column(
                          children: [
                            Icon(
                              Icons.receipt_long_outlined,
                              size: 48,
                              color: AppColors.textMuted,
                            ),
                            SizedBox(height: 12),
                            Text(
                              'No transactions yet',
                              style: TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 15,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : Column(
                      children: list
                          .map<Widget>((transaction) => _TransactionTile(transaction: transaction))
                          .toList(),
                    ),
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(),
                ),
              ),
              error: (error, _) => Center(child: Text('Failed to load: $error')),
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
        content: TextField(
          controller: amountController,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: const InputDecoration(
            labelText: 'Amount (R)',
            prefixText: 'R ',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final amount = double.tryParse(amountController.text);
              if (amount == null || amount <= 0) return;

              try {
                await ref.read(dioProvider).post(
                  '/wallet/payouts',
                  data: {'amount': amount},
                );
                if (context.mounted) {
                  Navigator.pop(context);
                }
                ref.invalidate(_balanceProvider);
                ref.invalidate(_transactionsProvider);
              } on DioException catch (error) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(ApiException.fromDioError(error).message)),
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

class _BalanceStat extends StatelessWidget {
  final String label;
  final String value;

  const _BalanceStat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
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
    final amount = _formatAmount(transaction['amount']);
    final description = transaction['description']?.toString() ?? type;
    final createdAt = transaction['createdAt']?.toString() ?? '';
    final balanceAfter = transaction['balanceAfter'];

    final isCredit = type == 'EARNING' || type == 'REFUND' || type == 'CREDIT';
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
        title: Text(
          description,
          style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
        ),
        subtitle: Text(
          _formatDate(createdAt),
          style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${isCredit ? '+' : '-'}$amount',
              style: TextStyle(fontWeight: FontWeight.w600, color: color, fontSize: 14),
            ),
            if (balanceAfter != null)
              Text(
                'Bal: ${_formatAmount(balanceAfter)}',
                style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
              ),
          ],
        ),
      ),
    );
  }
}

String _formatAmount(dynamic value) {
  final amount = value is num ? value.toDouble() : double.tryParse('$value') ?? 0;
  final whole = amount.truncateToDouble() == amount;
  return whole ? 'R${amount.toStringAsFixed(0)}' : 'R${amount.toStringAsFixed(2)}';
}

String _formatDate(String iso) {
  try {
    final date = DateTime.parse(iso).toLocal();
    return '${date.day}/${date.month}/${date.year}';
  } catch (_) {
    return '';
  }
}
