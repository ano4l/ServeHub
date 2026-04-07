import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/config/env.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/network/stomp_service.dart';
import 'package:serveify/core/theme/app_theme.dart';
import 'package:serveify/features/auth/providers/auth_provider.dart';
import 'package:stomp_dart_client/stomp_dart_client.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final int bookingId;
  const ChatScreen({super.key, required this.bookingId});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  List<Map<String, dynamic>> _messages = [];
  bool _loading = true;
  void Function()? _stompUnsubscribe;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _loadMessages();
    if (!Env.testMode) {
      _connectStomp();
    } else {
      // In test mode, fall back to polling
      _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) => _loadMessages());
    }
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _stompUnsubscribe?.call();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _connectStomp() {
    final stomp = ref.read(stompServiceProvider);
    _stompUnsubscribe = stomp.subscribe(
      '/user/queue/bookings/${widget.bookingId}/chat',
      _onStompMessage,
    );
  }

  void _onStompMessage(StompFrame frame) {
    if (frame.body == null) return;
    try {
      final data = jsonDecode(frame.body!) as Map<String, dynamic>;
      _mergeMessage(Map<String, dynamic>.from(data));
    } catch (_) {}
  }

  void _mergeMessage(Map<String, dynamic> message) {
    if (!mounted) {
      return;
    }

    setState(() {
      final messageId = message['id'];
      final clientMessageId = message['clientMessageId']?.toString();
      final existingIndex = _messages.indexWhere((item) {
        final sameId = messageId != null && item['id'] == messageId;
        final sameClientId = clientMessageId != null &&
            clientMessageId.isNotEmpty &&
            item['clientMessageId']?.toString() == clientMessageId;
        return sameId || sameClientId;
      });

      final merged = {
        if (existingIndex >= 0) ..._messages[existingIndex],
        ...message,
        'pending': false,
      };

      if (existingIndex >= 0) {
        _messages[existingIndex] = merged;
      } else {
        _messages.add(merged);
      }

      _messages.sort(_compareMessages);
    });
    _scrollToBottom();
  }

  int _compareMessages(Map<String, dynamic> a, Map<String, dynamic> b) {
    final left = DateTime.tryParse(a['sentAt']?.toString() ?? '');
    final right = DateTime.tryParse(b['sentAt']?.toString() ?? '');
    if (left == null && right == null) {
      return 0;
    }
    if (left == null) {
      return -1;
    }
    if (right == null) {
      return 1;
    }
    return left.compareTo(right);
  }

  Future<void> _loadMessages() async {
    try {
      final dio = ref.read(dioProvider);
      final response = await dio.get(
        '/bookings/${widget.bookingId}/messages',
        queryParameters: {'size': 100},
      );
      final List content;
      if (response.data is Map && response.data['content'] != null) {
        content = response.data['content'] as List;
      } else if (response.data is List) {
        content = response.data as List;
      } else {
        content = [];
      }
      if (mounted) {
        final messages = content
            .whereType<Map>()
            .map((item) => Map<String, dynamic>.from(item))
            .toList()
          ..sort(_compareMessages);
        setState(() {
          _messages = messages;
          _loading = false;
        });
        _scrollToBottom();
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    final auth = ref.read(authProvider);
    final userId = int.tryParse(auth.userId ?? '');
    if (userId == null) return;

    final clientMessageId = DateTime.now().microsecondsSinceEpoch.toString();
    _messageController.clear();

    setState(() {
      _messages.add({
        'id': null,
        'clientMessageId': clientMessageId,
        'senderId': userId,
        'senderName': 'You',
        'content': text,
        'sentAt': DateTime.now().toIso8601String(),
        'pending': true,
      });
      _messages.sort(_compareMessages);
    });
    _scrollToBottom();

    final stomp = ref.read(stompServiceProvider);
    try {
      if (!Env.testMode && stomp.isConnected) {
        stomp.send('/app/bookings/${widget.bookingId}/chat', {
          'bookingId': widget.bookingId,
          'message': text,
          'clientMessageId': clientMessageId,
        });
        return;
      }

      final response = await ref.read(dioProvider).post(
        '/bookings/${widget.bookingId}/messages',
        data: {
          'content': text,
          'clientMessageId': clientMessageId,
        },
      );
      if (response.data is Map) {
        _mergeMessage(Map<String, dynamic>.from(response.data as Map));
      }
    } on DioException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _messages.removeWhere(
          (message) => message['clientMessageId']?.toString() == clientMessageId,
        );
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ApiException.fromDioError(error).message)),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _messages.removeWhere(
          (message) => message['clientMessageId']?.toString() == clientMessageId,
        );
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString())),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final currentUserId = int.tryParse(auth.userId ?? '') ?? -1;

    return Scaffold(
      appBar: AppBar(
        title: Text('Booking #${widget.bookingId}'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty
                    ? const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.chat_bubble_outline, size: 48, color: AppColors.textMuted),
                            SizedBox(height: 12),
                            Text('No messages yet', style: TextStyle(color: AppColors.textSecondary)),
                            SizedBox(height: 4),
                            Text('Start the conversation!', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        itemCount: _messages.length,
                        itemBuilder: (_, i) {
                          final msg = _messages[i];
                          final isMe = msg['senderId'] == currentUserId;
                          return _MessageBubble(
                            content: msg['content']?.toString() ?? '',
                            senderName: msg['senderName']?.toString() ?? '',
                            sentAt: msg['sentAt']?.toString() ?? '',
                            isMe: isMe,
                            pending: msg['pending'] == true,
                          );
                        },
                      ),
          ),
          _MessageInput(
            controller: _messageController,
            onSend: _sendMessage,
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final String content;
  final String senderName;
  final String sentAt;
  final bool isMe;
  final bool pending;

  const _MessageBubble({
    required this.content,
    required this.senderName,
    required this.sentAt,
    required this.isMe,
    required this.pending,
  });

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isMe
              ? AppColors.accent.withValues(alpha: pending ? 0.55 : 0.8)
              : AppColors.surfaceAlt,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: isMe ? const Radius.circular(16) : const Radius.circular(4),
            bottomRight: isMe ? const Radius.circular(4) : const Radius.circular(16),
          ),
        ),
        child: Column(
          crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            if (!isMe)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(senderName,
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600,
                        color: isMe ? Colors.white70 : AppColors.textSecondary)),
              ),
            Text(content, style: TextStyle(color: isMe ? Colors.white : AppColors.textPrimary, fontSize: 14)),
            const SizedBox(height: 4),
            Text(_formatTime(sentAt),
                style: TextStyle(fontSize: 10, color: isMe ? Colors.white54 : AppColors.textMuted)),
            if (pending)
              const Padding(
                padding: EdgeInsets.only(top: 2),
                child: Text(
                  'Sending...',
                  style: TextStyle(fontSize: 10, color: Colors.white70),
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _formatTime(String iso) {
    try {
      final dt = DateTime.parse(iso);
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return '';
    }
  }
}

class _MessageInput extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onSend;
  const _MessageInput({required this.controller, required this.onSend});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 16, right: 8, top: 8,
        bottom: MediaQuery.of(context).padding.bottom + 8,
      ),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        border: const Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              decoration: InputDecoration(
                hintText: 'Type a message...',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                filled: true,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              ),
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => onSend(),
              maxLines: 4,
              minLines: 1,
            ),
          ),
          const SizedBox(width: 4),
          IconButton.filled(
            onPressed: onSend,
            icon: const Icon(Icons.send, size: 20),
            style: IconButton.styleFrom(backgroundColor: AppColors.accent, foregroundColor: Colors.white),
          ),
        ],
      ),
    );
  }
}
