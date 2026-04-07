import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/features/payment/data/payment_repository.dart';
import 'package:url_launcher/url_launcher.dart';

class PaymentCheckoutScreen extends ConsumerStatefulWidget {
  final int bookingId;
  final double amount;
  final String serviceName;

  const PaymentCheckoutScreen({
    super.key,
    required this.bookingId,
    required this.amount,
    required this.serviceName,
  });

  @override
  ConsumerState<PaymentCheckoutScreen> createState() => _PaymentCheckoutScreenState();
}

class _PaymentCheckoutScreenState extends ConsumerState<PaymentCheckoutScreen> {
  bool _loading = true;
  bool _error = false;
  String? _checkoutUrl;
  String? _reference;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _initiateCheckout();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _initiateCheckout() async {
    try {
      final repo = ref.read(paymentRepositoryProvider);
      final result = await repo.createPayFastCheckout(widget.bookingId);

      setState(() {
        _checkoutUrl = result.checkoutUrl;
        _reference = result.reference;
        _loading = false;
      });

      // Start polling for payment status
      _startPolling();
    } catch (e) {
      setState(() {
        _loading = false;
        _error = true;
      });
    }
  }

  void _startPolling() {
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) async {
      try {
        final repo = ref.read(paymentRepositoryProvider);
        final status = await repo.getPaymentStatus(widget.bookingId);

        if (status.isAuthorized) {
          _pollTimer?.cancel();
          if (mounted) {
            _showSuccessAndNavigate();
          }
        }
      } catch (_) {
        // Continue polling
      }
    });
  }

  Future<void> _launchPayFast() async {
    if (_checkoutUrl == null) return;

    final uri = Uri.parse(_checkoutUrl!);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      // Fallback: show URL in dialog for manual copy
      if (mounted) {
        showDialog(
          context: context,
          builder: (_) => AlertDialog(
            title: const Text('PayFast Checkout'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Please open this URL to complete payment:'),
                const SizedBox(height: 8),
                SelectableText(_checkoutUrl!),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    }
  }

  void _showSuccessAndNavigate() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        icon: const Icon(Icons.check_circle, color: AppColors.success, size: 48),
        title: const Text('Payment Successful'),
        content: const Text('Your booking is confirmed and payment has been received.'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.go('/bookings');
            },
            child: const Text('View Bookings'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(title: const Text('Payment')),
        body: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Preparing checkout...'),
            ],
          ),
        ),
      );
    }

    if (_error) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(title: const Text('Payment')),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(LucideIcons.alertCircle, color: AppColors.error, size: 48),
              const SizedBox(height: 16),
              const Text('Failed to initiate payment'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _initiateCheckout,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Complete Payment'),
        actions: [
          TextButton(
            onPressed: () => context.go('/bookings'),
            child: const Text('Cancel'),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surfaceAlt,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  const Icon(LucideIcons.creditCard, size: 48, color: AppColors.accent),
                  const SizedBox(height: 16),
                  Text(
                    'R${widget.amount.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.serviceName,
                    style: const TextStyle(color: AppColors.textSecondary),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'You will be redirected to PayFast to complete your payment securely.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _launchPayFast,
              icon: const Icon(LucideIcons.externalLink),
              label: const Text('Pay with PayFast'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accent,
                foregroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.info.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.info, size: 16, color: AppColors.info),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Ref: ${_reference ?? "N/A"}',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
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
