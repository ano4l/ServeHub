import 'dart:convert';

import 'package:stomp_dart_client/stomp_dart_client.dart';

import 'models.dart';

class RealtimeMessagingClient {
  RealtimeMessagingClient({
    this.wsUrl = 'ws://localhost:8080/api/v1/ws',
  });

  final String wsUrl;
  StompClient? _client;

  void connect({
    required int bookingId,
    required void Function(ChatMessage message) onMessage,
  }) {
    _client?.deactivate();
    _client = StompClient(
      config: StompConfig.sockJS(
        url: wsUrl.replaceFirst('ws://', 'http://'),
        onConnect: (frame) {
          _client?.subscribe(
            destination: '/topic/bookings/$bookingId',
            callback: (message) {
              final body = message.body;
              if (body == null) return;
              onMessage(ChatMessage.fromJson(jsonDecode(body) as Map<String, dynamic>));
            },
          );
        },
      ),
    )..activate();
  }

  void send(ChatMessage message) {
    _client?.send(
      destination: '/app/bookings/${message.bookingId}/chat',
      body: jsonEncode(message.toJson()),
    );
  }

  void dispose() {
    _client?.deactivate();
  }
}
