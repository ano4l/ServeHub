import 'dart:ui';

import 'package:flutter/material.dart';

import 'api_client.dart';
import 'models.dart';
import 'realtime_messaging.dart';

void main() => runApp(const ServeHubApp());

class ServeHubApp extends StatelessWidget {
  const ServeHubApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'ServeHub',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFE7F88A),
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF3F635E),
      ),
      home: const ShellScreen(),
    );
  }
}

class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key});

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  final api = ServeHubApiClient();
  final realtime = RealtimeMessagingClient();

  AuthSession? session;
  int selectedIndex = 0;
  int? activeBookingId;
  String? banner;
  bool bannerError = false;

  @override
  void dispose() {
    realtime.dispose();
    super.dispose();
  }

  Future<void> loginAs(String email) async {
    try {
      final next = await api.login(email: email, password: 'password');
      setState(() {
        session = next;
        bannerError = false;
        banner = 'Signed in as ${next.email} (${next.role})';
      });
    } catch (e) {
      setState(() {
        bannerError = true;
        banner = 'Login failed: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      BookingFlowScreen(
        api: api,
        session: session,
        onBookingCreated: (booking) {
          setState(() {
            activeBookingId = booking.id;
            selectedIndex = 2;
            bannerError = false;
            banner = 'Booking #${booking.id} created. Chat opened.';
          });
        },
      ),
      ProviderDashboardScreen(api: api, session: session),
      MessagingScreen(realtime: realtime, activeBookingId: activeBookingId),
    ];

    return Scaffold(
      extendBody: true,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        title: const Text('ServeHub Mobile'),
        actions: [
          TextButton(onPressed: () => loginAs('customer@servehub.dev'), child: const Text('Customer')),
          TextButton(onPressed: () => loginAs('provider@servehub.dev'), child: const Text('Provider')),
        ],
      ),
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF274A47), Color(0xFF4D6D67), Color(0xFF6E8680)],
          ),
        ),
        child: SafeArea(
          top: false,
          child: Stack(
            children: [
              const Positioned.fill(child: AmbientGlow()),
              Column(
                children: [
                  if (banner != null)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                      child: BannerCard(text: banner!, isError: bannerError),
                    ),
                  Expanded(child: pages[selectedIndex]),
                ],
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        maintainBottomViewPadding: true,
        onDestinationSelected: (value) => setState(() => selectedIndex = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.search), label: 'Book'),
          NavigationDestination(icon: Icon(Icons.handyman_outlined), label: 'Provider'),
          NavigationDestination(icon: Icon(Icons.chat_bubble_outline), label: 'Chat'),
        ],
      ),
    );
  }
}

class BookingFlowScreen extends StatefulWidget {
  const BookingFlowScreen({
    super.key,
    required this.api,
    required this.session,
    required this.onBookingCreated,
  });

  final ServeHubApiClient api;
  final AuthSession? session;
  final ValueChanged<Booking> onBookingCreated;

  @override
  State<BookingFlowScreen> createState() => _BookingFlowScreenState();
}

class _BookingFlowScreenState extends State<BookingFlowScreen> {
  final address = TextEditingController(text: '12 West Road South, Sandton');
  final notes = TextEditingController(text: 'Gate code 2291. Ring once.');

  late Future<List<ServiceOffering>> servicesFuture;
  int? selectedServiceId;
  PaymentRecord? latestPayment;
  String? feedback;
  bool feedbackError = false;
  bool submitting = false;

  @override
  void initState() {
    super.initState();
    servicesFuture = widget.api.fetchServices();
  }

  @override
  void dispose() {
    address.dispose();
    notes.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<ServiceOffering>>(
      future: servicesFuture,
      builder: (context, snapshot) {
        return AppPane(
          title: 'Book a Service',
          subtitle: 'Address clarity, access notes, quote visibility, and explicit booking creation.',
          child: snapshot.connectionState != ConnectionState.done
              ? const Center(child: CircularProgressIndicator())
              : snapshot.hasError
                  ? RetryCard(message: 'Could not load services.', onRetry: _reloadServices)
                  : _buildContent(snapshot.data ?? []),
        );
      },
    );
  }

  Widget _buildContent(List<ServiceOffering> services) {
    final selected = services.where((s) => s.id == selectedServiceId).firstOrNull ?? (services.isEmpty ? null : services.first);
    selectedServiceId ??= selected?.id;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
      children: [
        if (widget.session == null)
          const EmptyCard(message: 'Use the demo customer login before creating a booking.')
        else ...[
          for (final service in services) ...[
            ServiceCard(
              service: service,
              selected: service.id == selectedServiceId,
              onTap: () => setState(() => selectedServiceId = service.id),
            ),
            const SizedBox(height: 12),
          ],
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Booking details', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                GlassField(controller: address, label: 'Service address'),
                const SizedBox(height: 12),
                GlassField(controller: notes, label: 'Notes, landmarks, gate codes', maxLines: 3),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: const [
                    EdgeChip(label: 'Address check'),
                    EdgeChip(label: 'ETA drift'),
                    EdgeChip(label: 'Scope approval'),
                    EdgeChip(label: 'No-show handling'),
                  ],
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: submitting || selected == null ? null : () => _submit(selected),
                  child: Text(submitting ? 'Creating...' : 'Create Booking'),
                ),
              ],
            ),
          ),
          if (latestPayment != null) ...[
            const SizedBox(height: 12),
            PaymentCard(payment: latestPayment!),
          ],
          if (feedback != null) ...[
            const SizedBox(height: 12),
            BannerCard(text: feedback!, isError: feedbackError),
          ],
        ],
      ],
    );
  }

  Future<void> _submit(ServiceOffering service) async {
    final session = widget.session;
    if (session == null || address.text.trim().isEmpty) {
      setState(() {
        feedbackError = true;
        feedback = 'You need a signed-in customer and a valid address.';
      });
      return;
    }
    setState(() {
      submitting = true;
      latestPayment = null;
      feedback = null;
    });
    try {
      final booking = await widget.api.createBooking(
        token: session.accessToken,
        customerId: session.userId,
        providerId: service.providerId,
        serviceOfferingId: service.id,
        scheduledFor: DateTime.now().add(const Duration(hours: 2)),
        address: address.text.trim(),
        notes: notes.text.trim(),
      );
      final payment = await widget.api.fetchPayment(session.accessToken, booking.id);
      setState(() {
        latestPayment = payment;
        feedbackError = false;
        feedback = 'Booking #${booking.id} created for ${booking.serviceName}.';
      });
      widget.onBookingCreated(booking);
    } catch (e) {
      setState(() {
        feedbackError = true;
        feedback = 'Booking failed: $e';
      });
    } finally {
      if (mounted) setState(() => submitting = false);
    }
  }

  void _reloadServices() {
    setState(() => servicesFuture = widget.api.fetchServices());
  }
}

class ProviderDashboardScreen extends StatefulWidget {
  const ProviderDashboardScreen({super.key, required this.api, required this.session});

  final ServeHubApiClient api;
  final AuthSession? session;

  @override
  State<ProviderDashboardScreen> createState() => _ProviderDashboardScreenState();
}

class _ProviderDashboardScreenState extends State<ProviderDashboardScreen> {
  Future<List<Booking>>? bookingsFuture;
  String? feedback;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  @override
  void didUpdateWidget(covariant ProviderDashboardScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.session?.accessToken != widget.session?.accessToken) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return AppPane(
      title: 'Provider Dashboard',
      subtitle: 'Role-safe actions for accept, start, complete, and decline.',
      child: widget.session == null
          ? const EmptyCard(message: 'Use the demo provider login to manage bookings.')
          : FutureBuilder<List<Booking>>(
              future: bookingsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator());
                if (snapshot.hasError) return RetryCard(message: 'Could not load provider bookings.', onRetry: _reload);
                final bookings = snapshot.data ?? [];
                return ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
                  children: [
                    if (feedback != null) ...[
                      BannerCard(text: feedback!, isError: false),
                      const SizedBox(height: 12),
                    ],
                    if (bookings.isEmpty) const EmptyCard(message: 'No provider bookings yet.'),
                    for (final booking in bookings) ...[
                      ProviderCard(booking: booking, onAction: (a, r) => _runAction(booking.id, a, r)),
                      const SizedBox(height: 12),
                    ],
                  ],
                );
              },
            ),
    );
  }

  Future<void> _runAction(int bookingId, String action, String? reason) async {
    try {
      final booking = await widget.api.triggerBookingAction(
        token: widget.session!.accessToken,
        bookingId: bookingId,
        action: action,
        reason: reason,
      );
      setState(() {
        feedback = 'Booking #${booking.id} is now ${booking.status.name}.';
        _reload();
      });
    } catch (e) {
      setState(() => feedback = 'Action failed: $e');
    }
  }

  void _reload() {
    if (widget.session == null) {
      bookingsFuture = null;
      return;
    }
    bookingsFuture = widget.api.fetchBookings(widget.session!.accessToken);
  }
}

class MessagingScreen extends StatefulWidget {
  const MessagingScreen({super.key, required this.realtime, required this.activeBookingId});

  final RealtimeMessagingClient realtime;
  final int? activeBookingId;

  @override
  State<MessagingScreen> createState() => _MessagingScreenState();
}

class _MessagingScreenState extends State<MessagingScreen> {
  final controller = TextEditingController();
  final messages = <ChatMessage>[];
  int? connectedBookingId;
  bool connected = false;

  @override
  void initState() {
    super.initState();
    _connect();
  }

  @override
  void didUpdateWidget(covariant MessagingScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.activeBookingId != oldWidget.activeBookingId) _connect();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppPane(
      title: 'Live Chat',
      subtitle: 'Handles empty state, disabled send, and reconnect when the active booking changes.',
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: BannerCard(
              text: widget.activeBookingId == null
                  ? 'Create a booking first to enable messaging.'
                  : 'Booking #${widget.activeBookingId} ${connected ? "connected" : "waiting for first live event"}',
              isError: false,
            ),
          ),
          Expanded(
            child: messages.isEmpty
                ? const EmptyCard(message: 'Use chat for ETA updates, access clarification, and scope approvals.')
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      final m = messages[index];
                      final own = m.sender == 'customer';
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Align(
                          alignment: own ? Alignment.centerRight : Alignment.centerLeft,
                          child: ChatBubble(message: m.message, sender: own ? 'You' : m.sender, own: own),
                        ),
                      );
                    },
                  ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
            child: GlassCard(
              child: Row(
                children: [
                  Expanded(child: GlassField(controller: controller, label: 'Send a booking message')),
                  const SizedBox(width: 10),
                  FilledButton(onPressed: widget.activeBookingId == null ? null : _send, child: const Text('Send')),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _connect() {
    final bookingId = widget.activeBookingId;
    if (bookingId == null || bookingId == connectedBookingId) return;
    connectedBookingId = bookingId;
    messages.clear();
    connected = false;
    widget.realtime.connect(
      bookingId: bookingId,
      onMessage: (message) {
        if (!mounted) return;
        setState(() {
          messages.add(message);
          connected = true;
        });
      },
    );
  }

  void _send() {
    final bookingId = widget.activeBookingId;
    final text = controller.text.trim();
    if (bookingId == null || text.isEmpty) return;
    final message = ChatMessage(
      bookingId: bookingId,
      sender: 'customer',
      message: text,
      sentAt: DateTime.now(),
    );
    widget.realtime.send(message);
    setState(() {
      messages.add(message);
      controller.clear();
    });
  }
}

class AppPane extends StatelessWidget {
  const AppPane({super.key, required this.title, required this.subtitle, required this.child});

  final String title;
  final String subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                Text(subtitle, style: TextStyle(color: Colors.white.withValues(alpha: 0.76), height: 1.4)),
              ],
            ),
          ),
        ),
        Expanded(child: child),
      ],
    );
  }
}

class ServiceCard extends StatelessWidget {
  const ServiceCard({super.key, required this.service, required this.selected, required this.onTap});
  final ServiceOffering service;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: GlassCard(
        borderColor: selected ? const Color(0xFFE7F88A) : null,
        child: Row(
          children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(service.serviceName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                Text('${service.providerName} · ${service.category} · ${service.estimatedDurationMinutes} min',
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.74))),
              ]),
            ),
            const SizedBox(width: 12),
            Column(children: [
              Text('R${service.price.toStringAsFixed(0)}', style: const TextStyle(color: Color(0xFFE7F88A), fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Icon(selected ? Icons.radio_button_checked : Icons.radio_button_off, color: selected ? const Color(0xFFE7F88A) : Colors.white54),
            ]),
          ],
        ),
      ),
    );
  }
}

class ProviderCard extends StatelessWidget {
  const ProviderCard({super.key, required this.booking, required this.onAction});
  final Booking booking;
  final void Function(String action, String? reason) onAction;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('#${booking.id} ${booking.serviceName}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        Text('${booking.customerName} · ${booking.address}', style: TextStyle(color: Colors.white.withValues(alpha: 0.76))),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            ActionButton(label: 'Accept', onTap: () => onAction('accept', null)),
            ActionButton(label: 'Start', onTap: () => onAction('start', null)),
            ActionButton(label: 'Complete', onTap: () => onAction('complete', null)),
            ActionButton(label: 'Decline', onTap: () => onAction('decline', 'Provider unavailable')),
          ],
        ),
      ]),
    );
  }
}

class PaymentCard extends StatelessWidget {
  const PaymentCard({super.key, required this.payment});
  final PaymentRecord payment;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Payment Snapshot', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
        const SizedBox(height: 10),
        _line('Status', payment.status),
        _line('Gross', 'R${payment.grossAmount.toStringAsFixed(2)}'),
        _line('Commission', 'R${payment.commissionAmount.toStringAsFixed(2)}'),
        _line('Provider net', 'R${payment.providerNetAmount.toStringAsFixed(2)}'),
      ]),
    );
  }

  Widget _line(String label, String value) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Row(
          children: [
            Expanded(child: Text(label, style: const TextStyle(color: Colors.white70))),
            Text(value, style: const TextStyle(color: Colors.white)),
          ],
        ),
      );
}

class BannerCard extends StatelessWidget {
  const BannerCard({super.key, required this.text, required this.isError});
  final String text;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isError ? const Color(0xFFFCC174) : const Color(0xFFE7F88A),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Text(text, style: const TextStyle(color: Color(0xFF203330), fontWeight: FontWeight.w600)),
    );
  }
}

class EmptyCard extends StatelessWidget {
  const EmptyCard({super.key, required this.message});
  final String message;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.all(16),
        child: GlassCard(child: Text(message, style: const TextStyle(color: Colors.white))),
      );
}

class RetryCard extends StatelessWidget {
  const RetryCard({super.key, required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.all(16),
        child: GlassCard(
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(message, style: const TextStyle(color: Colors.white)),
            const SizedBox(height: 12),
            FilledButton(onPressed: onRetry, child: const Text('Retry')),
          ]),
        ),
      );
}

class GlassField extends StatelessWidget {
  const GlassField({super.key, required this.controller, required this.label, this.maxLines = 1});
  final TextEditingController controller;
  final String label;
  final int maxLines;

  @override
  Widget build(BuildContext context) => TextField(
        controller: controller,
        maxLines: maxLines,
        decoration: InputDecoration(
          labelText: label,
          filled: true,
          fillColor: Colors.white.withValues(alpha: 0.08),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(18)),
        ),
      );
}

class GlassCard extends StatelessWidget {
  const GlassCard({super.key, required this.child, this.borderColor});
  final Widget child;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: borderColor ?? Colors.white.withValues(alpha: 0.08)),
          ),
          child: child,
        ),
      ),
    );
  }
}

class ChatBubble extends StatelessWidget {
  const ChatBubble({super.key, required this.message, required this.sender, required this.own});
  final String message;
  final String sender;
  final bool own;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 320),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: own ? const Color(0xFFE7F88A) : Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(sender, style: TextStyle(color: own ? const Color(0xFF203330) : Colors.white70, fontSize: 12, fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        Text(message, style: TextStyle(color: own ? const Color(0xFF203330) : Colors.white)),
      ]),
    );
  }
}

class EdgeChip extends StatelessWidget {
  const EdgeChip({super.key, required this.label});
  final String label;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 12)),
      );
}

class ActionButton extends StatelessWidget {
  const ActionButton({super.key, required this.label, required this.onTap});
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.white,
          side: BorderSide(color: Colors.white.withValues(alpha: 0.14)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        child: Text(label),
      );
}

class AmbientGlow extends StatelessWidget {
  const AmbientGlow({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: const [
        GlowOrb(alignment: Alignment(-1, -0.9), size: 180, color: Color(0x22E7F88A)),
        GlowOrb(alignment: Alignment(1.1, -0.1), size: 220, color: Color(0x18FFFFFF)),
        GlowOrb(alignment: Alignment(-1.1, 0.9), size: 180, color: Color(0x18FFC174)),
      ],
    );
  }
}

class GlowOrb extends StatelessWidget {
  const GlowOrb({super.key, required this.alignment, required this.size, required this.color});
  final Alignment alignment;
  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) => Align(
        alignment: alignment,
        child: ImageFiltered(
          imageFilter: ImageFilter.blur(sigmaX: 36, sigmaY: 36),
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
        ),
      );
}

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
