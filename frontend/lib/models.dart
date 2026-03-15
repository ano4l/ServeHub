enum BookingStatus {
  requested,
  accepted,
  inProgress,
  completed,
  declined,
  expired,
  cancelled,
  reviewable,
}

BookingStatus bookingStatusFromApi(String value) {
  switch (value) {
    case 'REQUESTED':
      return BookingStatus.requested;
    case 'ACCEPTED':
      return BookingStatus.accepted;
    case 'IN_PROGRESS':
      return BookingStatus.inProgress;
    case 'COMPLETED':
      return BookingStatus.completed;
    case 'DECLINED':
      return BookingStatus.declined;
    case 'EXPIRED':
      return BookingStatus.expired;
    case 'CANCELLED':
      return BookingStatus.cancelled;
    case 'REVIEWABLE':
      return BookingStatus.reviewable;
    default:
      return BookingStatus.requested;
  }
}

String bookingStatusToApi(BookingStatus value) {
  switch (value) {
    case BookingStatus.requested:
      return 'REQUESTED';
    case BookingStatus.accepted:
      return 'ACCEPTED';
    case BookingStatus.inProgress:
      return 'IN_PROGRESS';
    case BookingStatus.completed:
      return 'COMPLETED';
    case BookingStatus.declined:
      return 'DECLINED';
    case BookingStatus.expired:
      return 'EXPIRED';
    case BookingStatus.cancelled:
      return 'CANCELLED';
    case BookingStatus.reviewable:
      return 'REVIEWABLE';
  }
}

class ServiceOffering {
  final int id;
  final int providerId;
  final String providerName;
  final String category;
  final String serviceName;
  final String pricingType;
  final double price;
  final int estimatedDurationMinutes;

  const ServiceOffering({
    required this.id,
    required this.providerId,
    required this.providerName,
    required this.category,
    required this.serviceName,
    required this.pricingType,
    required this.price,
    required this.estimatedDurationMinutes,
  });

  factory ServiceOffering.fromJson(Map<String, dynamic> json) {
    return ServiceOffering(
      id: json['id'] as int,
      providerId: json['providerId'] as int,
      providerName: json['providerName'] as String,
      category: json['category'] as String,
      serviceName: json['serviceName'] as String,
      pricingType: json['pricingType'] as String,
      price: (json['price'] as num).toDouble(),
      estimatedDurationMinutes: json['estimatedDurationMinutes'] as int,
    );
  }
}

class AuthSession {
  final int userId;
  final int? providerId;
  final String email;
  final String role;
  final String accessToken;
  final String refreshToken;

  const AuthSession({
    required this.userId,
    required this.providerId,
    required this.email,
    required this.role,
    required this.accessToken,
    required this.refreshToken,
  });

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      userId: json['userId'] as int,
      providerId: json['providerId'] as int?,
      email: json['email'] as String,
      role: json['role'] as String,
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
    );
  }
}

class Booking {
  final int id;
  final BookingStatus status;
  final String customerName;
  final String providerName;
  final String serviceName;
  final String address;
  final String? notes;
  final DateTime scheduledFor;
  final double quotedPrice;

  const Booking({
    required this.id,
    required this.status,
    required this.customerName,
    required this.providerName,
    required this.serviceName,
    required this.address,
    required this.notes,
    required this.scheduledFor,
    required this.quotedPrice,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'] as int,
      status: bookingStatusFromApi(json['status'] as String),
      customerName: json['customerName'] as String,
      providerName: json['providerName'] as String,
      serviceName: json['serviceName'] as String,
      address: json['address'] as String,
      notes: json['notes'] as String?,
      scheduledFor: DateTime.parse(json['scheduledFor'] as String),
      quotedPrice: (json['quotedPrice'] as num).toDouble(),
    );
  }
}

class PaymentRecord {
  final String status;
  final double grossAmount;
  final double commissionAmount;
  final double providerNetAmount;
  final String reference;

  const PaymentRecord({
    required this.status,
    required this.grossAmount,
    required this.commissionAmount,
    required this.providerNetAmount,
    required this.reference,
  });

  factory PaymentRecord.fromJson(Map<String, dynamic> json) {
    return PaymentRecord(
      status: json['status'] as String,
      grossAmount: (json['grossAmount'] as num).toDouble(),
      commissionAmount: (json['commissionAmount'] as num).toDouble(),
      providerNetAmount: (json['providerNetAmount'] as num).toDouble(),
      reference: json['reference'] as String,
    );
  }
}

class ChatMessage {
  final int bookingId;
  final String sender;
  final String message;
  final DateTime sentAt;

  const ChatMessage({
    required this.bookingId,
    required this.sender,
    required this.message,
    required this.sentAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      bookingId: json['bookingId'] as int,
      sender: json['sender'] as String,
      message: json['message'] as String,
      sentAt: DateTime.parse(json['sentAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'bookingId': bookingId,
      'sender': sender,
      'message': message,
      'sentAt': sentAt.toIso8601String(),
    };
  }
}
