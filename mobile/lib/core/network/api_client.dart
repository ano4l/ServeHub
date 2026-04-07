import 'dart:math' as math;

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/config/env.dart';
import 'package:serveify/core/storage/secure_storage.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: Env.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  if (Env.testMode) {
    dio.interceptors.add(_MockInterceptor());
  } else {
    final storage = ref.read(secureStorageProvider);
    dio.interceptors.add(AuthInterceptor(dio, storage));
  }
  dio.interceptors.add(
    LogInterceptor(
      requestBody: true,
      responseBody: true,
      logPrint: (obj) => debugPrint('[DIO] $obj'),
    ),
  );

  return dio;
});

class AuthInterceptor extends Interceptor {
  final Dio _dio;
  final SecureStorageService _storage;
  bool _isRefreshing = false;
  final List<({RequestOptions options, ErrorInterceptorHandler handler})> _queue =
      [];

  AuthInterceptor(this._dio, this._storage);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    try {
      final token = await _storage.getAccessToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    } catch (_) {
      // If token retrieval fails, proceed without auth header
    }
    handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
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
      await _storage.saveTokens(
        accessToken: newAccess,
        refreshToken: newRefresh,
      );

      err.requestOptions.headers['Authorization'] = 'Bearer $newAccess';
      final retryResponse = await _dio.fetch(err.requestOptions);
      handler.resolve(retryResponse);

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
  static const _providerNames = [
    'John Plumber',
    'Mary Cleaners',
    'Green Thumb SA',
    'Spark Electric',
    'PaintPro',
    'FixIt All',
  ];

  static const _providerCities = [
    'Cape Town',
    'Johannesburg',
    'Durban',
    'Pretoria',
    'Stellenbosch',
    'Sandton',
  ];

  static const _providerCoordinates = <(double, double)>[
    (-33.9249, 18.4241),
    (-26.2041, 28.0473),
    (-29.8587, 31.0218),
    (-25.7479, 28.2293),
    (-33.9321, 18.8602),
    (-26.1076, 28.0567),
  ];

  static Map<String, dynamic> _seedNotification(int id) => {
    'id': id,
    'type': ['BOOKING', 'MESSAGE', 'REVIEW', 'PAYMENT'][(id - 1) % 4],
    'title': [
      'Booking Confirmed',
      'New Message',
      'Review Received',
      'Payment Processed',
    ][(id - 1) % 4],
    'message': 'Your booking #$id has been updated.',
    'read': id > 2,
    'link': [
      '/booking/${id + 10}',
      '/chat/${id + 10}',
      '/review/${id + 10}',
      '/booking/${id + 10}',
    ][(id - 1) % 4],
    'createdAt':
        DateTime.now().subtract(Duration(hours: id * 3)).toIso8601String(),
  };

  final List<Map<String, dynamic>> _notifications = List.generate(
    4,
    (i) => _seedNotification(i + 1),
  );

  final Map<String, dynamic> _notificationPreferences = {
    'emailEnabled': true,
    'pushEnabled': true,
    'smsEnabled': false,
    'bookingUpdates': true,
    'messages': true,
    'promotions': false,
  };

  final List<Map<String, dynamic>> _savedPaymentMethods = [
    {
      'id': 1,
      'brand': 'Visa',
      'last4': '4242',
      'holderName': 'Test User',
      'expiry': '08/28',
      'defaultMethod': true,
    },
    {
      'id': 2,
      'brand': 'Mastercard',
      'last4': '4444',
      'holderName': 'Test User',
      'expiry': '11/27',
      'defaultMethod': false,
    },
  ];

  final Map<int, List<Map<String, dynamic>>> _providerAvailability = {
    for (var providerId = 1; providerId <= 6; providerId++)
      providerId: [
        for (final day in [1, 2, 3, 4, 5])
          {
            'id': (providerId * 10) + day,
            'dayOfWeek': day,
            'dayName': _dayName(day),
            'startTime': day == 5 ? '08:00' : '08:30',
            'endTime': day == 5 ? '15:00' : '17:00',
            'enabled': true,
          },
      ],
  };

  late final List<Map<String, dynamic>> _catalogServices = List.generate(
    12,
    (i) => _seedMockService(i + 1),
  );

  late final Map<int, Map<String, dynamic>> _bookingsById = {
    for (var i = 1; i <= 5; i++) i: _seedBooking(i),
  };

  late final Map<int, List<Map<String, dynamic>>> _bookingEventsByBookingId = {
    for (final entry in _bookingsById.entries)
      entry.key: _seedBookingEvents(entry.value),
  };

  late final Map<int, Map<String, dynamic>> _paymentsByBookingId = {
    for (final entry in _bookingsById.entries) entry.key: _seedPayment(entry.value),
  };

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final path = options.path;
    final method = options.method.toUpperCase();
    dynamic data;

    final bookingDetailMatch = RegExp(r'^/bookings/(\d+)$').firstMatch(path);
    final bookingEventsMatch =
        RegExp(r'^/bookings/(\d+)/events$').firstMatch(path);
    final bookingMessagesMatch =
        RegExp(r'^/bookings/(\d+)/messages$').firstMatch(path);
    final bookingActionMatch =
        RegExp(r'^/bookings/(\d+)/(accept|decline|start|complete|cancel|reschedule)$')
            .firstMatch(path);
    final providerDetailMatch = RegExp(r'^/providers/(\d+)$').firstMatch(path);
    final providerReviewsMatch =
        RegExp(r'^/providers/(\d+)/reviews$').firstMatch(path);
    final providerAvailabilityMatch =
        RegExp(r'^/providers/(\d+)/availability$').firstMatch(path);
    final providerAvailabilitySlotsMatch =
        RegExp(r'^/providers/(\d+)/availability/slots$').firstMatch(path);
    final notificationReadMatch =
        RegExp(r'^/notifications/(\d+)/read$').firstMatch(path);
    final paymentStatusMatch =
        RegExp(r'^/payments/booking/(\d+)$').firstMatch(path);
    final paymentAuthorizeMatch =
        RegExp(r'^/payments/booking/(\d+)/authorize$').firstMatch(path);
    final customerPaymentMethodsMatch =
        RegExp(r'^/customers/me/payment-methods/(\d+)$').firstMatch(path);
    final catalogOfferingMatch =
        RegExp(r'^/catalog/offerings/(\d+)$').firstMatch(path);

    if (path == '/bookings' && method == 'GET') {
      final bookings = _bookingsById.values
          .map((item) => Map<String, dynamic>.from(item))
          .toList()
        ..sort((left, right) => '${right['scheduledFor']}'.compareTo('${left['scheduledFor']}'));
      data = {'content': bookings};
    } else if (path == '/bookings' && method == 'POST') {
      final body = _requestBody(options.data);
      final bookingId = DateTime.now().millisecondsSinceEpoch % 100000;
      final serviceId = int.tryParse('${body['serviceOfferingId'] ?? ''}');
      final service = _mockService(serviceId ?? ((bookingId - 1) % 12) + 1);
      final created = _seedBooking(
        bookingId,
        providerId: int.tryParse('${body['providerId'] ?? ''}'),
        serviceOfferingId: serviceId,
        address: body['address']?.toString(),
        notes: body['notes']?.toString(),
        scheduledFor: body['scheduledFor']?.toString(),
      );
      _bookingsById[bookingId] = created;
      _bookingEventsByBookingId[bookingId] = [
        _bookingEvent(
          'BOOKING_CREATED',
          'Booking requested by customer',
        ),
      ];
      _paymentsByBookingId[bookingId] = _mockPayment(
        bookingId,
        amount: (service['price'] as num?)?.toDouble() ?? 0,
      );
      data = Map<String, dynamic>.from(created);
    } else if (bookingDetailMatch != null && method == 'GET') {
      data = Map<String, dynamic>.from(_bookingFor(int.parse(bookingDetailMatch.group(1)!)));
    } else if (bookingEventsMatch != null && method == 'GET') {
      final bookingId = int.parse(bookingEventsMatch.group(1)!);
      data = _bookingEventsFor(bookingId)
          .map((item) => Map<String, dynamic>.from(item))
          .toList();
    } else if (bookingActionMatch != null && method == 'POST') {
      final bookingId = int.parse(bookingActionMatch.group(1)!);
      final action = bookingActionMatch.group(2)!;
      data = _handleBookingAction(bookingId, action, _requestBody(options.data));
    } else if (bookingMessagesMatch != null && method == 'GET') {
      final bookingId = int.parse(bookingMessagesMatch.group(1)!);
      data = {
        'content': List.generate(
          6,
          (i) => _mockChatMessage(i + 1, bookingId: bookingId),
        ),
      };
    } else if (bookingMessagesMatch != null && method == 'POST') {
      final bookingId = int.parse(bookingMessagesMatch.group(1)!);
      final body = _requestBody(options.data);
      data = {
        'id': DateTime.now().millisecondsSinceEpoch % 100000,
        'bookingId': bookingId,
        'senderId': 1,
        'senderName': 'You',
        'content': body['content']?.toString() ?? '',
        'sentAt': DateTime.now().toIso8601String(),
        'clientMessageId': body['clientMessageId']?.toString(),
        'createdAt': DateTime.now().toIso8601String(),
      };
    } else if (path == '/categories') {
      data = [
        {
          'id': 1,
          'name': 'Plumbing',
          'slug': 'plumbing',
          'icon': null,
          'displayOrder': 1,
        },
        {
          'id': 2,
          'name': 'Electrical',
          'slug': 'electrical',
          'icon': null,
          'displayOrder': 2,
        },
        {
          'id': 3,
          'name': 'Cleaning',
          'slug': 'cleaning',
          'icon': null,
          'displayOrder': 3,
        },
        {
          'id': 4,
          'name': 'Gardening',
          'slug': 'gardening',
          'icon': null,
          'displayOrder': 4,
        },
        {
          'id': 5,
          'name': 'Painting',
          'slug': 'painting',
          'icon': null,
          'displayOrder': 5,
        },
        {
          'id': 6,
          'name': 'Carpentry',
          'slug': 'carpentry',
          'icon': null,
          'displayOrder': 6,
        },
      ];
    } else if (path == '/providers' && method == 'GET') {
      data = {'content': List.generate(6, (i) => _mockProvider(i + 1))};
    } else if (providerAvailabilitySlotsMatch != null && method == 'GET') {
      final providerId = int.parse(providerAvailabilitySlotsMatch.group(1)!);
      data = _mockBookableDays(providerId, options.queryParameters);
    } else if (providerAvailabilityMatch != null && method == 'GET') {
      final providerId = int.parse(providerAvailabilityMatch.group(1)!);
      data = _providerAvailabilityFor(providerId);
    } else if (path == '/providers/me/availability' && method == 'PUT') {
      final body = _requestBodyList(options.data);
      _providerAvailability[1] = body
          .map((entry) {
            final dayOfWeek = int.tryParse('${entry['dayOfWeek'] ?? ''}') ?? 0;
            return {
              'id': 100 + dayOfWeek,
              'dayOfWeek': dayOfWeek,
              'dayName': _dayName(dayOfWeek),
              'startTime': entry['startTime']?.toString() ?? '08:00',
              'endTime': entry['endTime']?.toString() ?? '17:00',
              'enabled': entry['enabled'] != false,
            };
          })
          .toList();
      data = _providerAvailabilityFor(1);
    } else if (providerReviewsMatch != null && method == 'GET') {
      final providerId = int.parse(providerReviewsMatch.group(1)!);
      data = {
        'content': List.generate(
          3,
          (i) => _mockReview(i + 1, providerId: providerId),
        ),
      };
    } else if (providerDetailMatch != null && method == 'GET') {
      data = _mockProvider(int.parse(providerDetailMatch.group(1)!));
    } else if ((path == '/catalog/services' || path == '/catalog/offerings') &&
        method == 'POST') {
      final body = _requestBody(options.data);
      final nextId =
          (_catalogServices
                  .map((item) => item['id'] as int? ?? 0)
                  .fold<int>(0, (left, right) => left > right ? left : right)) +
              1;
      final providerId = int.tryParse('${body['providerId'] ?? ''}') ?? 1;
      final price = double.tryParse('${body['price'] ?? ''}') ?? 0;
      final duration =
          int.tryParse('${body['estimatedDurationMinutes'] ?? ''}') ?? 60;

      final created = _seedMockService(nextId, providerId: providerId)
        ..addAll({
          'category': body['category']?.toString() ?? 'Service',
          'categoryName': body['category']?.toString() ?? 'Service',
          'serviceName': body['serviceName']?.toString() ?? 'Service',
          'name': body['serviceName']?.toString() ?? 'Service',
          'pricingType': body['pricingType']?.toString() ?? 'FIXED',
          'price': price,
          'basePrice': price,
          'estimatedDurationMinutes': duration,
          'durationMinutes': duration,
        });

      _catalogServices.add(created);
      data = Map<String, dynamic>.from(created);
    } else if (catalogOfferingMatch != null && method == 'PUT') {
      final offeringId = int.parse(catalogOfferingMatch.group(1)!);
      final body = _requestBody(options.data);
      final index = _catalogServices.indexWhere(
        (service) => service['id'] == offeringId,
      );
      if (index >= 0) {
        final existing = _catalogServices[index];
        final updated = {
          ...existing,
          if (body.containsKey('category'))
            'category': body['category']?.toString() ?? existing['category'],
          if (body.containsKey('category'))
            'categoryName':
                body['category']?.toString() ?? existing['categoryName'],
          if (body.containsKey('serviceName'))
            'serviceName':
                body['serviceName']?.toString() ?? existing['serviceName'],
          if (body.containsKey('serviceName'))
            'name': body['serviceName']?.toString() ?? existing['name'],
          if (body.containsKey('pricingType'))
            'pricingType':
                body['pricingType']?.toString() ?? existing['pricingType'],
          if (body.containsKey('price'))
            'price':
                double.tryParse('${body['price']}') ??
                (existing['price'] as num).toDouble(),
          if (body.containsKey('price'))
            'basePrice':
                double.tryParse('${body['price']}') ??
                (existing['basePrice'] as num).toDouble(),
          if (body.containsKey('estimatedDurationMinutes'))
            'estimatedDurationMinutes':
                int.tryParse('${body['estimatedDurationMinutes']}') ??
                (existing['estimatedDurationMinutes'] as num).toInt(),
          if (body.containsKey('estimatedDurationMinutes'))
            'durationMinutes':
                int.tryParse('${body['estimatedDurationMinutes']}') ??
                (existing['durationMinutes'] as num).toInt(),
        };
        _catalogServices[index] = updated;
        data = Map<String, dynamic>.from(updated);
      } else {
        data = {'message': 'Service offering not found'};
      }
    } else if (catalogOfferingMatch != null && method == 'DELETE') {
      final offeringId = int.parse(catalogOfferingMatch.group(1)!);
      _catalogServices.removeWhere((service) => service['id'] == offeringId);
      data = {'status': 'deleted'};
    } else if (path == '/catalog/services' && method == 'GET') {
      final providerId =
          int.tryParse('${options.queryParameters['providerId'] ?? ''}');
      final query = '${options.queryParameters['query'] ?? ''}'.trim().toLowerCase();
      final category =
          '${options.queryParameters['category'] ?? ''}'.trim().toLowerCase();
      final city = '${options.queryParameters['city'] ?? ''}'.trim().toLowerCase();
      final minPrice =
          double.tryParse('${options.queryParameters['minPrice'] ?? ''}');
      final maxPrice =
          double.tryParse('${options.queryParameters['maxPrice'] ?? ''}');
      final lat = double.tryParse('${options.queryParameters['lat'] ?? ''}');
      final lng = double.tryParse('${options.queryParameters['lng'] ?? ''}');
      final radiusKm =
          double.tryParse('${options.queryParameters['radiusKm'] ?? ''}') ?? 25;
      var services = _catalogServices
          .map((service) => Map<String, dynamic>.from(service))
          .toList();
      if (providerId != null) {
        services = services
            .where((service) => service['providerId'] == providerId)
            .toList();
      }
      if (query.isNotEmpty) {
        services = services.where((service) {
          final searchable = [
            service['serviceName'],
            service['category'],
            service['providerName'],
            service['providerCity'],
            service['providerBio'],
          ].join(' ').toLowerCase();
          return searchable.contains(query);
        }).toList();
      }
      if (category.isNotEmpty) {
        services = services
            .where((service) =>
                '${service['category']}'.toLowerCase() == category)
            .toList();
      }
      if (city.isNotEmpty) {
        services = services
            .where((service) =>
                '${service['providerCity']}'.toLowerCase().contains(city))
            .toList();
      }
      if (minPrice != null) {
        services = services
            .where((service) => (service['price'] as num).toDouble() >= minPrice)
            .toList();
      }
      if (maxPrice != null) {
        services = services
            .where((service) => (service['price'] as num).toDouble() <= maxPrice)
            .toList();
      }
      if (lat != null && lng != null) {
        services = services.where((service) {
          final serviceLat = service['latitude'] as double?;
          final serviceLng = service['longitude'] as double?;
          if (serviceLat == null || serviceLng == null) {
            return false;
          }
          return _distanceKm(lat, lng, serviceLat, serviceLng) <= radiusKm;
        }).toList();
      }
      data = {
        'content': services,
      };
    } else if (path == '/customers/me/payment-methods' && method == 'GET') {
      data = _savedPaymentMethods
          .map((item) => Map<String, dynamic>.from(item))
          .toList();
    } else if (path == '/customers/me/payment-methods' && method == 'POST') {
      final body = _requestBody(options.data);
      final nextId = (_savedPaymentMethods.map((item) => item['id'] as int).fold<int>(0, (left, right) => left > right ? left : right)) + 1;
      final digits = '${body['cardNumber'] ?? ''}'.replaceAll(RegExp(r'\D'), '');
      final makeDefault = body['defaultMethod'] != false;
      if (makeDefault) {
        for (final item in _savedPaymentMethods) {
          item['defaultMethod'] = false;
        }
      }
      final created = {
        'id': nextId,
        'brand': _inferCardBrand(digits),
        'last4': digits.length >= 4 ? digits.substring(digits.length - 4) : digits,
        'holderName': body['holderName']?.toString() ?? 'Cardholder',
        'expiry': body['expiry']?.toString() ?? '01/30',
        'defaultMethod': makeDefault || _savedPaymentMethods.isEmpty,
      };
      _savedPaymentMethods.add(created);
      data = Map<String, dynamic>.from(created);
    } else if (customerPaymentMethodsMatch != null && method == 'PUT') {
      final paymentMethodId = int.parse(customerPaymentMethodsMatch.group(1)!);
      final body = _requestBody(options.data);
      final index = _savedPaymentMethods.indexWhere(
        (item) => item['id'] == paymentMethodId,
      );
      if (index >= 0) {
        if (body['defaultMethod'] == true) {
          for (final item in _savedPaymentMethods) {
            item['defaultMethod'] = false;
          }
        }
        _savedPaymentMethods[index] = {
          ..._savedPaymentMethods[index],
          if (body.containsKey('holderName'))
            'holderName': body['holderName']?.toString() ?? _savedPaymentMethods[index]['holderName'],
          if (body.containsKey('expiry'))
            'expiry': body['expiry']?.toString() ?? _savedPaymentMethods[index]['expiry'],
          if (body.containsKey('defaultMethod'))
            'defaultMethod': body['defaultMethod'] == true,
        };
        if (!_savedPaymentMethods.any((item) => item['defaultMethod'] == true)) {
          _savedPaymentMethods[index]['defaultMethod'] = true;
        }
        data = Map<String, dynamic>.from(_savedPaymentMethods[index]);
      } else {
        data = {'message': 'Payment method not found'};
      }
    } else if (customerPaymentMethodsMatch != null && method == 'DELETE') {
      final paymentMethodId = int.parse(customerPaymentMethodsMatch.group(1)!);
      final removedIndex = _savedPaymentMethods.indexWhere(
        (item) => item['id'] == paymentMethodId,
      );
      Map<String, dynamic>? removed;
      if (removedIndex >= 0) {
        removed = _savedPaymentMethods.removeAt(removedIndex);
      }
      if (_savedPaymentMethods.isNotEmpty &&
          !_savedPaymentMethods.any((item) => item['defaultMethod'] == true)) {
        _savedPaymentMethods.first['defaultMethod'] = true;
      }
      data = removed ?? {'status': 'deleted'};
    } else if (paymentAuthorizeMatch != null && method == 'POST') {
      final bookingId = int.parse(paymentAuthorizeMatch.group(1)!);
      final payment = _paymentsByBookingId.putIfAbsent(
        bookingId,
        () => _seedPayment(_bookingFor(bookingId)),
      );
      payment['status'] = 'AUTHORIZED';
      payment['updatedAt'] = DateTime.now().toIso8601String();
      data = Map<String, dynamic>.from(payment);
    } else if (paymentStatusMatch != null && method == 'GET') {
      final bookingId = int.parse(paymentStatusMatch.group(1)!);
      final payment = _paymentsByBookingId.putIfAbsent(
        bookingId,
        () => _seedPayment(_bookingFor(bookingId)),
      );
      data = Map<String, dynamic>.from(payment);
    } else if (path == '/payfast/checkout' && method == 'POST') {
      final body = _requestBody(options.data);
      final bookingId = int.tryParse('${body['bookingId'] ?? ''}') ?? 0;
      final payment = _paymentsByBookingId.putIfAbsent(
        bookingId,
        () => _seedPayment(_bookingFor(bookingId)),
      );
      data = {
        'checkoutUrl': 'https://payfast.test/checkout/${payment['reference']}',
        'reference': payment['reference'],
        'paymentId': payment['id'],
      };
    } else if (path == '/notifications/preferences' && method == 'GET') {
      data = Map<String, dynamic>.from(_notificationPreferences);
    } else if (path == '/notifications/preferences' && method == 'PUT') {
      _notificationPreferences.addAll(_requestBody(options.data));
      data = Map<String, dynamic>.from(_notificationPreferences);
    } else if (path == '/notifications' && method == 'GET') {
      data = {
        'content': _notifications
            .map((item) => Map<String, dynamic>.from(item))
            .toList(),
      };
    } else if (notificationReadMatch != null && method == 'PATCH') {
      final notificationId = int.parse(notificationReadMatch.group(1)!);
      final index = _notifications.indexWhere(
        (notification) => notification['id'] == notificationId,
      );
      if (index >= 0) {
        _notifications[index]['read'] = true;
        data = Map<String, dynamic>.from(_notifications[index]);
      } else {
        data = {'message': 'Notification not found'};
      }
    } else if (path == '/notifications/read-all' && method == 'PATCH') {
      for (final item in _notifications) {
        item['read'] = true;
      }
      data = _notifications.length;
    } else if (path == '/notifications/devices' && method == 'PUT') {
      data = {'status': 'registered'};
    } else if (path == '/notifications/devices/unregister' &&
        method == 'PUT') {
      data = {'status': 'unregistered'};
    } else if (path.contains('/wallet/balance')) {
      data = {
        'available': 2450.00,
        'pending': 350.00,
        'totalEarnings': 8250.00,
        'currency': 'ZAR',
      };
    } else if (path.contains('/wallet/transactions')) {
      data = {'content': List.generate(5, (i) => _mockTransaction(i + 1))};
    } else if (path.contains('/wallet/payouts') && method == 'POST') {
      final body = _requestBody(options.data);
      data = {
        'id': DateTime.now().millisecondsSinceEpoch % 100000,
        'amount': body['amount'] ?? 0,
        'status': 'REQUESTED',
      };
    } else if (path.contains('/disputes') && method == 'GET') {
      data = {'content': List.generate(2, (i) => _mockDispute(i + 1))};
    } else if (path == '/customers/me' && method == 'GET') {
      data = {
        'id': 1,
        'fullName': 'Test User',
        'email': 'test@serveify.co.za',
        'phoneNumber': '+27821234567',
        'role': 'CUSTOMER',
      };
    } else if (path == '/customers/me' && method == 'PUT') {
      data = {
        'id': 1,
        'role': 'CUSTOMER',
        ..._requestBody(options.data),
      };
    } else if (path == '/providers/me' && method == 'GET') {
      data = {
        'id': 1,
        'userId': 101,
        'fullName': 'Test Provider',
        'email': 'provider@serveify.co.za',
        'city': 'Johannesburg',
        'bio': 'Verified service provider',
        'serviceRadiusKm': 25,
        'verificationStatus': 'VERIFIED',
      };
    } else if (path == '/providers/me' && method == 'PUT') {
      data = {
        'id': 1,
        'userId': 101,
        'fullName': 'Test Provider',
        'email': 'provider@serveify.co.za',
        'verificationStatus': 'VERIFIED',
        ..._requestBody(options.data),
      };
    } else {
      data = {'message': 'OK'};
    }

    handler.resolve(
      Response(
        requestOptions: options,
        data: data,
        statusCode: 200,
      ),
    );
  }

  Map<String, dynamic> _requestBody(Object? data) {
    if (data is Map) {
      return Map<String, dynamic>.from(data);
    }
    return const <String, dynamic>{};
  }

  List<Map<String, dynamic>> _requestBodyList(Object? data) {
    if (data is List) {
      return data
          .whereType<Map>()
          .map((entry) => Map<String, dynamic>.from(entry))
          .toList();
    }
    return const <Map<String, dynamic>>[];
  }

  Map<String, dynamic> _bookingFor(int bookingId) {
    return _bookingsById.putIfAbsent(bookingId, () => _seedBooking(bookingId));
  }

  List<Map<String, dynamic>> _bookingEventsFor(int bookingId) {
    return _bookingEventsByBookingId.putIfAbsent(
      bookingId,
      () => _seedBookingEvents(_bookingFor(bookingId)),
    );
  }

  Map<String, dynamic> _handleBookingAction(
    int bookingId,
    String action,
    Map<String, dynamic> body,
  ) {
    final booking = _bookingFor(bookingId);
    final payment = _paymentsByBookingId.putIfAbsent(
      bookingId,
      () => _seedPayment(booking),
    );
    final events = _bookingEventsFor(bookingId);
    final reason = body['reason']?.toString().trim();

    switch (action) {
      case 'accept':
        booking['status'] = 'ACCEPTED';
        payment['status'] = 'AUTHORIZED';
        payment['updatedAt'] = DateTime.now().toIso8601String();
        events.add(_bookingEvent('STATUS_CHANGED', 'Status changed to ACCEPTED (Accepted by provider)'));
        break;
      case 'decline':
        booking['status'] = 'DECLINED';
        events.add(_bookingEvent('STATUS_CHANGED', 'Status changed to DECLINED${reason == null || reason.isEmpty ? '' : ' ($reason)'}'));
        break;
      case 'start':
        booking['status'] = 'IN_PROGRESS';
        events.add(_bookingEvent('STATUS_CHANGED', 'Status changed to IN_PROGRESS (Work started)'));
        break;
      case 'complete':
        booking['status'] = 'COMPLETED';
        payment['status'] = 'CAPTURED';
        payment['updatedAt'] = DateTime.now().toIso8601String();
        events.add(_bookingEvent('STATUS_CHANGED', 'Status changed to COMPLETED (Work completed)'));
        break;
      case 'cancel':
        booking['status'] = 'CANCELLED';
        booking['cancelledReason'] = reason ?? 'Cancelled from mobile app';
        payment['status'] = 'REFUNDED';
        payment['updatedAt'] = DateTime.now().toIso8601String();
        events.add(_bookingEvent('BOOKING_CANCELLED', 'Cancelled: ${booking['cancelledReason']}'));
        break;
      case 'reschedule':
        final newScheduledFor = body['newScheduledFor']?.toString();
        final oldScheduledFor = booking['scheduledFor']?.toString() ?? '';
        if (newScheduledFor != null && newScheduledFor.isNotEmpty) {
          booking['scheduledFor'] = newScheduledFor;
          events.add(
            _bookingEvent(
              'BOOKING_RESCHEDULED',
              'Rescheduled from $oldScheduledFor to $newScheduledFor${reason == null || reason.isEmpty ? '' : ' - $reason'}',
            ),
          );
        }
        break;
    }

    return Map<String, dynamic>.from(booking);
  }

  Map<String, dynamic> _bookingEvent(String eventType, String detail) => {
    'id': DateTime.now().microsecondsSinceEpoch % 100000000,
    'eventType': eventType,
    'detail': detail,
    'occurredAt': DateTime.now().toIso8601String(),
  };

  List<Map<String, dynamic>> _seedBookingEvents(Map<String, dynamic> booking) {
    final events = <Map<String, dynamic>>[
      _bookingEvent('BOOKING_CREATED', 'Booking requested by customer'),
    ];
    switch (booking['status']) {
      case 'ACCEPTED':
        events.add(_bookingEvent('STATUS_CHANGED', 'Status changed to ACCEPTED (Accepted by provider)'));
        break;
      case 'IN_PROGRESS':
        events.add(_bookingEvent('STATUS_CHANGED', 'Status changed to ACCEPTED (Accepted by provider)'));
        events.add(_bookingEvent('STATUS_CHANGED', 'Status changed to IN_PROGRESS (Work started)'));
        break;
      case 'COMPLETED':
        events.add(_bookingEvent('STATUS_CHANGED', 'Status changed to ACCEPTED (Accepted by provider)'));
        events.add(_bookingEvent('STATUS_CHANGED', 'Status changed to IN_PROGRESS (Work started)'));
        events.add(_bookingEvent('STATUS_CHANGED', 'Status changed to COMPLETED (Work completed)'));
        break;
    }
    return events;
  }

  Map<String, dynamic> _seedPayment(Map<String, dynamic> booking) {
    final payment = _mockPayment(
      booking['id'] as int? ?? 0,
      amount: (booking['quotedPrice'] as num?)?.toDouble() ?? 0,
    );
    switch (booking['status']) {
      case 'ACCEPTED':
      case 'IN_PROGRESS':
        payment['status'] = 'AUTHORIZED';
        break;
      case 'COMPLETED':
        payment['status'] = 'CAPTURED';
        break;
      case 'CANCELLED':
        payment['status'] = 'REFUNDED';
        break;
    }
    return payment;
  }

  List<Map<String, dynamic>> _providerAvailabilityFor(int providerId) {
    return (_providerAvailability[providerId] ?? _providerAvailability[1] ?? const <Map<String, dynamic>>[])
        .map((entry) => Map<String, dynamic>.from(entry))
        .toList();
  }

  List<Map<String, dynamic>> _mockBookableDays(
    int providerId,
    Map<String, dynamic> queryParameters,
  ) {
    final from = DateTime.tryParse(queryParameters['from']?.toString() ?? '') ??
        DateTime.now();
    final days = int.tryParse('${queryParameters['days'] ?? ''}') ?? 14;
    final durationMinutes =
        int.tryParse('${queryParameters['durationMinutes'] ?? ''}') ?? 60;
    final availability = _providerAvailabilityFor(providerId);

    return List.generate(days, (index) {
      final date = DateTime(from.year, from.month, from.day).add(Duration(days: index));
      final dayOfWeek = date.weekday % 7;
      final slotIndex = availability.indexWhere(
        (entry) => entry['dayOfWeek'] == dayOfWeek,
      );
      final slot = slotIndex >= 0 ? availability[slotIndex] : null;
      if (slot == null || slot['enabled'] == false) {
        return {
          'date': date.toIso8601String(),
          'dayOfWeek': dayOfWeek,
          'dayName': _dayName(dayOfWeek),
          'enabled': false,
          'startTime': null,
          'endTime': null,
          'slots': const <Map<String, dynamic>>[],
        };
      }

      final startParts = slot['startTime']!.toString().split(':');
      final endParts = slot['endTime']!.toString().split(':');
      final startHour = int.parse(startParts[0]);
      final startMinute = int.parse(startParts[1]);
      final endHour = int.parse(endParts[0]);
      final endMinute = int.parse(endParts[1]);
      final slotStart = DateTime(date.year, date.month, date.day, startHour, startMinute);
      final slotEnd = DateTime(date.year, date.month, date.day, endHour, endMinute);
      final slots = <Map<String, dynamic>>[];
      var cursor = slotStart;
      while (cursor.add(Duration(minutes: durationMinutes)).isBefore(slotEnd) ||
          cursor.add(Duration(minutes: durationMinutes)).isAtSameMomentAs(slotEnd)) {
        slots.add({
          'startsAt': cursor.toIso8601String(),
          'endsAt': cursor.add(Duration(minutes: durationMinutes)).toIso8601String(),
          'label':
              '${cursor.hour.toString().padLeft(2, '0')}:${cursor.minute.toString().padLeft(2, '0')}',
        });
        cursor = cursor.add(const Duration(minutes: 30));
      }

      return {
        'date': date.toIso8601String(),
        'dayOfWeek': dayOfWeek,
        'dayName': _dayName(dayOfWeek),
        'enabled': true,
        'startTime': slot['startTime'],
        'endTime': slot['endTime'],
        'slots': slots,
      };
    });
  }

  static String _dayName(int dayOfWeek) {
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return dayNames[dayOfWeek.clamp(0, 6)];
  }

  static String _inferCardBrand(String digits) {
    if (digits.startsWith('4')) {
      return 'Visa';
    }
    if (digits.startsWith('5')) {
      return 'Mastercard';
    }
    if (digits.startsWith('34') || digits.startsWith('37')) {
      return 'American Express';
    }
    return 'Card';
  }

  Map<String, dynamic> _mockPayment(int bookingId, {required double amount}) => {
    'id': bookingId + 5000,
    'bookingId': bookingId,
    'status': 'INITIATED',
    'grossAmount': amount,
    'commissionAmount': amount * 0.12,
    'providerNetAmount': amount * 0.88,
    'reference': 'pay_mock_$bookingId',
    'updatedAt': DateTime.now().toIso8601String(),
  };

  Map<String, dynamic> _seedBooking(
    int id, {
    int? providerId,
    int? serviceOfferingId,
    String? address,
    String? notes,
    String? scheduledFor,
  }) =>
      _mockBooking(
        id,
        providerId: providerId,
        serviceOfferingId: serviceOfferingId,
        address: address,
        notes: notes,
        scheduledFor: scheduledFor,
      );

  Map<String, dynamic> _mockBooking(
    int id, {
    int? providerId,
    int? serviceOfferingId,
    String? address,
    String? notes,
    String? scheduledFor,
  }) {
    final resolvedServiceId =
        serviceOfferingId == null || serviceOfferingId <= 0
            ? ((id - 1) % 12) + 1
            : serviceOfferingId;
    final service = _mockService(resolvedServiceId, providerId: providerId);

    return {
      'id': id,
      'providerId': service['providerId'],
      'serviceOfferingId': service['id'],
      'serviceName': service['serviceName'],
      'providerName': service['providerName'],
      'customerName': 'Test User',
      'status': [
        'REQUESTED',
        'ACCEPTED',
        'IN_PROGRESS',
        'COMPLETED',
        'COMPLETED',
      ][(id - 1) % 5],
      'scheduledFor':
          scheduledFor ??
          DateTime.now()
              .add(Duration(days: ((id - 1) % 5) + 1))
              .toIso8601String(),
      'address': address ?? '${id * 12} Main Road, Cape Town',
      'notes': notes ?? (id.isEven ? 'Please arrive on time' : null),
      'estimatedDurationMinutes': service['estimatedDurationMinutes'],
      'quotedPrice': service['price'],
      'createdAt':
          DateTime.now()
              .subtract(Duration(days: ((id - 1) % 5) + 1))
              .toIso8601String(),
      'cancelledReason': null,
    };
  }

  Map<String, dynamic> _providerSummary(int id) {
    final index = (id - 1) % _providerNames.length;
    final coordinates = _providerCoordinates[index];
    return {
      'id': id,
      'userId': id + 100,
      'fullName': _providerNames[index],
      'userName': _providerNames[index],
      'businessName': _providerNames[index],
      'bio':
          'Professional service provider with ${id + 3} years of experience in the industry.',
      'city': _providerCities[index],
      'serviceRadiusKm': 10 + id * 5,
      'averageRating': 4.2 + (index % 3) * 0.2,
      'reviewCount': id * 7 + 3,
      'latitude': coordinates.$1,
      'longitude': coordinates.$2,
      'verificationStatus': 'VERIFIED',
      'verified': true,
    };
  }

  Map<String, dynamic> _seedMockService(int id, {int? providerId}) {
    final resolvedProviderId =
        providerId == null || providerId <= 0
            ? ((id - 1) % _providerNames.length) + 1
            : providerId;
    final provider = _providerSummary(resolvedProviderId);
    final category = [
      'Plumbing',
      'Cleaning',
      'Gardening',
      'Electrical',
      'Painting',
      'Carpentry',
    ][(id - 1) % 6];
    final serviceName = [
      'Pipe Repair',
      'House Cleaning',
      'Garden Service',
      'Electrical Wiring',
      'Interior Painting',
      'Furniture Assembly',
      'Drain Unblocking',
      'Office Cleaning',
      'Lawn Mowing',
      'Light Fitting',
      'Wall Painting',
      'Cabinet Repair',
    ][(id - 1) % 12];
    final price = (120 + id * 55).toDouble();
    final duration = 60 + (id % 4) * 30;

    return {
      'id': id,
      'providerId': resolvedProviderId,
      'providerName': provider['fullName'],
      'providerCity': provider['city'],
      'providerBio': provider['bio'],
      'averageRating': provider['averageRating'],
      'reviewCount': provider['reviewCount'],
      'verificationStatus': provider['verificationStatus'],
      'serviceRadiusKm': provider['serviceRadiusKm'],
      'latitude': provider['latitude'],
      'longitude': provider['longitude'],
      'category': category,
      'categoryName': category,
      'serviceName': serviceName,
      'name': serviceName,
      'description': [
        'Expert pipe repair service that covers leaks, burst pipes, and worn fittings.',
        'Fast drain unblocking using professional equipment and eco-friendly solutions.',
        'Thorough deep cleaning for homes and offices. We leave every surface spotless.',
        'Weekly or once-off lawn mowing and garden maintenance for any size yard.',
        'Complete electrical rewiring to bring your property up to code safely.',
        'Interior and exterior wall painting with premium paints and clean finishes.',
        'Custom furniture assembly for flat-pack units, shelving, desks, and more.',
        'Geyser installation and repair by certified plumbing professionals.',
      ][(id - 1) % 8],
      'pricingType': id.isEven ? 'FIXED' : 'HOURLY',
      'price': price,
      'basePrice': price,
      'estimatedDurationMinutes': duration,
      'durationMinutes': duration,
    };
  }

  Map<String, dynamic> _mockProvider(int id) {
    final provider = _providerSummary(id);
    final services = _catalogServices
        .where((service) => service['providerId'] == id)
        .map((service) => Map<String, dynamic>.from(service))
        .toList();

    return {
      ...provider,
      'categoryName':
          services.isNotEmpty ? services.first['category'] : 'Service',
      'services': services,
    };
  }

  Map<String, dynamic> _mockService(int id, {int? providerId}) {
    final existing = _catalogServices.where((service) {
      if (service['id'] != id) {
        return false;
      }
      if (providerId == null || providerId <= 0) {
        return true;
      }
      return service['providerId'] == providerId;
    });

    if (existing.isNotEmpty) {
      return Map<String, dynamic>.from(existing.first);
    }

    return _seedMockService(id, providerId: providerId);
  }

  double _distanceKm(
    double fromLat,
    double fromLng,
    double toLat,
    double toLng,
  ) {
    final latDelta = fromLat - toLat;
    final lngDelta = fromLng - toLng;
    return math.sqrt((latDelta * latDelta) + (lngDelta * lngDelta)) * 111;
  }

  Map<String, dynamic> _mockReview(int id, {required int providerId}) => {
    'id': id,
    'bookingId': id,
    'customerId': 1,
    'customerName': 'Customer $id',
    'providerId': providerId,
    'rating': 3 + ((id - 1) % 3),
    'comment': [
      'Great work, very professional!',
      'On time and did a good job.',
      'Would recommend to anyone.',
    ][(id - 1) % 3],
    'providerResponse': id.isEven ? 'Thank you for the kind words!' : null,
    'createdAt':
        DateTime.now().subtract(Duration(days: id * 5)).toIso8601String(),
  };

  Map<String, dynamic> _mockChatMessage(int id, {required int bookingId}) => {
    'id': id,
    'bookingId': bookingId,
    'senderId': id.isEven ? 1 : 2,
    'senderName': id.isEven ? 'You' : 'Provider',
    'content': [
      'Hi, when can you come?',
      'I can be there at 2pm tomorrow.',
      'That works, thanks!',
      'Great, see you then.',
      'Should I bring any materials?',
      'No, I have everything needed.',
    ][(id - 1) % 6],
    'sentAt':
        DateTime.now()
            .subtract(Duration(minutes: (6 - id) * 15))
            .toIso8601String(),
    'clientMessageId': null,
    'createdAt':
        DateTime.now()
            .subtract(Duration(minutes: (6 - id) * 15))
            .toIso8601String(),
  };

  Map<String, dynamic> _mockTransaction(int id) => {
    'id': id,
    'type': id.isEven ? 'CREDIT' : 'DEBIT',
    'amount': (100 + id * 125).toDouble(),
    'description':
        id.isEven ? 'Payment for Booking #${id + 10}' : 'Payout to bank account',
    'status': 'COMPLETED',
    'createdAt':
        DateTime.now().subtract(Duration(days: id * 3)).toIso8601String(),
  };

  Map<String, dynamic> _mockDispute(int id) => {
    'id': id,
    'bookingId': id + 5,
    'status': id == 1 ? 'OPEN' : 'RESOLVED',
    'reason':
        id == 1
            ? 'Provider did not show up on the scheduled date.'
            : 'Service was not completed as described.',
    'resolutionType': id == 2 ? 'REFUND' : null,
    'resolutionNotes': id == 2 ? 'Full refund issued to customer.' : null,
    'createdAt':
        DateTime.now().subtract(Duration(days: id * 7)).toIso8601String(),
  };
}
