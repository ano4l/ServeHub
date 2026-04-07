import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:serveify/core/network/api_client.dart';

final uploadServiceProvider = Provider<UploadService>((ref) {
  return UploadService(ref.read(dioProvider));
});

class UploadService {
  final Dio _dio;

  UploadService(this._dio);

  Future<UploadResult> uploadAvatar(XFile file) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path, filename: file.name),
    });
    final response = await _dio.post('/uploads/avatar', data: formData);
    return UploadResult.fromJson(response.data);
  }

  Future<DocumentUploadResult> uploadDocument(XFile file, String type) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path, filename: file.name),
      'type': type,
    });
    final response = await _dio.post('/uploads/document', data: formData);
    return DocumentUploadResult.fromJson(response.data);
  }

  Future<List<DocumentUploadResult>> getMyDocuments() async {
    final response = await _dio.get('/uploads/documents/me');
    final list = response.data as List;
    return list.map((e) => DocumentUploadResult.fromJson(e)).toList();
  }
}

class UploadResult {
  final String url;
  final String path;

  UploadResult({required this.url, required this.path});

  factory UploadResult.fromJson(Map<String, dynamic> json) {
    return UploadResult(
      url: json['url'] as String,
      path: json['path'] as String,
    );
  }
}

class DocumentUploadResult {
  final int? id;
  final String url;
  final String? path;
  final String type;
  final String status;

  DocumentUploadResult({
    this.id,
    required this.url,
    this.path,
    required this.type,
    required this.status,
  });

  factory DocumentUploadResult.fromJson(Map<String, dynamic> json) {
    return DocumentUploadResult(
      id: json['id'] as int?,
      url: json['url'] as String? ?? '',
      path: json['path'] as String?,
      type: json['type'] as String? ?? '',
      status: json['status'] as String? ?? 'PENDING',
    );
  }
}
