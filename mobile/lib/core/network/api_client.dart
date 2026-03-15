import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/config/env.dart';
import 'package:serveify/core/storage/secure_storage.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: Env.apiBaseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
    headers: {'Content-Type': 'application/json'},
  ));

  if (Env.testMode) {
    dio.interceptors.add(_MockInterceptor());
  } else {
    final storage = ref.read(secureStorageProvider);
    dio.interceptors.add(AuthInterceptor(dio, storage));
  }
  dio.interceptors.add(LogInterceptor(
    requestBody: true,
    responseBody: true,
    logPrint: (obj) => print('[DIO] $obj'),
  ));

  return dio;
});

class AuthInterceptor extends Interceptor {
  final Dio _dio;
  final SecureStorageService _storage;
  bool _isRefreshing = false;
  final List<({RequestOptions options, ErrorInterceptorHandler handler})> _queue = [];

  AuthInterceptor(this._dio, this._storage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode != 401) {
      return handler.next(err);
    }

    if (_isRefreshing) {
      _queue.add((options: err.requestOptions, handler: handler));
      return;
    }

    _isRefreshing = true;

    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null) {
        await _storage.clearAll();
        return handler.next(err);
      }

      final response = await _dio.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
        options: Options(headers: {'Authorization': ''}),
      );

      final newAccess = response.data['accessToken'] as String;
      final newRefresh = response.data['refreshToken'] as String;
      await _storage.saveTokens(accessToken: newAccess, refreshToken: newRefresh);

      // Retry the original request
      err.requestOptions.headers['Authorization'] = 'Bearer $newAccess';
      final retryResponse = await _dio.fetch(err.requestOptions);
      handler.resolve(retryResponse);

      // Retry queued requests
      for (final queued in _queue) {
        queued.options.headers['Authorization'] = 'Bearer $newAccess';
        final retried = await _dio.fetch(queued.options);
        queued.handler.resolve(retried);
      }
    } catch (_) {
      await _storage.clearAll();
      handler.next(err);
      for (final queued in _queue) {
        queued.handler.next(err);
      }
    } finally {
      _isRefreshing = false;
      _queue.clear();
    }
  }
}

class ApiException implements Exception {
  final int? statusCode;
  final String message;

  const ApiException({this.statusCode, required this.message});

  factory ApiException.fromDioError(DioException error) {
    final data = error.response?.data;
    String message = 'An unexpected error occurred';

    if (data is Map<String, dynamic> && data.containsKey('message')) {
      message = data['message'] as String;
    } else if (error.type == DioExceptionType.connectionTimeout) {
      message = 'Connection timeout. Please check your internet.';
    } else if (error.type == DioExceptionType.connectionError) {
      message = 'Unable to connect to server.';
    }

    return ApiException(
      statusCode: error.response?.statusCode,
      message: message,
    );
  }

  @override
  String toString() => message;
}

class _MockInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final path = options.path;
    final method = options.method;

    dynamic data;

    // --- Bookings ---
    if (path.contains('/bookings') && !path.contains('/review') && !path.contains('/cancel') && method == 'GET') {
      if (RegExp(r'/bookings/\d+$').hasMatch(path)) {
        data = _mockBooking(1);
      } else {
        data = {'content': List.generate(5, (i) => _mockBooking(i + 1))};
      }
    }
    // --- Categories ---
    else if (path == '/categories') {
      data = [
        {'id': 1, 'name': 'Plumbing', 'slug': 'plumbing', 'icon': null, 'displayOrder': 1},
        {'id': 2, 'name': 'Electrical', 'slug': 'electrical', 'icon': null, 'displayOrder': 2},
        {'id': 3, 'name': 'Cleaning', 'slug': 'cleaning', 'icon': null, 'displayOrder': 3},
        {'id': 4, 'name': 'Gardening', 'slug': 'gardening', 'icon': null, 'displayOrder': 4},
        {'id': 5, 'name': 'Painting', 'slug': 'painting', 'icon': null, 'displayOrder': 5},
        {'id': 6, 'name': 'Carpentry', 'slug': 'carpentry', 'icon': null, 'displayOrder': 6},
      ];
    }
    // --- Providers ---
    else if (path.startsWith('/providers') && method == 'GET') {
      if (RegExp(r'/providers/\d+/reviews').hasMatch(path)) {
        data = {'content': List.generate(3, (i) => _mockReview(i + 1))};
      } else if (RegExp(r'/providers/\d+$').hasMatch(path)) {
        data = _mockProvider(1);
      } else {
        data = {'content': List.generate(6, (i) => _mockProvider(i + 1))};
      }
    }
    // --- Services / Catalog ---
    else if (path.contains('/catalog/services') && method == 'GET') {
      data = {'content': List.generate(8, (i) => _mockService(i + 1))};
    }
    // --- Notifications ---
    else if (path.contains('/notifications') && method == 'GET') {
      data = {'content': List.generate(4, (i) => _mockNotification(i + 1))};
    }
    // --- Chat messages ---
    else if (path.contains('/chat/') && method == 'GET') {
      data = List.generate(6, (i) => _mockChatMessage(i + 1));
    }
    // --- Wallet ---
    else if (path.contains('/wallet/balance')) {
      data = {'balance': 2450.00, 'pendingPayouts': 350.00, 'currency': 'ZAR'};
    } else if (path.contains('/wallet/transactions')) {
      data = {'content': List.generate(5, (i) => _mockTransaction(i + 1))};
    }
    // --- Disputes ---
    else if (path.contains('/disputes') && method == 'GET') {
      data = {'content': List.generate(2, (i) => _mockDispute(i + 1))};
    }
    // --- Users/me ---
    else if (path == '/users/me' && method == 'GET') {
      data = {'id': 1, 'fullName': 'Test User', 'email': 'test@serveify.co.za', 'phoneNumber': '+27821234567', 'role': 'CUSTOMER'};
    }
    // --- Default: empty success ---
    else {
      data = {'message': 'OK'};
    }

    handler.resolve(Response(
      requestOptions: options,
      data: data,
      statusCode: 200,
    ));
  }

  Map<String, dynamic> _mockBooking(int id) => {
    'id': id,
    'serviceName': ['Pipe Repair', 'House Cleaning', 'Garden Service', 'Electrical Wiring', 'Interior Painting'][id % 5],
    'providerName': ['John Plumber', 'Mary Cleaners', 'Green Thumb SA', 'Spark Electric', 'PaintPro'][id % 5],
    'customerName': 'Test User',
    'status': ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED'][id % 5],
    'scheduledFor': DateTime.now().add(Duration(days: id)).toIso8601String(),
    'address': '${id * 12} Main Road, Cape Town',
    'notes': id % 2 == 0 ? 'Please arrive on time' : null,
    'quotedPrice': (150 + id * 75).toString(),
    'createdAt': DateTime.now().subtract(Duration(days: id * 2)).toIso8601String(),
    'cancelledReason': null,
  };

  static const _providerNames = ['John Plumber', 'Mary Cleaners', 'Green Thumb SA', 'Spark Electric', 'PaintPro', 'FixIt All'];

  Map<String, dynamic> _mockProvider(int id) => {
    'id': id,
    'userId': id + 100,
    'fullName': _providerNames[id % 6],
    'userName': _providerNames[id % 6],
    'bio': 'Professional service provider with ${id + 3} years of experience in the industry.',
    'city': ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Stellenbosch', 'Sandton'][id % 6],
    'serviceRadiusKm': 10 + id * 5,
    'averageRating': (3.5 + (id % 3) * 0.5),
    'reviewCount': id * 7 + 3,
    'verificationStatus': 'VERIFIED',
    'services': List.generate(3, (i) => _mockService(id * 3 + i)),
  };

  Map<String, dynamic> _mockService(int id) => {
    'id': id,
    'name': ['Pipe Repair', 'Drain Unblocking', 'Deep Clean', 'Lawn Mowing', 'Full Rewiring', 'Wall Painting', 'Furniture Assembly', 'Geyser Install'][id % 8],
    'description': [
      'Expert pipe repair service — we fix leaks, burst pipes, and worn fittings.',
      'Fast drain unblocking using professional equipment and eco-friendly solutions.',
      'Thorough deep cleaning for homes and offices. We leave every surface spotless.',
      'Weekly or once-off lawn mowing and garden maintenance for any size yard.',
      'Complete electrical rewiring to bring your property up to code safely.',
      'Interior and exterior wall painting with premium paints and clean finishes.',
      'Custom furniture assembly — flat-pack, shelving, desks, and more.',
      'Geyser installation and repair by certified plumbing professionals.',
    ][id % 8],
    'basePrice': (100 + id * 50).toDouble(),
    'durationMinutes': 60 + (id % 4) * 30,
    'categoryName': ['Plumbing', 'Plumbing', 'Cleaning', 'Gardening', 'Electrical', 'Painting', 'Carpentry', 'Plumbing'][id % 8],
    'providerName': _providerNames[id % 6],
  };

  Map<String, dynamic> _mockReview(int id) => {
    'id': id,
    'bookingId': id,
    'customerId': 1,
    'customerName': 'Customer $id',
    'providerId': 1,
    'rating': 3 + (id % 3),
    'comment': ['Great work, very professional!', 'On time and did a good job.', 'Would recommend to anyone.'][id % 3],
    'providerResponse': id % 2 == 0 ? 'Thank you for the kind words!' : null,
    'createdAt': DateTime.now().subtract(Duration(days: id * 5)).toIso8601String(),
  };

  Map<String, dynamic> _mockNotification(int id) => {
    'id': id,
    'type': 'BOOKING',
    'title': ['Booking Confirmed', 'New Message', 'Review Received', 'Payment Processed'][id % 4],
    'message': 'Your booking #$id has been updated.',
    'read': id > 2,
    'createdAt': DateTime.now().subtract(Duration(hours: id * 3)).toIso8601String(),
  };

  Map<String, dynamic> _mockChatMessage(int id) => {
    'id': id,
    'senderId': id % 2 == 0 ? 1 : 2,
    'senderName': id % 2 == 0 ? 'You' : 'Provider',
    'content': ['Hi, when can you come?', 'I can be there at 2pm tomorrow.', 'That works, thanks!', 'Great, see you then.', 'Should I bring any materials?', 'No, I have everything needed.'][id % 6],
    'createdAt': DateTime.now().subtract(Duration(minutes: (6 - id) * 15)).toIso8601String(),
  };

  Map<String, dynamic> _mockTransaction(int id) => {
    'id': id,
    'type': id % 2 == 0 ? 'CREDIT' : 'DEBIT',
    'amount': (100 + id * 125).toDouble(),
    'description': id % 2 == 0 ? 'Payment for Booking #${id + 10}' : 'Payout to bank account',
    'status': 'COMPLETED',
    'createdAt': DateTime.now().subtract(Duration(days: id * 3)).toIso8601String(),
  };

  Map<String, dynamic> _mockDispute(int id) => {
    'id': id,
    'bookingId': id + 5,
    'status': id == 1 ? 'OPEN' : 'RESOLVED',
    'reason': id == 1 ? 'Provider did not show up on the scheduled date.' : 'Service was not completed as described.',
    'resolutionType': id == 2 ? 'REFUND' : null,
    'resolutionNotes': id == 2 ? 'Full refund issued to customer.' : null,
    'createdAt': DateTime.now().subtract(Duration(days: id * 7)).toIso8601String(),
  };
}
