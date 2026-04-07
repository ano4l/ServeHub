import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/config/env.dart';
import 'package:serveify/core/storage/secure_storage.dart';
import 'package:stomp_dart_client/stomp_dart_client.dart';

final stompServiceProvider = Provider<StompService>((ref) {
  final storage = ref.read(secureStorageProvider);
  return StompService(storage);
});

class StompService {
  final SecureStorageService _storage;
  StompClient? _client;
  bool _connected = false;
  final Map<String, Map<int, void Function(StompFrame)>> _listeners = {};
  final Map<String, StompUnsubscribe> _activeSubscriptions = {};
  int _listenerSeed = 0;

  StompService(this._storage);

  bool get isConnected => _connected;

  Future<void> connect() async {
    if (_client != null) {
      return;
    }

    final token = await _storage.getAccessToken();
    final stompHeaders = <String, String>{};
    final socketHeaders = <String, dynamic>{};
    if (token != null && token.isNotEmpty) {
      stompHeaders['Authorization'] = 'Bearer $token';
      socketHeaders['Authorization'] = 'Bearer $token';
    }

    _client = StompClient(
      config: StompConfig.sockJS(
        url: Env.wsUrl,
        stompConnectHeaders: stompHeaders,
        webSocketConnectHeaders: socketHeaders,
        reconnectDelay: const Duration(seconds: 5),
        connectionTimeout: const Duration(seconds: 10),
        heartbeatIncoming: const Duration(seconds: 10),
        heartbeatOutgoing: const Duration(seconds: 10),
        onConnect: _onConnect,
        onDisconnect: _onDisconnect,
        onStompError: (_) {
          _connected = false;
          _activeSubscriptions.clear();
        },
        onWebSocketError: (_) {
          _connected = false;
          _activeSubscriptions.clear();
        },
        onWebSocketDone: () {
          _connected = false;
          _activeSubscriptions.clear();
        },
      ),
    );

    _client!.activate();
  }

  void _onConnect(StompFrame frame) {
    _connected = true;
    _activeSubscriptions.clear();
    for (final destination in _listeners.keys.toList()) {
      _ensureSubscription(destination);
    }
  }

  void _onDisconnect(StompFrame frame) {
    _connected = false;
    _activeSubscriptions.clear();
  }

  void Function() subscribe(
    String destination,
    void Function(StompFrame) callback,
  ) {
    final listenerId = _listenerSeed++;
    final listeners = _listeners.putIfAbsent(destination, () => {});
    listeners[listenerId] = callback;

    if (_connected) {
      _ensureSubscription(destination);
    } else {
      unawaited(connect().catchError((_) {}));
    }

    return () {
      final destinationListeners = _listeners[destination];
      if (destinationListeners == null) {
        return;
      }

      destinationListeners.remove(listenerId);
      if (destinationListeners.isEmpty) {
        _listeners.remove(destination);
        _activeSubscriptions.remove(destination)?.call();
      }
    };
  }

  void _ensureSubscription(String destination) {
    if (!_connected || _client == null || _activeSubscriptions.containsKey(destination)) {
      return;
    }

    final listeners = _listeners[destination];
    if (listeners == null || listeners.isEmpty) {
      return;
    }

    _activeSubscriptions[destination] = _client!.subscribe(
      destination: destination,
      callback: (frame) {
        final callbacks = _listeners[destination]?.values.toList() ?? const [];
        for (final listener in callbacks) {
          listener(frame);
        }
      },
    );
  }

  void send(String destination, Map<String, dynamic> body) {
    if (_client == null || !_connected) {
      return;
    }

    _client!.send(
      destination: destination,
      body: jsonEncode(body),
    );
  }

  void disconnect() {
    for (final unsubscribe in _activeSubscriptions.values.toList()) {
      unsubscribe();
    }
    _activeSubscriptions.clear();
    _listeners.clear();
    _connected = false;
    _client?.deactivate();
    _client = null;
  }
}
