import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/network/api_client.dart';

final addressRepositoryProvider = Provider<AddressRepository>((ref) {
  return AddressRepository(ref.read(dioProvider));
});

final addressListProvider = FutureProvider<List<AddressModel>>((ref) async {
  return ref.read(addressRepositoryProvider).list();
});

class AddressModel {
  final int id;
  final String label;
  final String value;
  final String? note;
  final bool defaultAddress;

  const AddressModel({
    required this.id,
    required this.label,
    required this.value,
    this.note,
    required this.defaultAddress,
  });

  factory AddressModel.fromJson(Map<String, dynamic> json) {
    return AddressModel(
      id: (json['id'] as num).toInt(),
      label: json['label'] as String? ?? '',
      value: json['value'] as String? ?? '',
      note: json['note'] as String?,
      defaultAddress: json['defaultAddress'] as bool? ?? false,
    );
  }
}

class AddressRepository {
  final Dio _dio;

  AddressRepository(this._dio);

  Future<List<AddressModel>> list() async {
    final response = await _dio.get('/customers/me/addresses');
    final data = response.data as List;
    return data.map((e) => AddressModel.fromJson(e)).toList();
  }

  Future<AddressModel> create({
    required String label,
    required String value,
    String? note,
    bool? defaultAddress,
  }) async {
    final response = await _dio.post('/customers/me/addresses', data: {
      'label': label,
      'value': value,
      if (note != null && note.isNotEmpty) 'note': note,
      'defaultAddress': defaultAddress ?? true,
    });
    return AddressModel.fromJson(response.data);
  }

  Future<AddressModel> update(
    int id, {
    required String label,
    required String value,
    String? note,
    bool? defaultAddress,
  }) async {
    final response = await _dio.put('/customers/me/addresses/$id', data: {
      'label': label,
      'value': value,
      if (note != null) 'note': note,
      if (defaultAddress != null) 'defaultAddress': defaultAddress,
    });
    return AddressModel.fromJson(response.data);
  }

  Future<void> delete(int id) async {
    await _dio.delete('/customers/me/addresses/$id');
  }
}
