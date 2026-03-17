import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:serveify/core/theme/app_theme.dart';

// ─── Mock service data (mirrors web HOME_SERVICE_FIXTURES) ───
class _Service {
  final String id, provider, title, subtitle, category, price, imageUrl;
  final double rating;
  final int reviews;
  final bool availableNow;
  const _Service({required this.id, required this.provider, required this.title, required this.subtitle, required this.category, required this.price, required this.imageUrl, required this.rating, required this.reviews, required this.availableNow});
}

const _services = [
  _Service(id: '1', provider: 'Mpho Flow Fix', title: 'Emergency plumbing', subtitle: 'Leaks, geysers, and urgent repairs', category: 'Plumbing', price: 'From R420', imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80', rating: 4.9, reviews: 248, availableNow: true),
  _Service(id: '2', provider: 'Nandi Spark Works', title: 'Backup power installs', subtitle: 'Generator and inverter support', category: 'Electrical', price: 'From R650', imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80', rating: 4.8, reviews: 191, availableNow: true),
  _Service(id: '3', provider: 'Fresh Fold Crew', title: 'Move-out deep clean', subtitle: 'Same-day home reset', category: 'Cleaning', price: 'From R360', imageUrl: 'https://images.unsplash.com/photo-1581578731548-2364de5c7b07?auto=format&fit=crop&w=400&q=80', rating: 4.7, reviews: 164, availableNow: true),
  _Service(id: '4', provider: 'Heatwave HVAC Co', title: 'Office AC tune-up', subtitle: 'Cooling, airflow, and service plans', category: 'HVAC', price: 'From R540', imageUrl: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=400&q=80', rating: 4.8, reviews: 176, availableNow: true),
];

const _timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

// ─── Nominatim address result ───
class _AddressResult {
  final String displayName;
  final double lat, lon;
  _AddressResult({required this.displayName, required this.lat, required this.lon});
}

// ─── Main screen ───
class CreateBookingScreen extends ConsumerStatefulWidget {
  final int? serviceId;
  final int? providerId;
  const CreateBookingScreen({super.key, this.serviceId, this.providerId});
  @override
  ConsumerState<CreateBookingScreen> createState() => _CreateBookingScreenState();
}

class _CreateBookingScreenState extends ConsumerState<CreateBookingScreen> {
  int _step = 0; // 0, 1, 2

  // Step 1
  _Service? _selectedService;
  String? _selectedDate;
  String? _selectedTime;
  int _urgency = 0; // 0=standard, 1=urgent, 2=same-day

  // Step 2
  final _addressController = TextEditingController();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _notesController = TextEditingController();
  List<_AddressResult> _suggestions = [];
  bool _searchingAddress = false;
  Timer? _debounce;
  String _locationType = 'home';

  // Step 3
  String _paymentMethod = 'card';

  @override
  void dispose() {
    _addressController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _notesController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  bool get _canProceed {
    switch (_step) {
      case 0: return _selectedService != null && _selectedDate != null && _selectedTime != null;
      case 1: return _addressController.text.isNotEmpty && _nameController.text.isNotEmpty && _phoneController.text.isNotEmpty;
      case 2: return true;
      default: return false;
    }
  }

  // ─── Nominatim search ───
  void _searchAddress(String query) {
    _debounce?.cancel();
    if (query.length < 3) {
      setState(() => _suggestions = []);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 400), () async {
      setState(() => _searchingAddress = true);
      try {
        final uri = Uri.parse('https://nominatim.openstreetmap.org/search?q=${Uri.encodeComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=za');
        final res = await http.get(uri, headers: {'User-Agent': 'ServeHub/1.0', 'Accept-Language': 'en'});
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body) as List;
          setState(() {
            _suggestions = data.map((e) => _AddressResult(
              displayName: e['display_name'] as String,
              lat: double.parse(e['lat'] as String),
              lon: double.parse(e['lon'] as String),
            )).toList();
          });
        }
      } catch (_) {}
      if (mounted) setState(() => _searchingAddress = false);
    });
  }

  // ─── Quick dates ───
  List<MapEntry<String, String>> get _quickDates {
    final now = DateTime.now();
    String fmt(DateTime d) => '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    return [
      MapEntry(fmt(now), 'Today'),
      MapEntry(fmt(now.add(const Duration(days: 1))), 'Tomorrow'),
      MapEntry(fmt(now.add(const Duration(days: 2))), '${_weekday(now.add(const Duration(days: 2)))} ${now.add(const Duration(days: 2)).day}'),
    ];
  }

  String _weekday(DateTime d) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d.weekday - 1];

  @override
  Widget build(BuildContext context) {
    final progress = _step / 2.0;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // ─── Header ───
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Column(
                children: [
                  Row(
                    children: [
                      _circleBtn(Icons.arrow_back_rounded, () => _step > 0 ? setState(() => _step--) : Navigator.of(context).pop()),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Book a Service', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white)),
                            Text('Step ${_step + 1} of 3 · ${['Service & Time', 'Location', 'Confirm'][_step]}',
                              style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.45))),
                          ],
                        ),
                      ),
                      _circleBtn(Icons.close_rounded, () => Navigator.of(context).pop()),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Progress bar
                  ClipRRect(
                    borderRadius: BorderRadius.circular(2),
                    child: LinearProgressIndicator(
                      value: progress,
                      backgroundColor: Colors.white.withValues(alpha: 0.08),
                      valueColor: AlwaysStoppedAnimation(AppColors.accent),
                      minHeight: 3,
                    ),
                  ),
                  const SizedBox(height: 8),
                  // Step indicators
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      for (int i = 0; i < 3; i++)
                        _stepIndicator(i, ['Service & Time', 'Location', 'Confirm'][i],
                          [Icons.calendar_today_rounded, Icons.location_on_rounded, Icons.check_rounded][i]),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // ─── Content ───
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                child: _step == 0 ? _buildStep1() : _step == 1 ? _buildStep2() : _buildStep3(),
              ),
            ),
          ),

          // ─── Bottom CTA ───
          Container(
            padding: EdgeInsets.fromLTRB(20, 12, 20, MediaQuery.of(context).padding.bottom + 12),
            decoration: BoxDecoration(
              color: AppColors.background.withValues(alpha: 0.95),
              border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.06))),
            ),
            child: Row(
              children: [
                if (_step > 0)
                  Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: SizedBox(
                      width: 48, height: 48,
                      child: OutlinedButton(
                        onPressed: () => setState(() => _step--),
                        style: OutlinedButton.styleFrom(
                          padding: EdgeInsets.zero,
                          side: BorderSide(color: Colors.white.withValues(alpha: 0.12)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                        ),
                        child: Icon(Icons.arrow_back_rounded, size: 20, color: Colors.white.withValues(alpha: 0.6)),
                      ),
                    ),
                  ),
                Expanded(
                  child: SizedBox(
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _canProceed ? () {
                        if (_step < 2) {
                          setState(() => _step++);
                        } else {
                          // Submit
                          context.go('/bookings');
                        }
                      } : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _canProceed ? Colors.white : Colors.white.withValues(alpha: 0.08),
                        foregroundColor: _canProceed ? AppColors.primary : Colors.white.withValues(alpha: 0.25),
                        disabledBackgroundColor: Colors.white.withValues(alpha: 0.08),
                        disabledForegroundColor: Colors.white.withValues(alpha: 0.25),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                        elevation: 0,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (_step == 2) const Icon(Icons.check_rounded, size: 20),
                          if (_step == 2) const SizedBox(width: 8),
                          Text(_step == 2 ? 'Confirm Booking' : 'Continue', style: const TextStyle(fontWeight: FontWeight.w600)),
                          if (_step < 2) const SizedBox(width: 8),
                          if (_step < 2) const Icon(Icons.arrow_forward_rounded, size: 20),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _circleBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40, height: 40,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.white.withValues(alpha: 0.08),
        ),
        child: Icon(icon, size: 20, color: Colors.white.withValues(alpha: 0.6)),
      ),
    );
  }

  Widget _stepIndicator(int index, String label, IconData icon) {
    final active = _step == index;
    final done = _step > index;
    return GestureDetector(
      onTap: done ? () => setState(() => _step = index) : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(100),
          color: active ? Colors.white.withValues(alpha: 0.1) : Colors.transparent,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 24, height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: active ? Colors.white : done ? AppColors.accent.withValues(alpha: 0.2) : Colors.white.withValues(alpha: 0.06),
              ),
              child: Center(
                child: done
                  ? Icon(Icons.check_rounded, size: 12, color: AppColors.accent)
                  : Icon(icon, size: 12, color: active ? AppColors.primary : Colors.white.withValues(alpha: 0.25)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ══════════════════════════════════════
  // Step 1: Service & Time
  // ══════════════════════════════════════
  Widget _buildStep1() {
    return Column(
      key: const ValueKey('step1'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Choose a service', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white)),
        const SizedBox(height: 4),
        Text('Select the service you need', style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.4))),
        const SizedBox(height: 16),

        // Service cards
        for (final s in _services) ...[
          _serviceCard(s),
          const SizedBox(height: 10),
        ],

        // Scheduling (appears after service selected)
        if (_selectedService != null) ...[
          const SizedBox(height: 24),
          const Text('When do you need it?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white)),
          const SizedBox(height: 4),
          Text('Pick a date and time', style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.4))),
          const SizedBox(height: 16),

          // Quick date chips
          Wrap(
            spacing: 8,
            children: [
              for (final qd in _quickDates)
                _chipBtn(qd.value, _selectedDate == qd.key, () => setState(() => _selectedDate = qd.key)),
            ],
          ),
          const SizedBox(height: 16),

          // Time grid
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final t in _timeSlots)
                _chipBtn(t, _selectedTime == t, () => setState(() => _selectedTime = t)),
            ],
          ),
          const SizedBox(height: 16),

          // Urgency
          Row(
            children: [
              _urgencyCard(0, 'Standard', '3–5 days', Icons.access_time_rounded),
              const SizedBox(width: 8),
              _urgencyCard(1, 'Urgent', '24–48h', Icons.bolt_rounded),
              const SizedBox(width: 8),
              _urgencyCard(2, 'Same-day', 'ASAP', Icons.auto_awesome_rounded),
            ],
          ),
        ],
        const SizedBox(height: 40),
      ],
    );
  }

  Widget _serviceCard(_Service s) {
    final selected = _selectedService?.id == s.id;
    return GestureDetector(
      onTap: () => setState(() => _selectedService = s),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: selected ? AppColors.accent.withValues(alpha: 0.5) : Colors.white.withValues(alpha: 0.08)),
          color: selected ? AppColors.accent.withValues(alpha: 0.06) : Colors.white.withValues(alpha: 0.03),
        ),
        child: Row(
          children: [
            // Thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 56, height: 56,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.network(s.imageUrl, fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(color: Colors.white.withValues(alpha: 0.05))),
                    if (selected)
                      Container(
                        color: AppColors.accent.withValues(alpha: 0.4),
                        child: const Center(child: Icon(Icons.check_rounded, color: Colors.white, size: 20)),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(child: Text(s.title, style: const TextStyle(fontWeight: FontWeight.w500, color: Colors.white), maxLines: 1, overflow: TextOverflow.ellipsis)),
                      if (s.availableNow)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(100)),
                          child: Text('Available', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: AppColors.success)),
                        ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(s.provider, style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.45))),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Text(s.price, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.accent)),
                      const SizedBox(width: 12),
                      Icon(Icons.star_rounded, size: 12, color: AppColors.warning),
                      const SizedBox(width: 2),
                      Text('${s.rating} (${s.reviews})', style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.4))),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _chipBtn(String label, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(100),
          border: Border.all(color: active ? AppColors.accent.withValues(alpha: 0.5) : Colors.white.withValues(alpha: 0.1)),
          color: active ? AppColors.accent.withValues(alpha: 0.12) : Colors.white.withValues(alpha: 0.04),
        ),
        child: Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: active ? Colors.white : Colors.white.withValues(alpha: 0.5))),
      ),
    );
  }

  Widget _urgencyCard(int value, String label, String sub, IconData icon) {
    final active = _urgency == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _urgency = value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: active ? AppColors.accent.withValues(alpha: 0.5) : Colors.white.withValues(alpha: 0.08)),
            color: active ? AppColors.accent.withValues(alpha: 0.08) : Colors.white.withValues(alpha: 0.03),
          ),
          child: Column(
            children: [
              Icon(icon, size: 18, color: active ? Colors.white : Colors.white.withValues(alpha: 0.45)),
              const SizedBox(height: 4),
              Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: active ? Colors.white : Colors.white.withValues(alpha: 0.45))),
              Text(sub, style: TextStyle(fontSize: 10, color: Colors.white.withValues(alpha: 0.3))),
              if (value > 0)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(value == 1 ? '+25%' : '+50%', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.warning)),
                ),
            ],
          ),
        ),
      ),
    );
  }

  // ══════════════════════════════════════
  // Step 2: Location + Contact
  // ══════════════════════════════════════
  Widget _buildStep2() {
    return Column(
      key: const ValueKey('step2'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Service address', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white)),
        const SizedBox(height: 4),
        Text('Where should the provider come?', style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.4))),
        const SizedBox(height: 16),

        // Address autocomplete input
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            color: Colors.white.withValues(alpha: 0.05),
          ),
          child: Row(
            children: [
              Padding(
                padding: const EdgeInsets.only(left: 14),
                child: _searchingAddress
                  ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.accent))
                  : Icon(Icons.location_on_outlined, size: 18, color: Colors.white.withValues(alpha: 0.4)),
              ),
              Expanded(
                child: TextField(
                  controller: _addressController,
                  onChanged: (v) { _searchAddress(v); setState(() {}); },
                  style: const TextStyle(fontSize: 14, color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'Search for an address…',
                    hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                  ),
                ),
              ),
              if (_addressController.text.isNotEmpty)
                GestureDetector(
                  onTap: () => setState(() { _addressController.clear(); _suggestions = []; }),
                  child: Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: Icon(Icons.close_rounded, size: 16, color: Colors.white.withValues(alpha: 0.4)),
                  ),
                ),
            ],
          ),
        ),

        // Suggestions dropdown
        if (_suggestions.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
              color: const Color(0xFF0c1a2e),
            ),
            child: Column(
              children: [
                for (final result in _suggestions)
                  _suggestionTile(result),
              ],
            ),
          ),

        // Location type
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          children: [
            for (final t in ['home', 'office', 'other'])
              _chipBtn(t[0].toUpperCase() + t.substring(1), _locationType == t, () => setState(() => _locationType = t)),
          ],
        ),

        // Notes
        const SizedBox(height: 16),
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            color: Colors.white.withValues(alpha: 0.05),
          ),
          child: TextField(
            controller: _notesController,
            maxLines: 2,
            style: const TextStyle(fontSize: 14, color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Gate code, parking info, or instructions…',
              hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.all(14),
            ),
          ),
        ),

        // Contact
        const SizedBox(height: 28),
        const Text('Your details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white)),
        const SizedBox(height: 4),
        Text('So the provider can reach you', style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.4))),
        const SizedBox(height: 16),
        _inputField(_nameController, 'Full name', Icons.person_outline_rounded),
        const SizedBox(height: 12),
        _inputField(_phoneController, 'Phone number', Icons.phone_outlined, inputType: TextInputType.phone),
        const SizedBox(height: 40),
      ],
    );
  }

  Widget _suggestionTile(_AddressResult result) {
    final parts = result.displayName.split(',').map((s) => s.trim()).toList();
    final primary = parts.take(2).join(', ');
    final secondary = parts.skip(2).take(2).join(', ');
    return GestureDetector(
      onTap: () {
        _addressController.text = result.displayName;
        setState(() => _suggestions = []);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: Colors.white.withValues(alpha: 0.04))),
        ),
        child: Row(
          children: [
            Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.06),
              ),
              child: Icon(Icons.navigation_rounded, size: 16, color: Colors.white.withValues(alpha: 0.5)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(primary, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Colors.white.withValues(alpha: 0.9))),
                  if (secondary.isNotEmpty)
                    Text(secondary, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.4))),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _inputField(TextEditingController controller, String hint, IconData icon, {TextInputType? inputType}) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        color: Colors.white.withValues(alpha: 0.05),
      ),
      child: TextField(
        controller: controller,
        keyboardType: inputType,
        onChanged: (_) => setState(() {}),
        style: const TextStyle(fontSize: 14, color: Colors.white),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
          prefixIcon: Icon(icon, size: 18, color: Colors.white.withValues(alpha: 0.4)),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        ),
      ),
    );
  }

  // ══════════════════════════════════════
  // Step 3: Confirm
  // ══════════════════════════════════════
  Widget _buildStep3() {
    final urgencyLabels = ['Standard', 'Urgent +25%', 'Same-day +50%'];
    return Column(
      key: const ValueKey('step3'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Summary card with image
        if (_selectedService != null)
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
              color: Colors.white.withValues(alpha: 0.04),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              children: [
                // Image header
                SizedBox(
                  height: 100,
                  width: double.infinity,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.network(_selectedService!.imageUrl, fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(color: Colors.white.withValues(alpha: 0.05))),
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter, end: Alignment.bottomCenter,
                            colors: [Colors.transparent, AppColors.background],
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 12, left: 16,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_selectedService!.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
                            Text(_selectedService!.provider, style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.5))),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _summaryRow('Date', _selectedDate ?? '—'),
                      _summaryRow('Time', _selectedTime ?? '—'),
                      _summaryRow('Urgency', urgencyLabels[_urgency]),
                      Container(height: 1, color: Colors.white.withValues(alpha: 0.06), margin: const EdgeInsets.symmetric(vertical: 10)),
                      _summaryRow('Address', _addressController.text.isEmpty ? '—' : _addressController.text, truncate: true),
                      _summaryRow('Contact', _nameController.text.isEmpty ? '—' : _nameController.text),
                      _summaryRow('Phone', _phoneController.text.isEmpty ? '—' : _phoneController.text),
                      Container(height: 1, color: Colors.white.withValues(alpha: 0.06), margin: const EdgeInsets.symmetric(vertical: 10)),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Estimated total', style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.5))),
                          Text(_selectedService!.price, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.accent)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

        const SizedBox(height: 24),

        // Payment method
        const Text('Payment method', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
        const SizedBox(height: 12),
        Row(
          children: [
            _paymentCard('card', 'Card', Icons.credit_card_rounded),
            const SizedBox(width: 8),
            _paymentCard('cash', 'Cash', Icons.payments_outlined),
            const SizedBox(width: 8),
            _paymentCard('eft', 'EFT', Icons.smartphone_rounded),
          ],
        ),

        const SizedBox(height: 20),

        // Secure booking banner
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            color: AppColors.accent.withValues(alpha: 0.06),
            border: Border.all(color: AppColors.accent.withValues(alpha: 0.2)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.shield_outlined, size: 20, color: AppColors.accent),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Secure booking', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.accent)),
                    const SizedBox(height: 4),
                    Text("You won't be charged until the service is confirmed. Free cancellation up to 2 hours before.",
                      style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.45))),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 40),
      ],
    );
  }

  Widget _summaryRow(String label, String value, {bool truncate = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.4))),
          const SizedBox(width: 16),
          Flexible(
            child: Text(value,
              textAlign: TextAlign.end,
              maxLines: truncate ? 1 : 2,
              overflow: truncate ? TextOverflow.ellipsis : TextOverflow.visible,
              style: const TextStyle(fontSize: 13, color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Widget _paymentCard(String value, String label, IconData icon) {
    final active = _paymentMethod == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _paymentMethod = value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: active ? AppColors.accent.withValues(alpha: 0.5) : Colors.white.withValues(alpha: 0.08)),
            color: active ? AppColors.accent.withValues(alpha: 0.08) : Colors.white.withValues(alpha: 0.03),
          ),
          child: Column(
            children: [
              Icon(icon, size: 22, color: active ? Colors.white : Colors.white.withValues(alpha: 0.45)),
              const SizedBox(height: 6),
              Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: active ? Colors.white : Colors.white.withValues(alpha: 0.45))),
            ],
          ),
        ),
      ),
    );
  }
}
