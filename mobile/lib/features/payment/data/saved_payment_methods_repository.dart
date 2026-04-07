import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/network/api_client.dart';

final savedPaymentMethodsRepositoryProvider =
    Provider<SavedPaymentMethodsRepository>((ref) {
  return SavedPaymentMethodsRepository(ref.read(dioProvider));
});

final savedPaymentMethodsProvider =
    FutureProvider<List<SavedPaymentMethodModel>>((ref) async {
  return ref.read(savedPaymentMethodsRepositoryProvider).listPaymentMethods();
});

class SavedPaymentMethodsRepository {
  final Dio _dio;

  SavedPaymentMethodsRepository(this._dio);

  Future<List<SavedPaymentMethodModel>> listPaymentMethods() async {
    final response = await _dio.get('/customers/me/payment-methods');
    final list = response.data as List? ?? const <dynamic>[];
    return list
        .whereType<Map>()
        .map(
          (entry) => SavedPaymentMethodModel.fromJson(
            Map<String, dynamic>.from(entry),
          ),
        )
        .toList();
  }

  Future<SavedPaymentMethodModel> createPaymentMethod({
    required String holderName,
    required String cardNumber,
    required String expiry,
    required bool defaultMethod,
  }) async {
    final response = await _dio.post(
      '/customers/me/payment-methods',
      data: {
        'holderName': holderName,
        'cardNumber': cardNumber,
        'expiry': expiry,
        'defaultMethod': defaultMethod,
      },
    );
    return SavedPaymentMethodModel.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<SavedPaymentMethodModel> setDefaultPaymentMethod(
    int paymentMethodId,
  ) async {
    final response = await _dio.put(
      '/customers/me/payment-methods/$paymentMethodId',
      data: {'defaultMethod': true},
    );
    return SavedPaymentMethodModel.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<void> deletePaymentMethod(int paymentMethodId) async {
    await _dio.delete('/customers/me/payment-methods/$paymentMethodId');
  }
}

class SavedPaymentMethodModel {
  final int id;
  final String brand;
  final String last4;
  final String holderName;
  final String expiry;
  final bool defaultMethod;

  const SavedPaymentMethodModel({
    required this.id,
    required this.brand,
    required this.last4,
    required this.holderName,
    required this.expiry,
    required this.defaultMethod,
  });

  factory SavedPaymentMethodModel.fromJson(Map<String, dynamic> json) {
    return SavedPaymentMethodModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      brand: json['brand']?.toString() ?? 'Card',
      last4: json['last4']?.toString() ?? '0000',
      holderName: json['holderName']?.toString() ?? '',
      expiry: json['expiry']?.toString() ?? '',
      defaultMethod: json['defaultMethod'] == true,
    );
  }

  String get maskedLabel => '$brand ending in $last4';
}
