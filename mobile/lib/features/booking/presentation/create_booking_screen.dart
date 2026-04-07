import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/features/auth/providers/auth_provider.dart';
import 'package:serveify/features/payment/data/payment_repository.dart';
import 'package:serveify/features/payment/data/saved_payment_methods_repository.dart';
import 'package:serveify/features/services/data/service_catalog_provider.dart';
import 'package:serveify/features/services/providers/cart_provider.dart';

const _checkoutSteps = <_CheckoutStepMeta>[
  _CheckoutStepMeta(
    title: 'Services',
    description: 'Choose what to book and review live pricing.',
  ),
  _CheckoutStepMeta(
    title: 'Provider',
    description: 'Pick a specific pro where more than one is available.',
  ),
  _CheckoutStepMeta(
    title: 'Schedule',
    description: 'Choose the day and time that works for you.',
  ),
  _CheckoutStepMeta(
    title: 'Review',
    description: 'Add final details, choose payment, and confirm.',
  ),
];

const _paymentOptions = <_PaymentMethodOption>[
  _PaymentMethodOption(
    value: 'card',
    label: 'Card',
    subtitle: 'Authorize now',
    icon: Icons.credit_card_rounded,
  ),
  _PaymentMethodOption(
    value: 'eft',
    label: 'EFT',
    subtitle: 'Bank transfer',
    icon: Icons.account_balance_rounded,
  ),
  _PaymentMethodOption(
    value: 'cash',
    label: 'Cash',
    subtitle: 'Pay in person',
    icon: Icons.payments_outlined,
  ),
];

class _CheckoutStepMeta {
  final String title;
  final String description;

  const _CheckoutStepMeta({
    required this.title,
    required this.description,
  });
}

class _PaymentMethodOption {
  final String value;
  final String label;
  final String subtitle;
  final IconData icon;

  const _PaymentMethodOption({
    required this.value,
    required this.label,
    required this.subtitle,
    required this.icon,
  });
}

class _AddressResult {
  final String displayName;
  final double lat;
  final double lon;

  const _AddressResult({
    required this.displayName,
    required this.lat,
    required this.lon,
  });
}

class _PaymentSummary {
  final int bookingId;
  final String status;
  final String reference;
  final double amount;

  const _PaymentSummary({
    required this.bookingId,
    required this.status,
    required this.reference,
    required this.amount,
  });

  factory _PaymentSummary.fromJson(Map<String, dynamic> json) {
    final rawAmount = json['grossAmount'];
    final amount = rawAmount is num
        ? rawAmount.toDouble()
        : double.tryParse(rawAmount?.toString() ?? '') ?? 0;

    return _PaymentSummary(
      bookingId: (json['bookingId'] as num?)?.toInt() ?? 0,
      status: json['status']?.toString() ?? 'INITIATED',
      reference: json['reference']?.toString() ?? 'Pending',
      amount: amount,
    );
  }

  factory _PaymentSummary.fromStatus(PaymentStatus status) {
    return _PaymentSummary(
      bookingId: status.bookingId,
      status: status.status,
      reference: status.reference,
      amount: status.grossAmount,
    );
  }

  bool get isRetryable => status == 'INITIATED' || status == 'FAILED';

  bool get isAuthorizedLike => status == 'AUTHORIZED' || status == 'CAPTURED';
}

class _CheckoutConfirmation {
  final List<int> bookingIds;
  final List<String> serviceNames;
  final List<String> providerNames;
  final DateTime scheduledAt;
  final int durationMinutes;
  final String address;
  final String paymentMethod;
  final List<_PaymentSummary> payments;
  final double totalAmount;
  final String? paymentDetail;
  final String? partialFailureMessage;

  const _CheckoutConfirmation({
    required this.bookingIds,
    required this.serviceNames,
    required this.providerNames,
    required this.scheduledAt,
    required this.durationMinutes,
    required this.address,
    required this.paymentMethod,
    required this.payments,
    required this.totalAmount,
    this.paymentDetail,
    this.partialFailureMessage,
  });

  int get bookingCount => bookingIds.length;
}

class _ProviderScheduleRequirement {
  final int providerId;
  final String providerName;
  final int durationMinutes;

  const _ProviderScheduleRequirement({
    required this.providerId,
    required this.providerName,
    required this.durationMinutes,
  });
}

class _BookableDay {
  final DateTime date;
  final int dayOfWeek;
  final String dayName;
  final bool enabled;
  final String? startTime;
  final String? endTime;
  final List<_BookableSlot> slots;

  const _BookableDay({
    required this.date,
    required this.dayOfWeek,
    required this.dayName,
    required this.enabled,
    required this.startTime,
    required this.endTime,
    required this.slots,
  });

  factory _BookableDay.fromJson(Map<String, dynamic> json) {
    final rawDate = json['date']?.toString() ?? DateTime.now().toIso8601String();
    final parsedDate = DateTime.tryParse(rawDate) ?? DateTime.now();
    final slots = (json['slots'] as List? ?? const <dynamic>[])
        .whereType<Map>()
        .map((slot) => _BookableSlot.fromJson(Map<String, dynamic>.from(slot)))
        .toList()
      ..sort((left, right) => left.startsAt.compareTo(right.startsAt));

    return _BookableDay(
      date: DateTime(parsedDate.year, parsedDate.month, parsedDate.day),
      dayOfWeek: (json['dayOfWeek'] as num?)?.toInt() ?? parsedDate.weekday % 7,
      dayName: json['dayName']?.toString() ?? DateFormat('EEEE').format(parsedDate),
      enabled: json['enabled'] == true,
      startTime: json['startTime']?.toString(),
      endTime: json['endTime']?.toString(),
      slots: slots,
    );
  }
}

class _BookableSlot {
  final DateTime startsAt;
  final DateTime endsAt;
  final String label;

  const _BookableSlot({
    required this.startsAt,
    required this.endsAt,
    required this.label,
  });

  factory _BookableSlot.fromJson(Map<String, dynamic> json) {
    final start = DateTime.tryParse(json['startsAt']?.toString() ?? '') ?? DateTime.now();
    final end = DateTime.tryParse(json['endsAt']?.toString() ?? '') ?? start.add(const Duration(hours: 1));
    return _BookableSlot(
      startsAt: start,
      endsAt: end,
      label: json['label']?.toString() ?? DateFormat('HH:mm').format(start),
    );
  }
}

class _ScheduledBookingRequest {
  final CartItem item;
  final DateTime scheduledAt;

  const _ScheduledBookingRequest({
    required this.item,
    required this.scheduledAt,
  });
}

class CreateBookingScreen extends ConsumerStatefulWidget {
  final int? serviceId;
  final int? providerId;

  const CreateBookingScreen({
    super.key,
    this.serviceId,
    this.providerId,
  });

  @override
  ConsumerState<CreateBookingScreen> createState() =>
      _CreateBookingScreenState();
}

class _CreateBookingScreenState extends ConsumerState<CreateBookingScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _notesController = TextEditingController();
  final _searchController = TextEditingController();

  int _step = 0;
  DateTime? _selectedDate;
  String? _selectedTime;
  String _paymentMethod = 'card';
  String _catalogQuery = '';

  bool _searchingAddress = false;
  bool _submittingCheckout = false;
  bool _seedingService = false;
  bool _profileLoaded = false;
  bool _loadingAvailability = false;
  bool _refreshingPayments = false;

  Timer? _debounce;
  List<_AddressResult> _suggestions = const [];
  List<_BookableDay> _availableSchedule = const [];
  _CheckoutConfirmation? _confirmation;
  String? _availabilityError;
  String? _scheduleSignature;
  int? _selectedSavedPaymentMethodId;
  final Set<int> _paymentActionBookingIds = <int>{};

  @override
  void initState() {
    super.initState();
    final auth = ref.read(authProvider);
    if ((auth.email ?? '').isNotEmpty) {
      _emailController.text = auth.email!;
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadCustomerProfile();
      _ensureSeededService();
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _notesController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadCustomerProfile() async {
    if (_profileLoaded) {
      return;
    }
    _profileLoaded = true;

    try {
      final response = await ref.read(dioProvider).get('/customers/me');
      final data = Map<String, dynamic>.from(response.data as Map);

      if (_nameController.text.trim().isEmpty) {
        _nameController.text = data['fullName']?.toString() ?? '';
      }
      if (_emailController.text.trim().isEmpty) {
        _emailController.text = data['email']?.toString() ?? '';
      }
      if (_phoneController.text.trim().isEmpty) {
        _phoneController.text = data['phoneNumber']?.toString() ?? '';
      }

      if (mounted) {
        setState(() {});
      }
    } catch (_) {}
  }

  Future<void> _ensureSeededService() async {
    if (widget.serviceId == null) {
      return;
    }

    final cart = ref.read(cartProvider);
    if (cart.containsService(widget.serviceId!)) {
      return;
    }

    setState(() => _seedingService = true);

    try {
      final offering =
          await ref.read(serviceOfferingProvider(widget.serviceId!).future);
      if (!mounted) {
        return;
      }

      ref
          .read(cartProvider.notifier)
          .addItem(_serviceItemFromOffering(offering));
    } catch (_) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('We could not preload that service.'),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _seedingService = false);
      }
    }
  }

  void _searchAddress(String query) {
    _debounce?.cancel();
    final trimmed = query.trim();

    if (trimmed.length < 3) {
      setState(() {
        _suggestions = const [];
        _searchingAddress = false;
      });
      return;
    }

    _debounce = Timer(const Duration(milliseconds: 350), () async {
      setState(() => _searchingAddress = true);

      try {
        final uri = Uri.parse(
          'https://nominatim.openstreetmap.org/search'
          '?q=${Uri.encodeComponent(trimmed)}'
          '&format=json'
          '&addressdetails=1'
          '&limit=5'
          '&countrycodes=za',
        );
        final response = await http.get(
          uri,
          headers: const {
            'User-Agent': 'Serveify/1.0',
            'Accept-Language': 'en',
          },
        );

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body) as List;
          final suggestions = data
              .whereType<Map>()
              .map(
                (entry) => _AddressResult(
                  displayName: entry['display_name']?.toString() ?? '',
                  lat: double.tryParse(entry['lat']?.toString() ?? '') ?? 0,
                  lon: double.tryParse(entry['lon']?.toString() ?? '') ?? 0,
                ),
              )
              .where((result) => result.displayName.isNotEmpty)
              .toList();

          if (mounted) {
            setState(() => _suggestions = suggestions);
          }
        }
      } catch (_) {
        if (mounted) {
          setState(() => _suggestions = const []);
        }
      } finally {
        if (mounted) {
          setState(() => _searchingAddress = false);
        }
      }
    });
  }

  List<_ProviderScheduleRequirement> _providerRequirements(CartState cart) {
    final grouped = <int, _ProviderScheduleRequirement>{};

    for (final item in cart.items) {
      final providerId = item.service.providerId;
      if (providerId == null) {
        continue;
      }

      final durationMinutes =
          (item.service.estimatedDurationMinutes ?? 60) * item.quantity;
      final existing = grouped[providerId];
      grouped[providerId] = _ProviderScheduleRequirement(
        providerId: providerId,
        providerName: item.service.providerName ?? 'Provider',
        durationMinutes: (existing?.durationMinutes ?? 0) + durationMinutes,
      );
    }

    return grouped.values.toList()
      ..sort((left, right) => left.providerName.compareTo(right.providerName));
  }

  String _availabilitySignatureForCart(CartState cart) {
    final parts = _providerRequirements(cart)
        .map((requirement) => '${requirement.providerId}:${requirement.durationMinutes}')
        .toList()
      ..sort();
    return parts.join('|');
  }

  List<_ScheduledBookingRequest> _buildScheduledRequests(
    CartState cart,
    DateTime scheduledAt,
  ) {
    final providerOffsets = <int, int>{};
    final requests = <_ScheduledBookingRequest>[];

    for (final item in cart.items) {
      final providerId = item.service.providerId;
      if (providerId == null) {
        continue;
      }

      final durationMinutes = item.service.estimatedDurationMinutes ?? 60;
      for (var index = 0; index < item.quantity; index++) {
        final offsetMinutes = providerOffsets[providerId] ?? 0;
        requests.add(
          _ScheduledBookingRequest(
            item: item,
            scheduledAt: scheduledAt.add(Duration(minutes: offsetMinutes)),
          ),
        );
        providerOffsets[providerId] = offsetMinutes + durationMinutes;
      }
    }

    return requests;
  }

  Future<void> _refreshScheduleAvailability(
    CartState cart, {
    bool force = false,
  }) async {
    final signature = _availabilitySignatureForCart(cart);
    if (!force && signature == _scheduleSignature && _availableSchedule.isNotEmpty) {
      return;
    }

    final requirements = _providerRequirements(cart);
    if (requirements.isEmpty) {
      if (!mounted) {
        return;
      }
      setState(() {
        _availableSchedule = const [];
        _availabilityError = 'Choose a provider before scheduling.';
        _scheduleSignature = signature;
        _selectedDate = null;
        _selectedTime = null;
      });
      return;
    }

    if (mounted) {
      setState(() {
        _loadingAvailability = true;
        _availabilityError = null;
      });
    }

    try {
      final dio = ref.read(dioProvider);
      final from = DateFormat('yyyy-MM-dd').format(DateTime.now());
      final providerSchedules = await Future.wait(
        requirements.map((requirement) async {
          final response = await dio.get(
            '/providers/${requirement.providerId}/availability/slots',
            queryParameters: {
              'from': from,
              'days': 14,
              'durationMinutes': requirement.durationMinutes,
            },
          );
          final data = response.data as List? ?? const <dynamic>[];
          return data
              .whereType<Map>()
              .map((item) => _BookableDay.fromJson(Map<String, dynamic>.from(item)))
              .toList();
        }),
      );

      final merged = _intersectBookableDays(providerSchedules);
      if (!mounted) {
        return;
      }

      _BookableDay? validSelectedDay;
      if (_selectedDate != null) {
        final selectedDayIndex = merged.indexWhere(
          (day) => DateUtils.isSameDay(day.date, _selectedDate),
        );
        if (selectedDayIndex >= 0) {
          validSelectedDay = merged[selectedDayIndex];
        }
      }

      _BookableSlot? validSelectedTime;
      if (validSelectedDay != null && _selectedTime != null) {
        final selectedSlotIndex = validSelectedDay.slots.indexWhere(
          (slot) => slot.label == _selectedTime,
        );
        if (selectedSlotIndex >= 0) {
          validSelectedTime = validSelectedDay.slots[selectedSlotIndex];
        }
      }

      setState(() {
        _availableSchedule = merged;
        _scheduleSignature = signature;
        _loadingAvailability = false;
        _availabilityError = merged.any((day) => day.slots.isNotEmpty)
            ? null
            : 'No shared availability was found for the selected providers in the next two weeks.';
        _selectedDate = validSelectedDay?.date;
        _selectedTime = validSelectedTime?.label;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _availableSchedule = const [];
        _scheduleSignature = signature;
        _loadingAvailability = false;
        _availabilityError =
            'We could not load provider availability right now.';
        _selectedDate = null;
        _selectedTime = null;
      });
    }
  }

  List<_BookableDay> _intersectBookableDays(List<List<_BookableDay>> schedules) {
    if (schedules.isEmpty) {
      return const [];
    }

    final daysByDate = <String, List<_BookableDay>>{};
    for (final schedule in schedules) {
      for (final day in schedule) {
        final key = DateFormat('yyyy-MM-dd').format(day.date);
        daysByDate.putIfAbsent(key, () => <_BookableDay>[]).add(day);
      }
    }

    final merged = <_BookableDay>[];
    final sortedKeys = daysByDate.keys.toList()..sort();
    for (final key in sortedKeys) {
      final entries = daysByDate[key]!;
      if (entries.length != schedules.length) {
        continue;
      }

      final slotMaps = entries.map((day) {
        return {
          for (final slot in day.slots) slot.label: slot,
        };
      }).toList();

      final commonLabels = slotMaps
          .map((map) => map.keys.toSet())
          .reduce((left, right) => left.intersection(right))
          .toList()
        ..sort();

      final commonSlots = commonLabels.map((label) {
        final matchingSlots = slotMaps.map((map) => map[label]!).toList();
        final latestEnd = matchingSlots
            .map((slot) => slot.endsAt)
            .reduce((left, right) => left.isAfter(right) ? left : right);
        return _BookableSlot(
          startsAt: matchingSlots.first.startsAt,
          endsAt: latestEnd,
          label: label,
        );
      }).toList();

      final first = entries.first;
      merged.add(
        _BookableDay(
          date: first.date,
          dayOfWeek: first.dayOfWeek,
          dayName: first.dayName,
          enabled: commonSlots.isNotEmpty,
          startTime: commonSlots.isEmpty ? null : commonSlots.first.label,
          endTime: commonSlots.isEmpty ? null : commonSlots.last.label,
          slots: commonSlots,
        ),
      );
    }

    return merged;
  }

  List<_BookableSlot> _slotsForSelectedDate() {
    final day = _dayForDate(_selectedDate);
    return day?.slots ?? const [];
  }

  _BookableDay? _dayForDate(DateTime? date) {
    if (date == null) {
      return null;
    }
    final index = _availableSchedule.indexWhere(
      (entry) => DateUtils.isSameDay(entry.date, date),
    );
    if (index < 0) {
      return null;
    }
    return _availableSchedule[index];
  }

  int _checkoutWindowDurationMinutes(CartState cart) {
    final requirements = _providerRequirements(cart);
    if (requirements.isEmpty) {
      return 0;
    }
    return requirements
        .map((requirement) => requirement.durationMinutes)
        .reduce((left, right) => left > right ? left : right);
  }

  DateTime? get _scheduledAt {
    if (_selectedDate == null || _selectedTime == null) {
      return null;
    }

    final parts = _selectedTime!.split(':');
    return DateTime(
      _selectedDate!.year,
      _selectedDate!.month,
      _selectedDate!.day,
      int.parse(parts[0]),
      int.parse(parts[1]),
    );
  }

  bool _canContinue(CartState cart) {
    switch (_step) {
      case 0:
        return cart.items.isNotEmpty;
      case 1:
        return cart.items.every((item) => item.service.providerId != null);
      case 2:
        return _scheduledAt != null;
      case 3:
        return _nameController.text.trim().isNotEmpty &&
            _emailController.text.trim().contains('@') &&
            _phoneController.text.trim().isNotEmpty &&
            _addressController.text.trim().isNotEmpty;
      default:
        return false;
    }
  }

  void _goToNextStep(CartState cart) {
    FocusScope.of(context).unfocus();

    if (!_canContinue(cart)) {
      _showValidationMessage();
      return;
    }

    if (_step < _checkoutSteps.length - 1) {
      final nextStep = _step + 1;
      setState(() => _step = nextStep);
      if (nextStep == 2) {
        unawaited(_refreshScheduleAvailability(cart));
      }
    }
  }

  void _goToPreviousStep() {
    FocusScope.of(context).unfocus();
    if (_step == 0) {
      context.pop();
      return;
    }

    setState(() => _step -= 1);
  }

  void _showValidationMessage() {
    final message = switch (_step) {
      0 => 'Add at least one service to continue.',
      1 => 'Choose a provider for each selected service.',
      2 => 'Choose both a day and a time slot.',
      3 => 'Complete your contact details and address first.',
      _ => 'Complete the required details to continue.',
    };

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final firstDate = DateTime(now.year, now.month, now.day);
    final lastAvailableDate = _availableSchedule.isNotEmpty
        ? _availableSchedule.last.date
        : firstDate.add(const Duration(days: 13));
    final initialDate = _selectedDate ?? firstDate;

    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate,
      lastDate: lastAvailableDate,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppColors.accent,
              onPrimary: Colors.black,
              surface: AppColors.surface,
              onSurface: Colors.white,
            ),
            dialogTheme: const DialogThemeData(
              backgroundColor: AppColors.surface,
            ),
          ),
          child: child ?? const SizedBox.shrink(),
        );
      },
    );

    if (picked != null) {
      if (!mounted) {
        return;
      }
      final matchingDay = _dayForDate(picked);
      setState(() {
        _selectedDate = DateTime(picked.year, picked.month, picked.day);
        _selectedTime = null;
      });
      if (matchingDay == null || matchingDay.slots.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('There are no shared slots available on that day.'),
          ),
        );
      }
    }
  }

  Future<void> _submitCheckout(CartState cart) async {
    if (_submittingCheckout) {
      return;
    }

    if (!_canContinue(cart)) {
      _showValidationMessage();
      return;
    }

    final scheduledAt = _scheduledAt;
    if (scheduledAt == null) {
      _showValidationMessage();
      return;
    }

    SavedPaymentMethodModel? savedPaymentMethod;
    Object? savedMethodsError;
    if (_paymentMethod == 'card') {
      try {
        final methods = await ref.read(savedPaymentMethodsProvider.future);
        savedPaymentMethod = _effectiveSavedPaymentMethod(methods);
      } catch (error) {
        savedMethodsError = error;
      }

      if (savedPaymentMethod == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                savedMethodsError == null
                    ? 'Add a saved card before using card checkout.'
                    : 'We could not load your saved cards. Retry or choose EFT/cash.',
              ),
            ),
          );
        }
        return;
      }
    }

    setState(() => _submittingCheckout = true);

    final dio = ref.read(dioProvider);
    final successCounts = <int, int>{};
    final requests = _buildScheduledRequests(cart, scheduledAt);
    final createdBookingIds = <int>[];
    final bookedServices = <String>[];
    final bookedProviders = <String>[];
    final payments = <_PaymentSummary>[];
    var bookedTotal = 0.0;
    final bookedDurationMinutes = _checkoutWindowDurationMinutes(cart);
    String? failureMessage;

    try {
      outerLoop:
      for (final request in requests) {
        final item = request.item;
        if (item.service.providerId == null) {
          failureMessage = 'One or more services do not have a provider yet.';
          break;
        }

        try {
          final bookingResponse = await dio.post(
            '/bookings',
            data: {
              'providerId': item.service.providerId,
              'serviceOfferingId': item.service.id,
              'scheduledFor': _formatOffsetDateTime(request.scheduledAt),
              'address': _addressController.text.trim(),
              'notes': _composeBookingNotes(
                item,
                savedPaymentMethod: savedPaymentMethod,
              ),
            },
          );

          final data = Map<String, dynamic>.from(bookingResponse.data as Map);
          final bookingId = (data['id'] as num?)?.toInt();
          if (bookingId == null) {
            throw Exception('Booking response did not include an id.');
          }

          createdBookingIds.add(bookingId);
          bookedServices.add(item.service.name);
          bookedProviders.add(item.service.providerName ?? 'Provider');
          bookedTotal += item.service.priceValue;
          successCounts.update(
            item.service.id,
            (value) => value + 1,
            ifAbsent: () => 1,
          );

          final payment = await _loadPaymentSummary(
            bookingId,
            paymentMethod: _paymentMethod,
            attemptAuthorize: _paymentMethod != 'cash',
          );
          if (payment != null) {
            payments.add(payment);
          }
        } catch (error) {
          failureMessage = error.toString();
          break outerLoop;
        }
      }

      if (createdBookingIds.isEmpty && failureMessage != null) {
        throw Exception(failureMessage);
      }

      _removeBookedItemsFromCart(cart, successCounts);

      if (!mounted) {
        return;
      }

      setState(() {
        _confirmation = _CheckoutConfirmation(
          bookingIds: createdBookingIds,
          serviceNames: bookedServices,
          providerNames: bookedProviders.toSet().toList(),
          scheduledAt: scheduledAt,
          durationMinutes: bookedDurationMinutes,
          address: _addressController.text.trim(),
          paymentMethod: _paymentMethod,
          payments: payments,
          totalAmount: bookedTotal,
          paymentDetail: _paymentMethodSummary(savedPaymentMethod),
          partialFailureMessage: failureMessage == null
              ? null
              : 'Some services were booked before checkout stopped. The '
                  'remaining items stayed in your cart.',
        );
      });

      if (failureMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Some items were booked successfully. Remaining items are still in your cart.',
            ),
          ),
        );
      }
    } catch (error) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Checkout failed: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _submittingCheckout = false);
      }
    }
  }

  Future<_PaymentSummary?> _loadPaymentSummary(
    int bookingId, {
    String? paymentMethod,
    bool attemptAuthorize = false,
  }) async {
    final payments = ref.read(paymentRepositoryProvider);
    final effectivePaymentMethod = paymentMethod ?? _paymentMethod;
    try {
      if (effectivePaymentMethod != 'cash' && attemptAuthorize) {
        final status = await payments.authorizePayment(bookingId);
        return _PaymentSummary.fromStatus(status);
      }
    } catch (_) {}

    try {
      final status = await payments.getPaymentStatus(bookingId);
      return _PaymentSummary.fromStatus(status);
    } catch (_) {}

    return null;
  }

  void _removeBookedItemsFromCart(
    CartState cart,
    Map<int, int> successCounts,
  ) {
    final notifier = ref.read(cartProvider.notifier);
    for (final item in cart.items) {
      final bookedCount = successCounts[item.service.id] ?? 0;
      if (bookedCount <= 0) {
        continue;
      }

      final remaining = item.quantity - bookedCount;
      if (remaining <= 0) {
        notifier.removeItem(item.service.id);
      } else {
        notifier.updateQuantity(item.service.id, remaining);
      }
    }
  }

  Future<void> _refreshConfirmationPayments(
    _CheckoutConfirmation confirmation, {
    bool attemptAuthorize = false,
    int? targetBookingId,
  }) async {
    if (targetBookingId != null &&
        (_refreshingPayments ||
            _paymentActionBookingIds.contains(targetBookingId))) {
      return;
    }
    if (_refreshingPayments && targetBookingId == null) {
      return;
    }

    final bookingIds = targetBookingId == null
        ? confirmation.bookingIds
        : confirmation.bookingIds
            .where((bookingId) => bookingId == targetBookingId)
            .toList();
    if (bookingIds.isEmpty) {
      return;
    }

    setState(() {
      if (targetBookingId == null) {
        _refreshingPayments = true;
      } else {
        _paymentActionBookingIds.add(targetBookingId);
      }
    });

    try {
      final refreshed = <_PaymentSummary>[];
      for (final bookingId in bookingIds) {
        final payment = await _loadPaymentSummary(
          bookingId,
          paymentMethod: confirmation.paymentMethod,
          attemptAuthorize: confirmation.paymentMethod != 'cash' &&
              (attemptAuthorize || targetBookingId != null),
        );
        if (payment != null) {
          refreshed.add(payment);
        }
      }

      if (!mounted) {
        return;
      }

      final paymentsByBookingId = {
        for (final payment in confirmation.payments) payment.bookingId: payment,
      };
      for (final payment in refreshed) {
        paymentsByBookingId[payment.bookingId] = payment;
      }

      setState(() {
        _confirmation = _CheckoutConfirmation(
          bookingIds: confirmation.bookingIds,
          serviceNames: confirmation.serviceNames,
          providerNames: confirmation.providerNames,
          scheduledAt: confirmation.scheduledAt,
          durationMinutes: confirmation.durationMinutes,
          address: confirmation.address,
          paymentMethod: confirmation.paymentMethod,
          payments: confirmation.bookingIds
              .map((bookingId) => paymentsByBookingId[bookingId])
              .whereType<_PaymentSummary>()
              .toList(),
          totalAmount: confirmation.totalAmount,
          paymentDetail: confirmation.paymentDetail,
          partialFailureMessage: confirmation.partialFailureMessage,
        );
      });
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not refresh payment status: $error')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          if (targetBookingId == null) {
            _refreshingPayments = false;
          } else {
            _paymentActionBookingIds.remove(targetBookingId);
          }
        });
      }
    }
  }

  Future<void> _addToGoogleCalendar(_CheckoutConfirmation confirmation) async {
    final start = confirmation.scheduledAt.toUtc();
    final end = start.add(Duration(minutes: confirmation.durationMinutes));
    final uri = Uri.https(
      'calendar.google.com',
      '/calendar/render',
      {
        'action': 'TEMPLATE',
        'text': _calendarTitle(confirmation),
        'details': _calendarDetails(confirmation),
        'location': confirmation.address,
        'dates': '${_googleCalendarStamp(start)}/${_googleCalendarStamp(end)}',
      },
    );

    await _launchExternalUri(uri);
  }

  Future<void> _addToAppleCalendar(_CheckoutConfirmation confirmation) async {
    final start = confirmation.scheduledAt.toUtc();
    final end = start.add(Duration(minutes: confirmation.durationMinutes));
    final ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Serveify//Checkout//EN',
      'BEGIN:VEVENT',
      'UID:serveify-${confirmation.bookingIds.join('-')}@serveify.app',
      'DTSTAMP:${_googleCalendarStamp(DateTime.now().toUtc())}',
      'DTSTART:${_googleCalendarStamp(start)}',
      'DTEND:${_googleCalendarStamp(end)}',
      'SUMMARY:${_escapeCalendarText(_calendarTitle(confirmation))}',
      'DESCRIPTION:${_escapeCalendarText(_calendarDetails(confirmation))}',
      'LOCATION:${_escapeCalendarText(confirmation.address)}',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    final uri = Uri.dataFromString(
      ics,
      mimeType: 'text/calendar',
      encoding: utf8,
    );

    await _launchExternalUri(uri);
  }

  Future<void> _launchExternalUri(Uri uri) async {
    final launched = await launchUrl(
      uri,
      mode: LaunchMode.externalApplication,
    );

    if (!launched && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('We could not open the calendar action.'),
        ),
      );
    }
  }

  String _calendarTitle(_CheckoutConfirmation confirmation) {
    final uniqueNames = confirmation.serviceNames.toSet().toList();
    if (uniqueNames.length == 1) {
      return '${uniqueNames.first} with Serveify';
    }
    return 'Serveify service booking';
  }

  String _calendarDetails(_CheckoutConfirmation confirmation) {
    final providers = confirmation.providerNames.join(', ');
    final bookings = confirmation.bookingIds.map((id) => '#$id').join(', ');
    return [
      'Services: ${confirmation.serviceNames.toSet().join(', ')}',
      if (providers.isNotEmpty) 'Providers: $providers',
      'Bookings: $bookings',
      'Payment: ${confirmation.paymentDetail ?? _paymentMethodLabel(confirmation.paymentMethod)}',
      if (_notesController.text.trim().isNotEmpty)
        'Notes: ${_notesController.text.trim()}',
    ].join('\n');
  }

  String _escapeCalendarText(String value) {
    return value
        .replaceAll('\\', r'\\')
        .replaceAll(',', r'\,')
        .replaceAll(';', r'\;')
        .replaceAll('\n', r'\n');
  }

  String _googleCalendarStamp(DateTime value) {
    String twoDigits(int number) => number.toString().padLeft(2, '0');
    return '${value.year}'
        '${twoDigits(value.month)}'
        '${twoDigits(value.day)}'
        'T'
        '${twoDigits(value.hour)}'
        '${twoDigits(value.minute)}'
        '${twoDigits(value.second)}'
        'Z';
  }

  String _formatOffsetDateTime(DateTime value) {
    String twoDigits(int number) => number.toString().padLeft(2, '0');
    final offset = value.timeZoneOffset;
    final sign = offset.isNegative ? '-' : '+';
    final totalMinutes = offset.inMinutes.abs();
    final hours = (totalMinutes ~/ 60).toString().padLeft(2, '0');
    final minutes = (totalMinutes % 60).toString().padLeft(2, '0');

    return '${value.year}-${twoDigits(value.month)}-${twoDigits(value.day)}'
        'T'
        '${twoDigits(value.hour)}:${twoDigits(value.minute)}:00'
        '$sign$hours:$minutes';
  }

  String _composeBookingNotes(
    CartItem item, {
    SavedPaymentMethodModel? savedPaymentMethod,
  }) {
    final parts = <String>[];
    final checkoutNotes = _notesController.text.trim();
    final itemNotes = item.notes?.trim() ?? '';

    if (checkoutNotes.isNotEmpty) {
      parts.add(checkoutNotes);
    }
    if (itemNotes.isNotEmpty) {
      parts.add('Service note: $itemNotes');
    }
    parts.add('Payment preference: ${_paymentMethodLabel(_paymentMethod)}');
    if (_paymentMethod == 'card' && savedPaymentMethod != null) {
      parts.add(
        'Saved payment method: ${savedPaymentMethod.brand} ending in ${savedPaymentMethod.last4}',
      );
    }

    return parts.join('\n\n');
  }

  ServiceItem _serviceItemFromOffering(ServiceOfferingModel offering) {
    return ServiceItem(
      id: offering.id,
      name: offering.serviceName,
      categoryId: offering.categoryKey,
      providerId: offering.providerId,
      providerName: offering.providerName,
      imageUrl: '',
      description: '${offering.category} service by ${offering.providerName}',
      priceRange: offering.priceLabel,
      priceValue: offering.price,
      duration: offering.durationLabel,
      estimatedDurationMinutes: offering.estimatedDurationMinutes,
      pricingType: offering.pricingType,
      rating: 0,
    );
  }

  List<ServiceOfferingModel> _providerOptionsForItem(
    CartItem item,
    List<ServiceOfferingModel> catalog,
  ) {
    final matches = catalog
        .where(
          (offering) =>
              offering.serviceName.toLowerCase() ==
                  item.service.name.toLowerCase() &&
              offering.categoryKey == item.service.categoryId,
        )
        .toList();

    if (matches.isNotEmpty) {
      return matches;
    }

    return [
      ServiceOfferingModel(
        id: item.service.id,
        providerId: item.service.providerId ?? 0,
        providerName: item.service.providerName ?? 'Provider',
        category: _categoryLabel(item.service.categoryId),
        serviceName: item.service.name,
        pricingType: item.service.pricingType ?? 'FIXED',
        price: item.service.priceValue,
        estimatedDurationMinutes: item.service.estimatedDurationMinutes ?? 60,
      ),
    ];
  }

  SavedPaymentMethodModel? _effectiveSavedPaymentMethod(
    List<SavedPaymentMethodModel> methods,
  ) {
    if (methods.isEmpty) {
      return null;
    }

    if (_selectedSavedPaymentMethodId != null) {
      for (final method in methods) {
        if (method.id == _selectedSavedPaymentMethodId) {
          return method;
        }
      }
    }

    for (final method in methods) {
      if (method.defaultMethod) {
        return method;
      }
    }

    return methods.first;
  }

  String _paymentMethodSummary(
    SavedPaymentMethodModel? savedMethod,
  ) {
    if (_paymentMethod != 'card' || savedMethod == null) {
      return _paymentMethodLabel(_paymentMethod);
    }

    return '${savedMethod.brand} ending in ${savedMethod.last4}';
  }

  Future<void> _openSavedPaymentMethodsSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _SavedPaymentMethodsSheet(
        selectedMethodId: _selectedSavedPaymentMethodId,
        onSelected: (paymentMethodId) {
          if (!mounted) {
            return;
          }
          setState(() => _selectedSavedPaymentMethodId = paymentMethodId);
        },
      ),
    );
  }

  String _paymentMethodLabel(String value) {
    return _paymentOptions
        .firstWhere(
          (option) => option.value == value,
          orElse: () => _paymentOptions.first,
        )
        .label;
  }

  String _money(double value) {
    final isWhole = value.truncateToDouble() == value;
    return isWhole
        ? 'R${value.toStringAsFixed(0)}'
        : 'R${value.toStringAsFixed(2)}';
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final catalogAsync = ref.watch(serviceCatalogProvider);

    if (_confirmation != null) {
      return _buildConfirmationScreen(_confirmation!);
    }

    if (_seedingService && cart.items.isEmpty) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (cart.items.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                IconButton(
                  onPressed: () => context.pop(),
                  icon: const Icon(Icons.arrow_back_rounded),
                ),
                const Spacer(),
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: const Icon(
                    Icons.shopping_bag_outlined,
                    color: Colors.white,
                    size: 34,
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Your checkout is empty',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Add services first, then come back to choose a provider, '
                  'schedule the visit, and confirm payment.',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.64),
                    fontSize: 15,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 28),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => context.go('/services'),
                    child: const Text('Browse services'),
                  ),
                ),
                const Spacer(),
              ],
            ),
          ),
        ),
      );
    }

    final currentStep = _checkoutSteps[_step];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              child: Row(
                children: [
                  IconButton(
                    onPressed: _goToPreviousStep,
                    icon: const Icon(Icons.arrow_back_rounded),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Checkout',
                          style:
                              Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.w800,
                                  ),
                        ),
                        Text(
                          '${cart.itemCount} item${cart.itemCount == 1 ? '' : 's'}'
                          ' · ${cart.cartTotal}',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.48),
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    'Step ${_step + 1}/${_checkoutSteps.length}',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.45),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
              child: Row(
                children: List<Widget>.generate(
                  _checkoutSteps.length,
                  (index) => Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(
                        right: index == _checkoutSteps.length - 1 ? 0 : 8,
                      ),
                      child: _StepIndicator(
                        label: _checkoutSteps[index].title,
                        active: index == _step,
                        complete: index < _step,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 18, 24, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    currentStep.title,
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    currentStep.description,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white.withValues(alpha: 0.6),
                      height: 1.45,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 260),
                transitionBuilder: (child, animation) {
                  final slide = Tween<Offset>(
                    begin: const Offset(0.06, 0),
                    end: Offset.zero,
                  ).animate(animation);
                  return FadeTransition(
                    opacity: animation,
                    child: SlideTransition(position: slide, child: child),
                  );
                },
                child: KeyedSubtree(
                  key: ValueKey(_step),
                  child: switch (_step) {
                    0 => _buildServicesStep(cart, catalogAsync),
                    1 => _buildProviderStep(cart, catalogAsync),
                    2 => _buildScheduleStep(cart),
                    _ => _buildReviewStep(cart),
                  },
                ),
              ),
            ),
            _buildBottomBar(cart),
          ],
        ),
      ),
    );
  }

  Widget _buildServicesStep(
    CartState cart,
    AsyncValue<List<ServiceOfferingModel>> catalogAsync,
  ) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 140),
      children: [
        _GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.receipt_long_rounded,
                    color: AppColors.accent,
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  const Text(
                    'Selected services',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    cart.cartTotal,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      color: AppColors.accent,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ...cart.items.map(
                (item) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _CartLineCard(
                    item: item,
                    onDecrease: () => ref
                        .read(cartProvider.notifier)
                        .updateQuantity(item.service.id, item.quantity - 1),
                    onIncrease: () => ref
                        .read(cartProvider.notifier)
                        .updateQuantity(item.service.id, item.quantity + 1),
                    onRemove: () => ref
                        .read(cartProvider.notifier)
                        .removeItem(item.service.id),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Add more services',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Browse the catalog and keep building this order without leaving checkout.',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.55),
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 16),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.04),
                  borderRadius: BorderRadius.circular(18),
                  border:
                      Border.all(color: Colors.white.withValues(alpha: 0.08)),
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: (value) =>
                      setState(() => _catalogQuery = value.trim()),
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'Search services or providers',
                    border: InputBorder.none,
                    prefixIcon: Icon(
                      Icons.search_rounded,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
                    suffixIcon: _catalogQuery.isEmpty
                        ? null
                        : IconButton(
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _catalogQuery = '');
                            },
                            icon: Icon(
                              Icons.close_rounded,
                              color: Colors.white.withValues(alpha: 0.45),
                            ),
                          ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              catalogAsync.when(
                data: (services) {
                  final visibleServices = services.where((service) {
                    final query = _catalogQuery.toLowerCase();
                    if (query.isEmpty) {
                      return true;
                    }
                    final haystack =
                        '${service.serviceName} ${service.category} ${service.providerName}'
                            .toLowerCase();
                    return haystack.contains(query);
                  }).toList()
                    ..sort((left, right) {
                      final byName =
                          left.serviceName.compareTo(right.serviceName);
                      if (byName != 0) {
                        return byName;
                      }
                      return left.providerName.compareTo(right.providerName);
                    });

                  if (visibleServices.isEmpty) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Text(
                        'No services match your search yet.',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.5),
                        ),
                      ),
                    );
                  }

                  return Column(
                    children: visibleServices.take(16).map((service) {
                      final inCart = cart.containsService(service.id);
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _CatalogServiceCard(
                          service: service,
                          inCart: inCart,
                          onTap: () => context.push('/services/${service.id}'),
                          onAdd: () {
                            ref
                                .read(cartProvider.notifier)
                                .addItem(_serviceItemFromOffering(service));
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  '${service.serviceName} added to checkout',
                                ),
                              ),
                            );
                          },
                        ),
                      );
                    }).toList(),
                  );
                },
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(vertical: 18),
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (error, _) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Text(
                    'Unable to load more services right now.\n$error',
                    style: const TextStyle(color: Colors.white70),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildProviderStep(
    CartState cart,
    AsyncValue<List<ServiceOfferingModel>> catalogAsync,
  ) {
    final catalog = catalogAsync.valueOrNull ?? const <ServiceOfferingModel>[];

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 140),
      children: [
        _GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Choose the provider for each service',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'If there is only one verified provider for a service, it stays locked in.',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.56),
                  height: 1.45,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (catalogAsync.isLoading)
          const Padding(
            padding: EdgeInsets.only(top: 8),
            child: Center(child: CircularProgressIndicator()),
          )
        else
          ...cart.items.map((item) {
            final options = _providerOptionsForItem(item, catalog);
            final hasChoice = options.length > 1;
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.service.name,
                                style: const TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${item.quantity} x ${item.service.priceRange}',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.48),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: hasChoice
                                ? AppColors.accent.withValues(alpha: 0.12)
                                : Colors.white.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            hasChoice ? 'Choose provider' : 'Fixed provider',
                            style: TextStyle(
                              color: hasChoice
                                  ? AppColors.accent
                                  : Colors.white.withValues(alpha: 0.58),
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    ...options.map((option) {
                      final selected = option.id == item.service.id;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _ProviderChoiceCard(
                          offering: option,
                          selected: selected,
                          locked: !hasChoice,
                          onTap: hasChoice
                              ? () {
                                  ref.read(cartProvider.notifier).replaceItem(
                                        item.service.id,
                                        _serviceItemFromOffering(option),
                                      );
                                  unawaited(
                                    _refreshScheduleAvailability(
                                      ref.read(cartProvider),
                                      force: true,
                                    ),
                                  );
                                }
                              : null,
                        ),
                      );
                    }),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }

  Widget _buildScheduleStep(CartState cart) {
    final requirements = _providerRequirements(cart);
    final availableDays = _availableSchedule.where((day) => day.slots.isNotEmpty).toList();
    final selectedSlots = _slotsForSelectedDate();
    final selectedDay = _dayForDate(_selectedDate);

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 140),
      children: [
        _GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Provider coverage',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'We are finding times that work for every selected provider in this checkout.',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.56),
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: requirements
                    .map(
                      (requirement) => _PillButton(
                        label:
                            '${requirement.providerName} · ${requirement.durationMinutes} min',
                        active: true,
                        onTap: null,
                      ),
                    )
                    .toList(),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Choose a day',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Available slots are based on provider working hours and existing bookings.',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.56),
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 14),
              if (_loadingAvailability)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_availabilityError != null)
                _InlineStateCard(
                  icon: Icons.schedule_send_outlined,
                  title: 'Availability unavailable',
                  message: _availabilityError!,
                  actionLabel: 'Refresh',
                  onTap: () => _refreshScheduleAvailability(cart, force: true),
                )
              else ...[
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: availableDays.map((day) {
                    final active = _selectedDate != null &&
                        DateUtils.isSameDay(_selectedDate, day.date);
                    return _AvailabilityDayChip(
                      day: day,
                      active: active,
                      onTap: () {
                        setState(() {
                          _selectedDate = day.date;
                          _selectedTime = null;
                        });
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 14),
                OutlinedButton.icon(
                  onPressed: availableDays.isEmpty ? null : _pickDate,
                  icon: const Icon(Icons.calendar_today_outlined, size: 18),
                  label: Text(
                    _selectedDate == null
                        ? 'Pick a date'
                        : 'Change day (${DateFormat('EEE, d MMM').format(_selectedDate!)})',
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),
        _GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Choose a time',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              if (_selectedDate == null)
                Text(
                  'Choose a day first to see the shared time slots.',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.48),
                  ),
                )
              else if (selectedSlots.isEmpty)
                Text(
                  'No shared slots are available on this day. Pick another date.',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.48),
                  ),
                )
              else ...[
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: selectedSlots.map((slot) {
                    final active = _selectedTime == slot.label;
                    return _PillButton(
                      label: slot.label,
                      active: active,
                      onTap: () => setState(() => _selectedTime = slot.label),
                    );
                  }).toList(),
                ),
                if (selectedDay != null &&
                    selectedDay.startTime != null &&
                    selectedDay.endTime != null) ...[
                  const SizedBox(height: 14),
                  Text(
                    'Shared window: ${selectedDay.startTime} - ${selectedDay.endTime}',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.48),
                      fontSize: 13,
                    ),
                  ),
                ],
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),
        _GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Booking preview',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              _SummaryRow(
                label: 'Services',
                value:
                    '${cart.itemCount} item${cart.itemCount == 1 ? '' : 's'}',
              ),
              _SummaryRow(
                label: 'Scheduled day',
                value: _selectedDate == null
                    ? 'Choose a day'
                    : DateFormat('EEEE, d MMMM').format(_selectedDate!),
              ),
              _SummaryRow(
                label: 'Time slot',
                value: _selectedTime ?? 'Choose a time',
              ),
              _SummaryRow(label: 'Estimated total', value: cart.cartTotal),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildReviewStep(CartState cart) {
    final scheduledAt = _scheduledAt;
    final savedPaymentMethods = ref.watch(savedPaymentMethodsProvider);
    final effectiveSavedMethod = _effectiveSavedPaymentMethod(
      savedPaymentMethods.valueOrNull ?? const <SavedPaymentMethodModel>[],
    );

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 140),
      children: [
        _GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Final details',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              _CheckoutField(
                controller: _nameController,
                label: 'Full name',
                icon: Icons.person_outline_rounded,
                keyboardType: TextInputType.name,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 12),
              _CheckoutField(
                controller: _emailController,
                label: 'Email address',
                icon: Icons.email_outlined,
                keyboardType: TextInputType.emailAddress,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 12),
              _CheckoutField(
                controller: _phoneController,
                label: 'Phone number',
                icon: Icons.phone_outlined,
                keyboardType: TextInputType.phone,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 12),
              _CheckoutField(
                controller: _addressController,
                label: 'Service address',
                icon: Icons.location_on_outlined,
                keyboardType: TextInputType.streetAddress,
                onChanged: (value) {
                  setState(() {});
                  _searchAddress(value);
                },
              ),
              if (_searchingAddress)
                const Padding(
                  padding: EdgeInsets.only(top: 10),
                  child: LinearProgressIndicator(minHeight: 2),
                ),
              if (_suggestions.isNotEmpty) ...[
                const SizedBox(height: 10),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.04),
                    borderRadius: BorderRadius.circular(18),
                    border:
                        Border.all(color: Colors.white.withValues(alpha: 0.08)),
                  ),
                  child: Column(
                    children: _suggestions.map((suggestion) {
                      return ListTile(
                        onTap: () {
                          setState(() {
                            _addressController.text = suggestion.displayName;
                            _suggestions = const [];
                          });
                        },
                        leading: const Icon(
                          Icons.place_outlined,
                          color: AppColors.accent,
                        ),
                        title: Text(
                          suggestion.displayName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                          ),
                        ),
                        subtitle: Text(
                          '${suggestion.lat.toStringAsFixed(4)}, ${suggestion.lon.toStringAsFixed(4)}',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.45),
                            fontSize: 12,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
              const SizedBox(height: 12),
              _CheckoutField(
                controller: _notesController,
                label: 'Notes for the provider',
                icon: Icons.note_alt_outlined,
                keyboardType: TextInputType.multiline,
                maxLines: 4,
                onChanged: (_) => setState(() {}),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Review booking',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              ...cart.items.map(
                (item) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _ReviewLineItem(item: item),
                ),
              ),
              const SizedBox(height: 10),
              const Divider(color: AppColors.divider),
              const SizedBox(height: 10),
              _SummaryRow(
                label: 'Scheduled for',
                value: scheduledAt == null
                    ? 'Not selected'
                    : DateFormat('EEE d MMM, HH:mm').format(scheduledAt),
              ),
              _SummaryRow(
                label: 'Address',
                value: _addressController.text.trim().isEmpty
                    ? 'Add address'
                    : _addressController.text.trim(),
              ),
              _SummaryRow(
                label: 'Contact',
                value: _nameController.text.trim().isEmpty
                    ? 'Add your details'
                    : _nameController.text.trim(),
              ),
              _SummaryRow(
                label: 'Payment method',
                value: _paymentMethodSummary(effectiveSavedMethod),
              ),
              _SummaryRow(label: 'Total', value: cart.cartTotal),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Payment',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Card and EFT bookings are authorized after checkout so the order can move immediately.',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.55),
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 16),
              ..._paymentOptions.map(
                (option) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _PaymentMethodCard(
                    option: option,
                    selected: _paymentMethod == option.value,
                    onTap: () => setState(() => _paymentMethod = option.value),
                  ),
                ),
              ),
              if (_paymentMethod == 'card') ...[
                const SizedBox(height: 6),
                savedPaymentMethods.when(
                  data: (methods) {
                    final selectedMethod = _effectiveSavedPaymentMethod(methods);
                    if (selectedMethod == null) {
                      return _InlineStateCard(
                        icon: Icons.credit_card_off_outlined,
                        title: 'No saved cards yet',
                        message:
                            'Add a saved card so checkout can authorize the booking right away.',
                        actionLabel: 'Add card',
                        onTap: _openSavedPaymentMethodsSheet,
                      );
                    }

                    return _SavedPaymentMethodPreviewCard(
                      method: selectedMethod,
                      onManage: _openSavedPaymentMethodsSheet,
                    );
                  },
                  loading: () => Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.03),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.06),
                      ),
                    ),
                    child: const Row(
                      children: [
                        SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 12),
                        Text(
                          'Loading saved cards...',
                          style: TextStyle(color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                  error: (_, __) => _InlineStateCard(
                    icon: Icons.credit_card_off_outlined,
                    title: 'Could not load cards',
                    message:
                        'You can retry loading your saved payment methods or continue with EFT or cash.',
                    actionLabel: 'Retry',
                    onTap: () => ref.invalidate(savedPaymentMethodsProvider),
                  ),
                ),
              ],
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.accent.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: AppColors.accent.withValues(alpha: 0.18),
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.shield_outlined,
                      color: AppColors.accent,
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _paymentMethod == 'cash'
                            ? 'Cash bookings are created immediately and payment stays pending until service day.'
                            : _paymentMethod == 'card'
                                ? 'Your selected saved card will be used for booking authorization right after checkout.'
                            : 'Digital payment bookings are authorized right after the booking is created.',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.72),
                          height: 1.45,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBottomBar(CartState cart) {
    final isLastStep = _step == _checkoutSteps.length - 1;
    final enabled = !_submittingCheckout && _canContinue(cart);

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
      decoration: BoxDecoration(
        color: AppColors.surface.withValues(alpha: 0.96),
        border: Border(
          top: BorderSide(color: Colors.white.withValues(alpha: 0.06)),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            if (_step > 0)
              Expanded(
                child: OutlinedButton(
                  onPressed: _submittingCheckout ? null : _goToPreviousStep,
                  child: const Text('Back'),
                ),
              ),
            if (_step > 0) const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: enabled
                    ? () {
                        if (isLastStep) {
                          _submitCheckout(cart);
                        } else {
                          _goToNextStep(cart);
                        }
                      }
                    : null,
                child: _submittingCheckout
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(
                        isLastStep
                            ? 'Pay and confirm ${cart.cartTotal}'
                            : 'Continue',
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConfirmationScreen(_CheckoutConfirmation confirmation) {
    final paymentCount = confirmation.payments.length;
    final paymentActionBusy = _paymentActionBookingIds.isNotEmpty;
    final authorizedCount = confirmation.payments
        .where((payment) => payment.isAuthorizedLike)
        .length;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF10B981).withValues(alpha: 0.16),
              ),
              child: const Icon(
                Icons.check_circle_rounded,
                size: 48,
                color: Color(0xFF10B981),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Booking confirmed',
              style: TextStyle(
                fontSize: 30,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              confirmation.partialFailureMessage ??
                  'Your booking was created successfully and is ready for follow-up.',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.62),
                fontSize: 15,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 24),
            _GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _SummaryRow(
                    label: 'Booking ids',
                    value:
                        confirmation.bookingIds.map((id) => '#$id').join(', '),
                  ),
                  _SummaryRow(
                    label: 'Services',
                    value: confirmation.serviceNames.toSet().join(', '),
                  ),
                  _SummaryRow(
                    label: 'Providers',
                    value: confirmation.providerNames.join(', '),
                  ),
                  _SummaryRow(
                    label: 'Scheduled for',
                    value: DateFormat('EEE d MMM, HH:mm')
                        .format(confirmation.scheduledAt),
                  ),
                  _SummaryRow(label: 'Address', value: confirmation.address),
                  _SummaryRow(
                    label: 'Paid via',
                    value: confirmation.paymentDetail ??
                        _paymentMethodLabel(confirmation.paymentMethod),
                  ),
                  _SummaryRow(
                    label: 'Order total',
                    value: _money(confirmation.totalAmount),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Text(
                        'Payment status',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  if (paymentCount > 0) ...[
                    const SizedBox(height: 6),
                    Text(
                      '$authorizedCount/$paymentCount authorized',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.55),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                  if (confirmation.bookingIds.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton.icon(
                        onPressed: _refreshingPayments || paymentActionBusy
                            ? null
                            : () => _refreshConfirmationPayments(confirmation),
                        icon: _refreshingPayments || paymentActionBusy
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Icon(Icons.refresh_rounded, size: 18),
                        label: Text(
                          _refreshingPayments
                              ? 'Refreshing'
                              : paymentActionBusy
                                  ? 'Updating'
                                  : 'Refresh',
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  if (confirmation.payments.isEmpty)
                    Text(
                      confirmation.paymentMethod == 'cash'
                          ? 'Cash bookings stay pending until service day. You can refresh later if the backend posts an update.'
                          : 'Payment details will appear here once the backend returns them.',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.55),
                      ),
                    )
                  else
                    ...confirmation.payments.map(
                      (payment) {
                        final retryable = confirmation.paymentMethod != 'cash' &&
                            payment.isRetryable;
                        final busy = _refreshingPayments ||
                            _paymentActionBookingIds.contains(payment.bookingId);
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _PaymentSummaryCard(
                            payment: payment,
                            busy: busy,
                            onRetry: retryable && !busy
                                ? () => _refreshConfirmationPayments(
                                      confirmation,
                                      attemptAuthorize: true,
                                      targetBookingId: payment.bookingId,
                                    )
                                : null,
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Add to calendar',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Save the appointment to Google Calendar or import it into Apple Calendar.',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.55),
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => _addToGoogleCalendar(confirmation),
                      icon: const Icon(Icons.calendar_month_outlined),
                      label: const Text('Add to Google Calendar'),
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => _addToAppleCalendar(confirmation),
                      icon: const Icon(Icons.event_available_outlined),
                      label: const Text('Add to Apple Calendar'),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => context.go('/bookings'),
                child: const Text('View my bookings'),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => context.go('/services'),
                child: const Text('Book another service'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StepIndicator extends StatelessWidget {
  final String label;
  final bool active;
  final bool complete;

  const _StepIndicator({
    required this.label,
    required this.active,
    required this.complete,
  });

  @override
  Widget build(BuildContext context) {
    final background = complete
        ? const Color(0xFF10B981)
        : active
            ? Colors.white
            : Colors.white.withValues(alpha: 0.06);
    final foreground = complete || active
        ? AppColors.background
        : Colors.white.withValues(alpha: 0.55);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Text(
        label,
        textAlign: TextAlign.center,
        style: TextStyle(
          color: foreground,
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
      ),
    );
  }
}

class _GlassCard extends StatelessWidget {
  final Widget child;

  const _GlassCard({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: child,
    );
  }
}

class _CartLineCard extends StatelessWidget {
  final CartItem item;
  final VoidCallback onDecrease;
  final VoidCallback onIncrease;
  final VoidCallback onRemove;

  const _CartLineCard({
    required this.item,
    required this.onDecrease,
    required this.onIncrease,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final subtotal = item.service.priceValue * item.quantity;
    final wholeSubtotal = subtotal.truncateToDouble() == subtotal;
    final subtotalLabel = wholeSubtotal
        ? 'R${subtotal.toStringAsFixed(0)}'
        : 'R${subtotal.toStringAsFixed(2)}';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.service.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.service.providerName ??
                          _categoryLabel(item.service.categoryId),
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.56),
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${item.service.priceRange} each',
                      style: const TextStyle(
                        color: AppColors.accent,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: onRemove,
                icon: Icon(
                  Icons.delete_outline_rounded,
                  color: Colors.white.withValues(alpha: 0.45),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _QuantityButton(icon: Icons.remove, onTap: onDecrease),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: Text(
                  '${item.quantity}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              _QuantityButton(icon: Icons.add, onTap: onIncrease),
              const Spacer(),
              Text(
                subtotalLabel,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuantityButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _QuantityButton({
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Ink(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, size: 18, color: Colors.white),
      ),
    );
  }
}

class _CatalogServiceCard extends StatelessWidget {
  final ServiceOfferingModel service;
  final bool inCart;
  final VoidCallback onTap;
  final VoidCallback onAdd;

  const _CatalogServiceCard({
    required this.service,
    required this.inCart,
    required this.onTap,
    required this.onAdd,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Ink(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                color: AppColors.accent.withValues(alpha: 0.12),
              ),
              child: const Icon(
                Icons.miscellaneous_services_outlined,
                color: AppColors.accent,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    service.serviceName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${service.providerName} · ${service.category}',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.5),
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${service.priceLabel} · ${service.durationLabel}',
                    style: const TextStyle(
                      color: AppColors.accent,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            FilledButton.tonal(
              onPressed: onAdd,
              style: FilledButton.styleFrom(
                backgroundColor: inCart
                    ? Colors.white.withValues(alpha: 0.12)
                    : AppColors.accent.withValues(alpha: 0.18),
                foregroundColor: Colors.white,
              ),
              child: Text(inCart ? 'Add again' : 'Add'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProviderChoiceCard extends StatelessWidget {
  final ServiceOfferingModel offering;
  final bool selected;
  final bool locked;
  final VoidCallback? onTap;

  const _ProviderChoiceCard({
    required this.offering,
    required this.selected,
    required this.locked,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Ink(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.accent.withValues(alpha: 0.12)
              : Colors.white.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: selected
                ? AppColors.accent.withValues(alpha: 0.4)
                : Colors.white.withValues(alpha: 0.06),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              selected
                  ? Icons.radio_button_checked_rounded
                  : Icons.radio_button_off_rounded,
              color: selected
                  ? AppColors.accent
                  : Colors.white.withValues(alpha: 0.35),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          offering.providerName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      if (locked)
                        Text(
                          'Only option',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.45),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${offering.priceLabel} · ${offering.durationLabel} · ${offering.pricingType}',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.58),
                      fontSize: 13,
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

class _PillButton extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback? onTap;

  const _PillButton({
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Ink(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: active ? Colors.white : Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: active ? AppColors.background : Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

class _CheckoutField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final IconData icon;
  final TextInputType keyboardType;
  final int maxLines;
  final ValueChanged<String>? onChanged;

  const _CheckoutField({
    required this.controller,
    required this.label,
    required this.icon,
    required this.keyboardType,
    this.maxLines = 1,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        maxLines: maxLines,
        onChanged: onChanged,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          border: InputBorder.none,
          hintText: label,
          prefixIcon: Icon(icon, color: Colors.white.withValues(alpha: 0.45)),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 16,
          ),
          hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.35)),
        ),
      ),
    );
  }
}

class _AvailabilityDayChip extends StatelessWidget {
  final _BookableDay day;
  final bool active;
  final VoidCallback onTap;

  const _AvailabilityDayChip({
    required this.day,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final difference = day.date.difference(today).inDays;
    final label = switch (difference) {
      0 => 'Today',
      1 => 'Tomorrow',
      _ => DateFormat('EEE d MMM').format(day.date),
    };

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Ink(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: active ? Colors.white : Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: active
                ? Colors.white.withValues(alpha: 0.16)
                : Colors.white.withValues(alpha: 0.08),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                color: active ? AppColors.background : Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${day.slots.length} slot${day.slots.length == 1 ? '' : 's'}',
              style: TextStyle(
                color: active
                    ? AppColors.background.withValues(alpha: 0.72)
                    : Colors.white.withValues(alpha: 0.52),
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InlineStateCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onTap;

  const _InlineStateCard({
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.accent),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            message,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.6),
              height: 1.45,
            ),
          ),
          if (actionLabel != null && onTap != null) ...[
            const SizedBox(height: 14),
            OutlinedButton(
              onPressed: onTap,
              child: Text(actionLabel!),
            ),
          ],
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;

  const _SummaryRow({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.45),
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ReviewLineItem extends StatelessWidget {
  final CartItem item;

  const _ReviewLineItem({required this.item});

  @override
  Widget build(BuildContext context) {
    final subtotal = item.service.priceValue * item.quantity;
    final wholeSubtotal = subtotal.truncateToDouble() == subtotal;
    final subtotalLabel = wholeSubtotal
        ? 'R${subtotal.toStringAsFixed(0)}'
        : 'R${subtotal.toStringAsFixed(2)}';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.service.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${item.quantity} x ${item.service.priceRange}'
                  ' · ${item.service.providerName ?? 'Provider'}',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.52),
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Text(
            subtotalLabel,
            style: const TextStyle(
              color: AppColors.accent,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _PaymentMethodCard extends StatelessWidget {
  final _PaymentMethodOption option;
  final bool selected;
  final VoidCallback onTap;

  const _PaymentMethodCard({
    required this.option,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Ink(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.accent.withValues(alpha: 0.12)
              : Colors.white.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: selected
                ? AppColors.accent.withValues(alpha: 0.38)
                : Colors.white.withValues(alpha: 0.06),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                color: Colors.white.withValues(alpha: 0.06),
              ),
              child: Icon(option.icon, color: Colors.white),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    option.label,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    option.subtitle,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.52),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              selected
                  ? Icons.radio_button_checked_rounded
                  : Icons.radio_button_off_rounded,
              color: selected
                  ? AppColors.accent
                  : Colors.white.withValues(alpha: 0.35),
            ),
          ],
        ),
      ),
    );
  }
}

class _SavedPaymentMethodPreviewCard extends StatelessWidget {
  final SavedPaymentMethodModel method;
  final VoidCallback onManage;

  const _SavedPaymentMethodPreviewCard({
    required this.method,
    required this.onManage,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.credit_card_rounded,
                  color: AppColors.accent,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      method.maskedLabel,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (method.holderName.trim().isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        method.holderName,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.55),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              OutlinedButton(
                onPressed: onManage,
                child: const Text('Manage'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _PaymentMethodMetaChip(label: 'Expires ${method.expiry}'),
              if (method.defaultMethod)
                const _PaymentMethodMetaChip(
                  label: 'Default card',
                  highlight: true,
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SavedPaymentMethodsSheet extends ConsumerStatefulWidget {
  final int? selectedMethodId;
  final ValueChanged<int?> onSelected;

  const _SavedPaymentMethodsSheet({
    required this.selectedMethodId,
    required this.onSelected,
  });

  @override
  ConsumerState<_SavedPaymentMethodsSheet> createState() =>
      _SavedPaymentMethodsSheetState();
}

class _SavedPaymentMethodsSheetState
    extends ConsumerState<_SavedPaymentMethodsSheet> {
  int? _selectedMethodId;
  int? _actionMethodId;
  bool _openingAddCard = false;

  @override
  void initState() {
    super.initState();
    _selectedMethodId = widget.selectedMethodId;
  }

  SavedPaymentMethodModel? _effectiveSelection(
    List<SavedPaymentMethodModel> methods,
  ) {
    if (methods.isEmpty) {
      return null;
    }

    if (_selectedMethodId != null) {
      for (final method in methods) {
        if (method.id == _selectedMethodId) {
          return method;
        }
      }
    }

    for (final method in methods) {
      if (method.defaultMethod) {
        return method;
      }
    }

    return methods.first;
  }

  Future<void> _refreshMethods() async {
    ref.invalidate(savedPaymentMethodsProvider);
    try {
      await ref.read(savedPaymentMethodsProvider.future);
    } catch (_) {}
  }

  Future<void> _setDefaultMethod(SavedPaymentMethodModel method) async {
    if (_actionMethodId != null) {
      return;
    }

    setState(() => _actionMethodId = method.id);

    try {
      final updated = await ref
          .read(savedPaymentMethodsRepositoryProvider)
          .setDefaultPaymentMethod(method.id);
      if (!mounted) {
        return;
      }

      widget.onSelected(updated.id);
      setState(() => _selectedMethodId = updated.id);
      await _refreshMethods();
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not update the default card: $error')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _actionMethodId = null);
      }
    }
  }

  Future<void> _deleteMethod(SavedPaymentMethodModel method) async {
    if (_actionMethodId != null) {
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Remove card?'),
          content: Text(
            'Delete ${method.maskedLabel} from saved payment methods?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton.tonal(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) {
      return;
    }

    setState(() => _actionMethodId = method.id);

    try {
      await ref
          .read(savedPaymentMethodsRepositoryProvider)
          .deletePaymentMethod(method.id);
      if (!mounted) {
        return;
      }

      if (_selectedMethodId == method.id) {
        widget.onSelected(null);
        setState(() => _selectedMethodId = null);
      }
      await _refreshMethods();
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not delete this card: $error')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _actionMethodId = null);
      }
    }
  }

  Future<void> _addCard() async {
    if (_openingAddCard) {
      return;
    }

    setState(() => _openingAddCard = true);

    try {
      final created = await showModalBottomSheet<SavedPaymentMethodModel>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (_) => const _AddPaymentMethodSheet(),
      );

      if (created == null || !mounted) {
        return;
      }

      widget.onSelected(created.id);
      setState(() => _selectedMethodId = created.id);
      await _refreshMethods();

      if (!mounted) {
        return;
      }
      Navigator.of(context).pop();
    } finally {
      if (mounted) {
        setState(() => _openingAddCard = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final savedPaymentMethods = ref.watch(savedPaymentMethodsProvider);
    final screenHeight = MediaQuery.of(context).size.height;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return SafeArea(
      top: false,
      child: Padding(
        padding: EdgeInsets.fromLTRB(16, 12, 16, 16 + bottomInset),
        child: Container(
          constraints: BoxConstraints(maxHeight: screenHeight * 0.82),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Column(
            children: [
              const SizedBox(height: 12),
              Container(
                width: 42,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 12, 8),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'Saved cards',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.close_rounded),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                child: Text(
                  'Choose the card to use for checkout, update your default, or add a new one.',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.58),
                    height: 1.45,
                  ),
                ),
              ),
              Flexible(
                child: savedPaymentMethods.when(
                  data: (methods) {
                    if (methods.isEmpty) {
                      return const Padding(
                        padding: EdgeInsets.fromLTRB(20, 0, 20, 16),
                        child: _InlineStateCard(
                          icon: Icons.credit_card_off_outlined,
                          title: 'No saved cards yet',
                          message:
                              'Add your first saved card to use fast card authorization at checkout.',
                        ),
                      );
                    }

                    final selectedMethod = _effectiveSelection(methods);
                    return ListView.separated(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                      itemCount: methods.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final method = methods[index];
                        final busy = _actionMethodId == method.id;
                        return _SavedPaymentMethodTile(
                          method: method,
                          selected: selectedMethod?.id == method.id,
                          busy: busy,
                          onSelect: () {
                            widget.onSelected(method.id);
                            Navigator.of(context).pop();
                          },
                          onSetDefault: method.defaultMethod
                              ? null
                              : () => _setDefaultMethod(method),
                          onDelete: () => _deleteMethod(method),
                        );
                      },
                    );
                  },
                  loading: () => const Center(
                    child: CircularProgressIndicator(),
                  ),
                  error: (_, __) => Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                    child: _InlineStateCard(
                      icon: Icons.credit_card_off_outlined,
                      title: 'Could not load cards',
                      message:
                          'Retry loading your saved payment methods or add a new one again in a moment.',
                      actionLabel: 'Retry',
                      onTap: () => unawaited(_refreshMethods()),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _openingAddCard ? null : _addCard,
                    icon: _openingAddCard
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.add_card_rounded),
                    label: const Text('Add a new card'),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AddPaymentMethodSheet extends ConsumerStatefulWidget {
  const _AddPaymentMethodSheet();

  @override
  ConsumerState<_AddPaymentMethodSheet> createState() =>
      _AddPaymentMethodSheetState();
}

class _AddPaymentMethodSheetState
    extends ConsumerState<_AddPaymentMethodSheet> {
  final _holderNameController = TextEditingController();
  final _cardNumberController = TextEditingController();
  final _expiryController = TextEditingController();

  bool _saving = false;
  bool _defaultMethod = true;

  @override
  void dispose() {
    _holderNameController.dispose();
    _cardNumberController.dispose();
    _expiryController.dispose();
    super.dispose();
  }

  String _formatExpiry(String rawValue) {
    final digits = rawValue.replaceAll(RegExp(r'\D'), '');
    if (digits.length < 4) {
      return rawValue.trim();
    }
    return '${digits.substring(0, 2)}/${digits.substring(2, 4)}';
  }

  Future<void> _saveCard() async {
    if (_saving) {
      return;
    }

    final holderName = _holderNameController.text.trim();
    final digits = _cardNumberController.text.replaceAll(RegExp(r'\D'), '');
    final expiryDigits = _expiryController.text.replaceAll(RegExp(r'\D'), '');

    if (holderName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add the cardholder name first.')),
      );
      return;
    }

    if (digits.length < 12) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid card number.')),
      );
      return;
    }

    if (expiryDigits.length < 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter the expiry as MM/YY.')),
      );
      return;
    }

    setState(() => _saving = true);

    try {
      final created = await ref
          .read(savedPaymentMethodsRepositoryProvider)
          .createPaymentMethod(
            holderName: holderName,
            cardNumber: digits,
            expiry: _formatExpiry(expiryDigits),
            defaultMethod: _defaultMethod,
          );
      ref.invalidate(savedPaymentMethodsProvider);

      if (!mounted) {
        return;
      }
      Navigator.of(context).pop(created);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not save the card: $error')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return SafeArea(
      top: false,
      child: Padding(
        padding: EdgeInsets.fromLTRB(16, 12, 16, 16 + bottomInset),
        child: SingleChildScrollView(
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 42,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Add saved card',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'This stores a checkout-ready card label so the booking can authorize faster on the next step.',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.58),
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _CheckoutField(
                    controller: _holderNameController,
                    label: 'Cardholder name',
                    icon: Icons.person_outline_rounded,
                    keyboardType: TextInputType.name,
                  ),
                  const SizedBox(height: 12),
                  _CheckoutField(
                    controller: _cardNumberController,
                    label: 'Card number',
                    icon: Icons.credit_card_rounded,
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 12),
                  _CheckoutField(
                    controller: _expiryController,
                    label: 'Expiry (MM/YY)',
                    icon: Icons.event_outlined,
                    keyboardType: TextInputType.datetime,
                  ),
                  const SizedBox(height: 12),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.08),
                      ),
                    ),
                    child: SwitchListTile.adaptive(
                      value: _defaultMethod,
                      onChanged: (value) {
                        setState(() => _defaultMethod = value);
                      },
                      title: const Text(
                        'Use as my default card',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      subtitle: Text(
                        'This card will be preselected during checkout.',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.55),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _saving ? null : _saveCard,
                      child: _saving
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Save card'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SavedPaymentMethodTile extends StatelessWidget {
  final SavedPaymentMethodModel method;
  final bool selected;
  final bool busy;
  final VoidCallback onSelect;
  final VoidCallback? onSetDefault;
  final VoidCallback? onDelete;

  const _SavedPaymentMethodTile({
    required this.method,
    required this.selected,
    required this.busy,
    required this.onSelect,
    this.onSetDefault,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: busy ? null : onSelect,
      borderRadius: BorderRadius.circular(18),
      child: Ink(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.accent.withValues(alpha: 0.12)
              : Colors.white.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: selected
                ? AppColors.accent.withValues(alpha: 0.38)
                : Colors.white.withValues(alpha: 0.06),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(
                    Icons.credit_card_rounded,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        method.maskedLabel,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        method.holderName.isEmpty
                            ? 'Cardholder'
                            : method.holderName,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.55),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                busy
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(
                        selected
                            ? Icons.radio_button_checked_rounded
                            : Icons.radio_button_off_rounded,
                        color: selected
                            ? AppColors.accent
                            : Colors.white.withValues(alpha: 0.35),
                      ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (selected)
                  const _PaymentMethodMetaChip(
                    label: 'Selected',
                    highlight: true,
                  ),
                _PaymentMethodMetaChip(label: 'Expires ${method.expiry}'),
                if (method.defaultMethod)
                  const _PaymentMethodMetaChip(label: 'Default card'),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                TextButton(
                  onPressed: busy ? null : onSetDefault,
                  child: Text(
                    method.defaultMethod ? 'Default card' : 'Make default',
                  ),
                ),
                const Spacer(),
                TextButton(
                  onPressed: busy ? null : onDelete,
                  child: const Text(
                    'Delete',
                    style: TextStyle(color: AppColors.error),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentMethodMetaChip extends StatelessWidget {
  final String label;
  final bool highlight;

  const _PaymentMethodMetaChip({
    required this.label,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    final backgroundColor = highlight
        ? AppColors.accent.withValues(alpha: 0.14)
        : Colors.white.withValues(alpha: 0.06);
    final foregroundColor =
        highlight ? AppColors.accent : Colors.white.withValues(alpha: 0.72);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: highlight
              ? AppColors.accent.withValues(alpha: 0.22)
              : Colors.white.withValues(alpha: 0.08),
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: foregroundColor,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _PaymentSummaryCard extends StatelessWidget {
  final _PaymentSummary payment;
  final bool busy;
  final VoidCallback? onRetry;

  const _PaymentSummaryCard({
    required this.payment,
    this.busy = false,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = switch (payment.status) {
      'AUTHORIZED' => const Color(0xFF10B981),
      'CAPTURED' => AppColors.accent,
      'REFUNDED' => AppColors.warning,
      'FAILED' => AppColors.error,
      'INITIATED' => AppColors.warning,
      _ => Colors.white,
    };

    final wholeAmount = payment.amount.truncateToDouble() == payment.amount;
    final amountLabel = wholeAmount
        ? 'R${payment.amount.toStringAsFixed(0)}'
        : 'R${payment.amount.toStringAsFixed(2)}';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(Icons.payments_outlined, color: statusColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Booking #${payment.bookingId}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      payment.reference,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    payment.status,
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    amountLabel,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
          if (onRetry != null) ...[
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: busy ? null : onRetry,
                icon: busy
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(
                        payment.status == 'FAILED'
                            ? Icons.refresh_rounded
                            : Icons.sync_rounded,
                        size: 18,
                      ),
                label: Text(
                  busy
                      ? 'Updating'
                      : payment.status == 'FAILED'
                          ? 'Retry payment'
                          : 'Retry authorization',
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

String _categoryLabel(String categoryId) {
  if (categoryId.isEmpty) {
    return 'Service';
  }

  return categoryId
      .split(RegExp(r'[-_]'))
      .where((part) => part.isNotEmpty)
      .map(
        (part) => '${part[0].toUpperCase()}${part.substring(1).toLowerCase()}',
      )
      .join(' ');
}
