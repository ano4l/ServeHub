import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:serveify/core/config/env.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/network/stomp_service.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/features/auth/providers/auth_provider.dart';

final _availabilityProvider =
    FutureProvider.family<List<_AvailabilitySlot>, int>((ref, providerId) async {
  final dio = ref.read(dioProvider);
  final response = await dio.get('/providers/$providerId/availability');
  final list = response.data as List? ?? const <dynamic>[];
  return list
      .whereType<Map>()
      .map((entry) => _AvailabilitySlot.fromJson(Map<String, dynamic>.from(entry)))
      .toList();
});

final _providerBookingsProvider =
    FutureProvider<List<_ProviderCalendarBooking>>((ref) async {
  final dio = ref.read(dioProvider);
  final response = await dio.get('/bookings');
  final list = response.data is List
      ? response.data as List
      : (response.data is Map && response.data['content'] is List
          ? response.data['content'] as List
          : const <dynamic>[]);
  return list
      .whereType<Map>()
      .map((entry) => _ProviderCalendarBooking.fromJson(Map<String, dynamic>.from(entry)))
      .toList()
    ..sort((left, right) => left.scheduledFor.compareTo(right.scheduledFor));
});

class _AvailabilitySlot {
  final int? id;
  final int dayOfWeek;
  final String dayName;
  final String startTime;
  final String endTime;
  final bool enabled;

  const _AvailabilitySlot({
    this.id,
    required this.dayOfWeek,
    required this.dayName,
    required this.startTime,
    required this.endTime,
    required this.enabled,
  });

  factory _AvailabilitySlot.fromJson(Map<String, dynamic> json) {
    return _AvailabilitySlot(
      id: (json['id'] as num?)?.toInt(),
      dayOfWeek: (json['dayOfWeek'] as num?)?.toInt() ?? 0,
      dayName: json['dayName']?.toString() ?? '',
      startTime: json['startTime']?.toString() ?? '08:00',
      endTime: json['endTime']?.toString() ?? '17:00',
      enabled: json['enabled'] as bool? ?? true,
    );
  }
}

class _ProviderCalendarBooking {
  final int id;
  final String serviceName;
  final String customerName;
  final String status;
  final String address;
  final DateTime scheduledFor;
  final double quotedPrice;

  const _ProviderCalendarBooking({
    required this.id,
    required this.serviceName,
    required this.customerName,
    required this.status,
    required this.address,
    required this.scheduledFor,
    required this.quotedPrice,
  });

  factory _ProviderCalendarBooking.fromJson(Map<String, dynamic> json) {
    final rawDate = json['scheduledFor']?.toString() ?? DateTime.now().toIso8601String();
    final rawPrice = json['quotedPrice'];
    return _ProviderCalendarBooking(
      id: (json['id'] as num?)?.toInt() ?? 0,
      serviceName: json['serviceName']?.toString() ?? 'Service',
      customerName: json['customerName']?.toString() ?? 'Customer',
      status: json['status']?.toString() ?? 'REQUESTED',
      address: json['address']?.toString() ?? 'No address provided',
      scheduledFor: DateTime.tryParse(rawDate) ?? DateTime.now(),
      quotedPrice: rawPrice is num
          ? rawPrice.toDouble()
          : double.tryParse(rawPrice?.toString() ?? '') ?? 0,
    );
  }
}

enum _AvailabilityViewMode { calendar, hours }

class AvailabilitySettingsScreen extends ConsumerStatefulWidget {
  const AvailabilitySettingsScreen({super.key});

  @override
  ConsumerState<AvailabilitySettingsScreen> createState() =>
      _AvailabilitySettingsScreenState();
}

class _AvailabilitySettingsScreenState
    extends ConsumerState<AvailabilitySettingsScreen> {
  static const _dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  final Map<int, bool> _enabled = {};
  final Map<int, TimeOfDay> _startTimes = {};
  final Map<int, TimeOfDay> _endTimes = {};

  bool _initialized = false;
  bool _saving = false;
  _AvailabilityViewMode _viewMode = _AvailabilityViewMode.calendar;
  late DateTime _weekStart;
  late DateTime _selectedDay;
  void Function()? _realtimeUnsubscribe;

  @override
  void initState() {
    super.initState();
    final today = _normalizeDate(DateTime.now());
    _weekStart = _startOfWeek(today);
    _selectedDay = today;
    if (!Env.testMode) {
      _realtimeUnsubscribe = ref.read(stompServiceProvider).subscribe(
        '/user/queue/bookings',
        (_) {
          final providerId = _providerId;
          ref.invalidate(_providerBookingsProvider);
          if (providerId != null) {
            ref.invalidate(_availabilityProvider(providerId));
          }
        },
      );
    }
  }

  @override
  void dispose() {
    _realtimeUnsubscribe?.call();
    super.dispose();
  }

  int? get _providerId {
    final auth = ref.read(authProvider);
    return int.tryParse(auth.providerId ?? '');
  }

  void _initDefaults() {
    for (var i = 0; i < 7; i++) {
      _enabled[i] = i >= 1 && i <= 5;
      _startTimes[i] = const TimeOfDay(hour: 8, minute: 0);
      _endTimes[i] = const TimeOfDay(hour: 17, minute: 0);
    }
  }

  void _applyFromServer(List<_AvailabilitySlot> slots) {
    _initDefaults();
    for (final slot in slots) {
      _enabled[slot.dayOfWeek] = slot.enabled;
      final startParts = slot.startTime.split(':');
      final endParts = slot.endTime.split(':');
      _startTimes[slot.dayOfWeek] = TimeOfDay(
        hour: int.parse(startParts[0]),
        minute: int.parse(startParts[1]),
      );
      _endTimes[slot.dayOfWeek] = TimeOfDay(
        hour: int.parse(endParts[0]),
        minute: int.parse(endParts[1]),
      );
    }
  }

  String _formatTime(TimeOfDay time) {
    return '${time.hour.toString().padLeft(2, '0')}:'
        '${time.minute.toString().padLeft(2, '0')}';
  }

  DateTime _normalizeDate(DateTime value) {
    return DateTime(value.year, value.month, value.day);
  }

  DateTime _startOfWeek(DateTime value) {
    final normalized = _normalizeDate(value);
    final weekday = normalized.weekday % 7;
    return normalized.subtract(Duration(days: weekday));
  }

  Future<void> _pickTime(int day, bool isStart) async {
    final current = isStart ? _startTimes[day]! : _endTimes[day]!;
    final picked = await showTimePicker(
      context: context,
      initialTime: current,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            timePickerTheme: TimePickerThemeData(
              backgroundColor: AppColors.surface,
              hourMinuteTextColor: AppColors.textPrimary,
              dialHandColor: AppColors.accent,
              dialBackgroundColor: AppColors.surfaceAlt,
            ),
          ),
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
    if (picked == null) {
      return;
    }

    setState(() {
      if (isStart) {
        _startTimes[day] = picked;
      } else {
        _endTimes[day] = picked;
      }
    });
  }

  Future<void> _save() async {
    final providerId = _providerId;
    if (providerId == null) {
      return;
    }

    setState(() => _saving = true);
    final slots = <Map<String, dynamic>>[];
    for (var day = 0; day < 7; day++) {
      if (_enabled[day] == true) {
        slots.add({
          'dayOfWeek': day,
          'startTime': _formatTime(_startTimes[day]!),
          'endTime': _formatTime(_endTimes[day]!),
          'enabled': true,
        });
      }
    }

    try {
      await ref.read(dioProvider).put('/providers/me/availability', data: slots);
      ref.invalidate(_availabilityProvider(providerId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Availability saved'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } on DioException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(ApiException.fromDioError(error).message),
            backgroundColor: AppColors.error,
          ),
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
    final providerId = _providerId;
    if (providerId == null) {
      return const Scaffold(
        body: Center(child: Text('Provider profile not available')),
      );
    }

    final availability = ref.watch(_availabilityProvider(providerId));
    final bookings = ref.watch(_providerBookingsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Availability'),
        actions: [
          IconButton(
            onPressed: () {
              ref.invalidate(_providerBookingsProvider);
              ref.invalidate(_availabilityProvider(providerId));
            },
            icon: const Icon(LucideIcons.refreshCcw),
          ),
          if (_viewMode == _AvailabilityViewMode.hours)
            TextButton.icon(
              onPressed: _saving ? null : _save,
              icon: _saving
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(LucideIcons.check, size: 16),
              label: Text(
                _saving ? 'Saving...' : 'Save',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(
              children: [
                Expanded(
                  child: _ModeChip(
                    label: 'Calendar',
                    active: _viewMode == _AvailabilityViewMode.calendar,
                    onTap: () => setState(
                      () => _viewMode = _AvailabilityViewMode.calendar,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _ModeChip(
                    label: 'Working Hours',
                    active: _viewMode == _AvailabilityViewMode.hours,
                    onTap: () => setState(
                      () => _viewMode = _AvailabilityViewMode.hours,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: switch (_viewMode) {
              _AvailabilityViewMode.calendar =>
                _buildCalendarView(availability, bookings),
              _AvailabilityViewMode.hours => availability.when(
                  data: (slots) {
                    if (!_initialized) {
                      _applyFromServer(slots);
                      _initialized = true;
                    }
                    return _buildHoursView();
                  },
                  loading: () {
                    if (!_initialized) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    return _buildHoursView();
                  },
                  error: (_, __) {
                    if (!_initialized) {
                      _initDefaults();
                      _initialized = true;
                    }
                    return _buildHoursView();
                  },
                ),
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCalendarView(
    AsyncValue<List<_AvailabilitySlot>> availabilityAsync,
    AsyncValue<List<_ProviderCalendarBooking>> bookingsAsync,
  ) {
    final slots = availabilityAsync.valueOrNull ?? const <_AvailabilitySlot>[];
    final bookings = bookingsAsync.valueOrNull ?? const <_ProviderCalendarBooking>[];

    if (availabilityAsync.isLoading &&
        bookingsAsync.isLoading &&
        slots.isEmpty &&
        bookings.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    final weekDays = List<DateTime>.generate(
      7,
      (index) => _weekStart.add(Duration(days: index)),
    );
    final selectedDay = _normalizeDate(_selectedDay);
    final selectedBookings = bookings
        .where((booking) => DateUtils.isSameDay(booking.scheduledFor, selectedDay))
        .toList();
    final selectedAvailability = _slotForDate(slots, selectedDay);
    final weeklyBookings = bookings.where((booking) {
      final normalized = _normalizeDate(booking.scheduledFor);
      return !normalized.isBefore(_weekStart) &&
          normalized.isBefore(_weekStart.add(const Duration(days: 7)));
    }).toList();

    return RefreshIndicator(
      onRefresh: () async {
        final providerId = _providerId;
        ref.invalidate(_providerBookingsProvider);
        if (providerId != null) {
          ref.invalidate(_availabilityProvider(providerId));
        }
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
        children: [
          _CalendarHeroCard(
            weekLabel:
                '${_formatShortDate(_weekStart)} - ${_formatShortDate(_weekStart.add(const Duration(days: 6)))}',
            bookingCount: weeklyBookings.length,
            selectedDayLabel: _formatLongDate(selectedDay),
            availabilityLabel: _availabilityLabel(selectedAvailability),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              IconButton(
                onPressed: () {
                  setState(() {
                    _weekStart = _weekStart.subtract(const Duration(days: 7));
                    _selectedDay = _weekStart;
                  });
                },
                icon: const Icon(LucideIcons.chevronLeft),
              ),
              Expanded(
                child: Text(
                  'Weekly schedule',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              IconButton(
                onPressed: () {
                  setState(() {
                    _weekStart = _weekStart.add(const Duration(days: 7));
                    _selectedDay = _weekStart;
                  });
                },
                icon: const Icon(LucideIcons.chevronRight),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: weekDays.map((day) {
                final count = bookings
                    .where((booking) => DateUtils.isSameDay(booking.scheduledFor, day))
                    .length;
                final available = _slotForDate(slots, day);
                return Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: _CalendarDayChip(
                    day: day,
                    bookingCount: count,
                    availabilityLabel: _availabilityLabel(available),
                    active: DateUtils.isSameDay(day, selectedDay),
                    onTap: () => setState(() => _selectedDay = day),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 18),
          _SectionCard(
            title: 'Selected day',
            subtitle: _availabilityLabel(selectedAvailability),
            icon: Icons.schedule_rounded,
            child: selectedBookings.isEmpty
                ? const _EmptyCalendarState()
                : Column(
                    children: selectedBookings.map((booking) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _CalendarBookingCard(booking: booking),
                      );
                    }).toList(),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildHoursView() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.info.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Icon(LucideIcons.info, size: 16, color: AppColors.info),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Set your working hours for each day. Customers will only see slots inside these windows.',
                  style: TextStyle(
                    color: AppColors.info.withValues(alpha: 0.9),
                    fontSize: 12.5,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ...List.generate(7, _buildDayTile),
      ],
    );
  }

  Widget _buildDayTile(int day) {
    final enabled = _enabled[day] ?? false;
    final start = _startTimes[day] ?? const TimeOfDay(hour: 8, minute: 0);
    final end = _endTimes[day] ?? const TimeOfDay(hour: 17, minute: 0);
    final isWeekend = day == 0 || day == 6;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: enabled ? AppColors.surfaceAlt : AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: enabled
              ? AppColors.accent.withValues(alpha: 0.3)
              : AppColors.border,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: enabled ? AppColors.accentLight : AppColors.card,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text(
                    _dayNames[day].substring(0, 2),
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                      color: enabled ? AppColors.accent : AppColors.textMuted,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _dayNames[day],
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: enabled
                            ? AppColors.textPrimary
                            : AppColors.textMuted,
                      ),
                    ),
                    Text(
                      enabled
                          ? '${start.format(context)} - ${end.format(context)}'
                          : (isWeekend ? 'Weekend' : 'Off'),
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Switch.adaptive(
                value: enabled,
                activeColor: AppColors.accent,
                onChanged: (value) => setState(() => _enabled[day] = value),
              ),
            ],
          ),
          if (enabled) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _TimeButton(
                    label: 'Start',
                    time: start,
                    onTap: () => _pickTime(day, true),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Icon(
                    LucideIcons.arrowRight,
                    size: 14,
                    color: AppColors.textMuted,
                  ),
                ),
                Expanded(
                  child: _TimeButton(
                    label: 'End',
                    time: end,
                    onTap: () => _pickTime(day, false),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  _AvailabilitySlot? _slotForDate(List<_AvailabilitySlot> slots, DateTime date) {
    final dayOfWeek = date.weekday % 7;
    for (final slot in slots) {
      if (slot.dayOfWeek == dayOfWeek) {
        return slot;
      }
    }
    return null;
  }

  String _availabilityLabel(_AvailabilitySlot? slot) {
    if (slot == null || !slot.enabled) {
      return 'Off duty';
    }
    return '${slot.startTime} - ${slot.endTime}';
  }

  String _formatShortDate(DateTime date) {
    return '${date.day} ${_monthLabel(date.month)}';
  }

  String _formatLongDate(DateTime date) {
    return '${_dayNames[date.weekday % 7]}, ${date.day} ${_monthLabel(date.month)}';
  }

  String _monthLabel(int month) {
    const months = [
      '',
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return months[month];
  }
}

class _ModeChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _ModeChip({
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Ink(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: active ? AppColors.accent : AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: active
                ? AppColors.accent.withValues(alpha: 0.6)
                : AppColors.border,
          ),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: active ? Colors.black : Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

class _CalendarHeroCard extends StatelessWidget {
  final String weekLabel;
  final int bookingCount;
  final String selectedDayLabel;
  final String availabilityLabel;

  const _CalendarHeroCard({
    required this.weekLabel,
    required this.bookingCount,
    required this.selectedDayLabel,
    required this.availabilityLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.accent.withValues(alpha: 0.28),
            AppColors.info.withValues(alpha: 0.22),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Weekly calendar',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            weekLabel,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.64),
            ),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: _HeroStat(
                  label: 'Bookings',
                  value: '$bookingCount',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _HeroStat(
                  label: 'Selected day',
                  value: selectedDayLabel,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _HeroStat(
            label: 'Working hours',
            value: availabilityLabel,
          ),
        ],
      ),
    );
  }
}

class _HeroStat extends StatelessWidget {
  final String label;
  final String value;

  const _HeroStat({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.56),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _CalendarDayChip extends StatelessWidget {
  final DateTime day;
  final int bookingCount;
  final String availabilityLabel;
  final bool active;
  final VoidCallback onTap;

  const _CalendarDayChip({
    required this.day,
    required this.bookingCount,
    required this.availabilityLabel,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.weekday % 7];
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Ink(
        width: 124,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: active ? Colors.white : AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              weekday,
              style: TextStyle(
                color: active ? AppColors.background : AppColors.textSecondary,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '${day.day}',
              style: TextStyle(
                color: active ? AppColors.background : Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '$bookingCount booking${bookingCount == 1 ? '' : 's'}',
              style: TextStyle(
                color: active
                    ? AppColors.background.withValues(alpha: 0.72)
                    : Colors.white.withValues(alpha: 0.6),
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              availabilityLabel,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: active
                    ? AppColors.background.withValues(alpha: 0.72)
                    : AppColors.accent,
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

class _SectionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Widget child;

  const _SectionCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: AppColors.accent),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

class _EmptyCalendarState extends StatelessWidget {
  const _EmptyCalendarState();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(18),
      ),
      child: const Column(
        children: [
          Icon(Icons.calendar_month_outlined, color: AppColors.accent),
          SizedBox(height: 12),
          Text(
            'No bookings on this day',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
          SizedBox(height: 6),
          Text(
            'Your calendar is clear here. Customers can still book inside your working hours.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.textSecondary,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _CalendarBookingCard extends StatelessWidget {
  final _ProviderCalendarBooking booking;

  const _CalendarBookingCard({required this.booking});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: booking.id <= 0 ? null : () => context.push('/booking/${booking.id}'),
      borderRadius: BorderRadius.circular(18),
      child: Ink(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 60,
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                children: [
                  Text(
                    '${booking.scheduledFor.hour.toString().padLeft(2, '0')}:${booking.scheduledFor.minute.toString().padLeft(2, '0')}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    booking.status,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: _statusColor(booking.status),
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    booking.serviceName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    booking.customerName,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    booking.address,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Text(
              _formatMoney(booking.quotedPrice),
              style: const TextStyle(
                color: AppColors.accent,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  static Color _statusColor(String status) {
    switch (status) {
      case 'ACCEPTED':
      case 'COMPLETED':
        return AppColors.success;
      case 'IN_PROGRESS':
        return AppColors.warning;
      case 'DECLINED':
      case 'CANCELLED':
      case 'EXPIRED':
        return AppColors.error;
      default:
        return AppColors.accent;
    }
  }

  static String _formatMoney(double value) {
    final whole = value.truncateToDouble() == value;
    return whole ? 'R${value.toStringAsFixed(0)}' : 'R${value.toStringAsFixed(2)}';
  }
}

class _TimeButton extends StatelessWidget {
  final String label;
  final TimeOfDay time;
  final VoidCallback onTap;

  const _TimeButton({
    required this.label,
    required this.time,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Icon(Icons.schedule_rounded, size: 14, color: AppColors.textMuted),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.textMuted,
                  ),
                ),
                Text(
                  time.format(context),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
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
