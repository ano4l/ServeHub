import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/network/api_client.dart';

class CategoryModel {
  final int id;
  final String name;
  final String slug;
  final String? icon;
  final int displayOrder;

  CategoryModel({
    required this.id,
    required this.name,
    required this.slug,
    this.icon,
    required this.displayOrder,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['id'] as int,
      name: json['name'] as String,
      slug: json['slug'] as String,
      icon: json['icon'] as String?,
      displayOrder: json['displayOrder'] as int? ?? 0,
    );
  }
}

final categoriesProvider = FutureProvider<List<CategoryModel>>((ref) async {
  final dio = ref.read(dioProvider);
  try {
    final response = await dio.get('/categories');
    if (response.data is List) {
      return (response.data as List)
          .map((e) => CategoryModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  } catch (_) {
    return [];
  }
});
