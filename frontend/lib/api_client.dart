import 'dart:convert';

import 'package:http/http.dart' as http;

import 'models.dart';

class ServeHubApiClient {
  ServeHubApiClient({
    http.Client? httpClient,
    this.baseUrl = 'http://localhost:8080/api/v1',
  }) : _httpClient = httpClient ?? http.Client();

  final http.Client _httpClient;
  final String baseUrl;

  Future<List<ServiceOffering>> fetchServices() async {
    final response = await _httpClient.get(Uri.parse('$baseUrl/catalog/services'));
    _ensureSuccess(response);
    final jsonList = jsonDecode(response.body) as List<dynamic>;
    return jsonList
        .map((item) => ServiceOffering.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    _ensureSuccess(response);
    return AuthSession.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<List<Booking>> fetchBookings(String token) async {
    final response = await _httpClient.get(
      Uri.parse('$baseUrl/bookings'),
      headers: _headers(token),
    );
    _ensureSuccess(response);
    final jsonList = jsonDecode(response.body) as List<dynamic>;
    return jsonList
        .map((item) => Booking.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<Booking> createBooking({
    required String token,
    required int customerId,
    required int providerId,
    required int serviceOfferingId,
    required DateTime scheduledFor,
    required String address,
    String? notes,
  }) async {
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/bookings'),
      headers: _headers(token),
      body: jsonEncode({
        'customerId': customerId,
        'providerId': providerId,
        'serviceOfferingId': serviceOfferingId,
        'scheduledFor': scheduledFor.toUtc().toIso8601String(),
        'address': address,
        'notes': notes,
      }),
    );
    _ensureSuccess(response);
    return Booking.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<Booking> triggerBookingAction({
    required String token,
    required int bookingId,
    required String action,
    String? reason,
  }) async {
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/bookings/$bookingId/$action'),
      headers: _headers(token),
      body: reason == null ? null : jsonEncode({'reason': reason}),
    );
    _ensureSuccess(response);
    return Booking.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<PaymentRecord> fetchPayment(String token, int bookingId) async {
    final response = await _httpClient.get(
      Uri.parse('$baseUrl/payments/booking/$bookingId'),
      headers: _headers(token),
    );
    _ensureSuccess(response);
    return PaymentRecord.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Map<String, String> _headers(String token) => {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };

  void _ensureSuccess(http.Response response) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('API request failed (${response.statusCode}): ${response.body}');
    }
  }
}
