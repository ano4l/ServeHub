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
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFE7F88A)),
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
  String? error;

  @override
  void dispose() {
    realtime.dispose();
    super.dispose();
  }

  Future<void> loginAs(String email) async {
    setState(() => error = null);
    try {
      final nextSession = await api.login(email: email, password: 'password');
      setState(() => session = nextSession);
    } catch (exception) {
      setState(() => error = exception.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      BookingFlowScreen(
        api: api,
        session: session,
        onBookingCreated: (booking) => setState(() => activeBookingId = booking.id),
      ),
      ProviderDashboardScreen(
        api: api,
        session: session,
      ),
      MessagingScreen(
        realtime: realtime,
        activeBookingId: activeBookingId,
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('ServeHub Mobile'),
        actions: [
          TextButton(
            onPressed: () => loginAs('customer@servehub.dev'),
            child: const Text('Demo Customer'),
          ),
          TextButton(
            onPressed: () => loginAs('provider@servehub.dev'),
            child: const Text('Demo Provider'),
          ),
        ],
      ),
      body: Column(
        children: [
          if (session != null || error != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              color: error == null ? const Color(0xFFE7F88A) : const Color(0xFFFCC174),
              child: Text(
                error ??
                    'Signed in as ${session!.email} (${session!.role})${session!.providerId == null ? '' : ' · providerId ${session!.providerId}'}',
              ),
            ),
          Expanded(child: pages[selectedIndex]),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: (index) => setState(() => selectedIndex = index),
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
  final addressController = TextEditingController(text: '12 West Road South, Sandton');
  final notesController = TextEditingController(text: 'Gate code 2291. Ring once.');
  int? selectedServiceId;
  String? feedback;

  @override
  void dispose() {
    addressController.dispose();
    notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<ServiceOffering>>(
      future: widget.api.fetchServices(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text('Failed to load services: ${snapshot.error}'));
        }

        final services = snapshot.data ?? [];
        final selected = services.where((item) => item.id == selectedServiceId).firstOrNull ?? (services.isNotEmpty ? services.first : null);
        selectedServiceId ??= selected?.id;

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('Book a Service', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            const Text('Real API-backed booking creation and payment initialization.'),
            const SizedBox(height: 16),
            for (final service in services)
              Card(
                child: RadioListTile<int>(
                  value: service.id,
                  groupValue: selectedServiceId,
                  onChanged: (value) => setState(() => selectedServiceId = value),
                  title: Text(service.serviceName),
                  subtitle: Text('${service.providerName} · ${service.category} · ${service.estimatedDurationMinutes} min'),
                  secondary: Text('R${service.price.toStringAsFixed(0)}'),
                ),
              ),
            const SizedBox(height: 12),
            TextField(
              controller: addressController,
              decoration: const InputDecoration(
                labelText: 'Service address',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: notesController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Notes',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: widget.session == null || selected == null
                  ? null
                  : () async {
                      try {
                        final booking = await widget.api.createBooking(
                          token: widget.session!.accessToken,
                          customerId: widget.session!.userId,
                          providerId: selected.providerId,
                          serviceOfferingId: selected.id,
                          scheduledFor: DateTime.now().add(const Duration(hours: 2)),
                          address: addressController.text,
                          notes: notesController.text,
                        );
                        widget.onBookingCreated(booking);
                        setState(() => feedback = 'Booking #${booking.id} created at ${booking.scheduledFor}.');
                      } catch (exception) {
                        setState(() => feedback = exception.toString());
                      }
                    },
              child: const Text('Create Booking'),
            ),
            if (feedback != null) ...[
              const SizedBox(height: 12),
              Text(feedback!),
            ],
          ],
        );
      },
    );
  }
}

class ProviderDashboardScreen extends StatefulWidget {
  const ProviderDashboardScreen({
    super.key,
    required this.api,
    required this.session,
  });

  final ServeHubApiClient api;
  final AuthSession? session;

  @override
  State<ProviderDashboardScreen> createState() => _ProviderDashboardScreenState();
}

class _ProviderDashboardScreenState extends State<ProviderDashboardScreen> {
  String? feedback;

  @override
  Widget build(BuildContext context) {
    if (widget.session == null) {
      return const Center(child: Text('Sign in as the demo provider to manage bookings.'));
    }

    return FutureBuilder<List<Booking>>(
      future: widget.api.fetchBookings(widget.session!.accessToken),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text('Failed to load bookings: ${snapshot.error}'));
        }
        final bookings = snapshot.data ?? [];

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('Provider Dashboard', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            const Text('Accept, start, and complete bookings using the backend workflow endpoints.'),
            if (feedback != null) ...[
              const SizedBox(height: 12),
              Text(feedback!),
            ],
            const SizedBox(height: 12),
            for (final booking in bookings)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('#${booking.id} ${booking.serviceName}', style: const TextStyle(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text('${booking.customerName} · ${booking.providerName}'),
                      Text(booking.address),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          OutlinedButton(
                            onPressed: () => _runAction(booking.id, 'accept'),
                            child: const Text('Accept'),
                          ),
                          OutlinedButton(
                            onPressed: () => _runAction(booking.id, 'start'),
                            child: const Text('Start'),
                          ),
                          OutlinedButton(
                            onPressed: () => _runAction(booking.id, 'complete'),
                            child: const Text('Complete'),
                          ),
                          OutlinedButton(
                            onPressed: () => _runAction(booking.id, 'decline', reason: 'Provider unavailable'),
                            child: const Text('Decline'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  Future<void> _runAction(int bookingId, String action, {String? reason}) async {
    try {
      final booking = await widget.api.triggerBookingAction(
        token: widget.session!.accessToken,
        bookingId: bookingId,
        action: action,
        reason: reason,
      );
      setState(() => feedback = 'Booking #${booking.id} is now ${booking.status.name}.');
    } catch (exception) {
      setState(() => feedback = exception.toString());
    }
  }
}

class MessagingScreen extends StatefulWidget {
  const MessagingScreen({
    super.key,
    required this.realtime,
    required this.activeBookingId,
  });

  final RealtimeMessagingClient realtime;
  final int? activeBookingId;

  @override
  State<MessagingScreen> createState() => _MessagingScreenState();
}

class _MessagingScreenState extends State<MessagingScreen> {
  final controller = TextEditingController();
  final messages = <ChatMessage>[];
  bool connected = false;

  @override
  void didUpdateWidget(covariant MessagingScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.activeBookingId != null && widget.activeBookingId != oldWidget.activeBookingId) {
      widget.realtime.connect(
        bookingId: widget.activeBookingId!,
        onMessage: (message) {
          if (mounted) {
            setState(() {
              messages.add(message);
              connected = true;
            });
          }
        },
      );
    }
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bookingId = widget.activeBookingId;
    return Column(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          color: const Color(0xFFEFF2F1),
          child: Text(
            bookingId == null
                ? 'Create a booking first to open the chat thread.'
                : 'Booking #$bookingId chat ${connected ? "connected" : "ready"}',
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: messages.length,
            itemBuilder: (context, index) {
              final message = messages[index];
              return Align(
                alignment: message.sender == 'customer' ? Alignment.centerRight : Alignment.centerLeft,
                child: Card(
                  color: message.sender == 'customer' ? const Color(0xFFE7F88A) : null,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text('${message.sender}: ${message.message}'),
                  ),
                ),
              );
            },
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  decoration: const InputDecoration(
                    hintText: 'Send a booking message',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              FilledButton(
                onPressed: bookingId == null
                    ? null
                    : () {
                        final message = ChatMessage(
                          bookingId: bookingId,
                          sender: 'customer',
                          message: controller.text,
                          sentAt: DateTime.now(),
                        );
                        widget.realtime.send(message);
                        setState(() {
                          messages.add(message);
                          controller.clear();
                        });
                      },
                child: const Text('Send'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
