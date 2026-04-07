import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:serveify/core/network/api_client.dart';

class ServiceOfferingModel {
  final int id;
  final int providerId;
  final String providerName;
  final String category;
  final String serviceName;
  final String pricingType;
  final double price;
  final int estimatedDurationMinutes;

  const ServiceOfferingModel({
    required this.id,
    required this.providerId,
    required this.providerName,
    required this.category,
    required this.serviceName,
    required this.pricingType,
    required this.price,
    required this.estimatedDurationMinutes,
  });

  factory ServiceOfferingModel.fromJson(Map<String, dynamic> json) {
    final provider = json['provider'] is Map
        ? Map<String, dynamic>.from(json['provider'] as Map)
        : null;

    return ServiceOfferingModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      providerId:
          (json['providerId'] as num?)?.toInt() ??
          (provider?['id'] as num?)?.toInt() ??
          0,
      providerName:
          json['providerName']?.toString() ??
          provider?['fullName']?.toString() ??
          provider?['businessName']?.toString() ??
          'Provider',
      category:
          json['category']?.toString() ??
          json['categoryName']?.toString() ??
          'Service',
      serviceName:
          json['serviceName']?.toString() ??
          json['name']?.toString() ??
          'Service',
      pricingType: json['pricingType']?.toString() ?? 'FIXED',
      price:
          (json['price'] as num?)?.toDouble() ??
          (json['basePrice'] as num?)?.toDouble() ??
          0,
      estimatedDurationMinutes:
          (json['estimatedDurationMinutes'] as num?)?.toInt() ??
          (json['durationMinutes'] as num?)?.toInt() ??
          60,
    );
  }

  String get priceLabel {
    final whole = price.truncateToDouble() == price;
    return whole
        ? 'R${price.toStringAsFixed(0)}'
        : 'R${price.toStringAsFixed(2)}';
  }

  String get durationLabel {
    if (estimatedDurationMinutes >= 120 &&
        estimatedDurationMinutes % 60 == 0) {
      return '${estimatedDurationMinutes ~/ 60} hrs';
    }
    if (estimatedDurationMinutes >= 60) {
      final hours = estimatedDurationMinutes ~/ 60;
      final minutes = estimatedDurationMinutes % 60;
      if (minutes == 0) {
        return '$hours hr';
      }
      return '$hours hr $minutes min';
    }
    return '$estimatedDurationMinutes min';
  }

  String get categoryKey =>
      category.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '-');
}

List<ServiceOfferingModel> _parseOfferings(dynamic data) {
  if (data is List) {
    return data
        .whereType<Map>()
        .map(
          (item) =>
              ServiceOfferingModel.fromJson(Map<String, dynamic>.from(item)),
        )
        .toList();
  }

  if (data is Map && data['content'] is List) {
    return (data['content'] as List)
        .whereType<Map>()
        .map(
          (item) =>
              ServiceOfferingModel.fromJson(Map<String, dynamic>.from(item)),
        )
        .toList();
  }

  return const [];
}

class ServiceCatalogRepository {
  final Dio _dio;

  ServiceCatalogRepository(this._dio);

  Future<ServiceOfferingModel> createOffering({
    required int providerId,
    required String category,
    required String serviceName,
    required String pricingType,
    required double price,
    required int estimatedDurationMinutes,
  }) async {
    final response = await _dio.post(
      '/catalog/services',
      data: {
        'providerId': providerId,
        'category': category,
        'serviceName': serviceName,
        'pricingType': pricingType,
        'price': price,
        'estimatedDurationMinutes': estimatedDurationMinutes,
      },
    );
    return ServiceOfferingModel.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<ServiceOfferingModel> updateOffering({
    required int offeringId,
    required String category,
    required String serviceName,
    required String pricingType,
    required double price,
    required int estimatedDurationMinutes,
  }) async {
    final response = await _dio.put(
      '/catalog/offerings/$offeringId',
      data: {
        'category': category,
        'serviceName': serviceName,
        'pricingType': pricingType,
        'price': price,
        'estimatedDurationMinutes': estimatedDurationMinutes,
      },
    );
    return ServiceOfferingModel.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<void> deleteOffering(int offeringId) async {
    await _dio.delete('/catalog/offerings/$offeringId');
  }
}

final serviceCatalogRepositoryProvider = Provider<ServiceCatalogRepository>((
  ref,
) {
  return ServiceCatalogRepository(ref.read(dioProvider));
});

final serviceCatalogProvider = FutureProvider<List<ServiceOfferingModel>>((
  ref,
) async {
  final dio = ref.read(dioProvider);
  final response = await dio.get('/catalog/services');
  return _parseOfferings(response.data);
});

final providerServiceCatalogProvider =
    FutureProvider.family<List<ServiceOfferingModel>, int>((ref, providerId) async {
      final dio = ref.read(dioProvider);
      final response = await dio.get(
        '/catalog/services',
        queryParameters: {'providerId': providerId},
      );
      return _parseOfferings(response.data);
    });

final serviceOfferingProvider =
    FutureProvider.family<ServiceOfferingModel, int>((ref, serviceId) async {
      final services = await ref.watch(serviceCatalogProvider.future);
      return services.firstWhere((service) => service.id == serviceId);
    });
