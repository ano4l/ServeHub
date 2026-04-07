import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/network/api_client.dart';

final paymentRepositoryProvider = Provider<PaymentRepository>((ref) {
  return PaymentRepository(ref.read(dioProvider));
});

class PaymentRepository {
  final Dio _dio;

  PaymentRepository(this._dio);

  Future<CheckoutResult> createPayFastCheckout(int bookingId) async {
    final response = await _dio.post('/payfast/checkout', data: {
      'bookingId': bookingId,
    });
    return CheckoutResult.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  /// Backwards-compatible alias while we phase old callers out.
  Future<CheckoutResult> initiateCheckout(int bookingId) =>
      createPayFastCheckout(bookingId);

  Future<PaymentStatus> getPaymentStatus(int bookingId) async {
    try {
      final response = await _dio.get('/payments/booking/$bookingId');
      return PaymentStatus.fromJson(
        Map<String, dynamic>.from(response.data as Map),
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return PaymentStatus.notFound();
      }
      rethrow;
    }
  }

  Future<PaymentStatus> authorizePayment(int bookingId) async {
    final response = await _dio.post('/payments/booking/$bookingId/authorize');
    return PaymentStatus.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<PaymentResolution> resolvePayment(
    int bookingId, {
    required String method,
    bool externalCheckout = false,
  }) async {
    if (method == 'cash') {
      return PaymentResolution(
        status: await getPaymentStatus(bookingId),
        gateway: PaymentGateway.none,
      );
    }

    if (externalCheckout) {
      return PaymentResolution(
        status: await getPaymentStatus(bookingId),
        gateway: PaymentGateway.payfast,
        checkout: await createPayFastCheckout(bookingId),
      );
    }

    return PaymentResolution(
      status: await authorizePayment(bookingId),
      gateway: PaymentGateway.direct,
    );
  }
}

enum PaymentGateway { none, direct, payfast }

class PaymentResolution {
  final PaymentStatus status;
  final PaymentGateway gateway;
  final CheckoutResult? checkout;

  const PaymentResolution({
    required this.status,
    required this.gateway,
    this.checkout,
  });

  bool get requiresExternalCheckout =>
      gateway == PaymentGateway.payfast && checkout != null;
}

class CheckoutResult {
  final String checkoutUrl;
  final String reference;
  final int paymentId;

  CheckoutResult({
    required this.checkoutUrl,
    required this.reference,
    required this.paymentId,
  });

  factory CheckoutResult.fromJson(Map<String, dynamic> json) {
    return CheckoutResult(
      checkoutUrl: json['checkoutUrl'] as String,
      reference: json['reference'] as String,
      paymentId: (json['paymentId'] as num).toInt(),
    );
  }
}

class PaymentStatus {
  final int id;
  final int bookingId;
  final String status;
  final double grossAmount;
  final double commissionAmount;
  final double providerNetAmount;
  final String reference;
  final String? updatedAt;

  PaymentStatus({
    required this.id,
    required this.bookingId,
    required this.status,
    required this.grossAmount,
    required this.commissionAmount,
    required this.providerNetAmount,
    required this.reference,
    this.updatedAt,
  });

  factory PaymentStatus.fromJson(Map<String, dynamic> json) {
    return PaymentStatus(
      id: (json['id'] as num).toInt(),
      bookingId: (json['bookingId'] as num).toInt(),
      status: json['status'] as String,
      grossAmount: (json['grossAmount'] as num).toDouble(),
      commissionAmount: (json['commissionAmount'] as num).toDouble(),
      providerNetAmount: (json['providerNetAmount'] as num).toDouble(),
      reference: json['reference'] as String,
      updatedAt: json['updatedAt'] as String?,
    );
  }

  factory PaymentStatus.notFound() {
    return PaymentStatus(
      id: 0,
      bookingId: 0,
      status: 'NOT_FOUND',
      grossAmount: 0,
      commissionAmount: 0,
      providerNetAmount: 0,
      reference: '',
    );
  }

  bool get isAuthorized => status == 'AUTHORIZED' || status == 'CAPTURED';
  bool get isCaptured => status == 'CAPTURED';
  bool get isRefunded => status == 'REFUNDED';
  bool get isPending => status == 'INITIATED';
}
