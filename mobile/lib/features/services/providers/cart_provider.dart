import 'package:flutter_riverpod/flutter_riverpod.dart';

class ServiceItem {
  final int id;
  final String name;
  final String categoryId;
  final int? providerId;
  final String? providerName;
  final String imageUrl;
  final String description;
  final String priceRange;
  final double priceValue;
  final String duration;
  final int? estimatedDurationMinutes;
  final String? pricingType;
  final double rating;
  final bool popular;

  const ServiceItem({
    required this.id,
    required this.name,
    required this.categoryId,
    this.providerId,
    this.providerName,
    required this.imageUrl,
    required this.description,
    required this.priceRange,
    this.priceValue = 0,
    required this.duration,
    this.estimatedDurationMinutes,
    this.pricingType,
    required this.rating,
    this.popular = false,
  });

  ServiceItem copyWith({
    int? id,
    String? name,
    String? categoryId,
    int? providerId,
    String? providerName,
    String? imageUrl,
    String? description,
    String? priceRange,
    double? priceValue,
    String? duration,
    int? estimatedDurationMinutes,
    String? pricingType,
    double? rating,
    bool? popular,
  }) {
    return ServiceItem(
      id: id ?? this.id,
      name: name ?? this.name,
      categoryId: categoryId ?? this.categoryId,
      providerId: providerId ?? this.providerId,
      providerName: providerName ?? this.providerName,
      imageUrl: imageUrl ?? this.imageUrl,
      description: description ?? this.description,
      priceRange: priceRange ?? this.priceRange,
      priceValue: priceValue ?? this.priceValue,
      duration: duration ?? this.duration,
      estimatedDurationMinutes:
          estimatedDurationMinutes ?? this.estimatedDurationMinutes,
      pricingType: pricingType ?? this.pricingType,
      rating: rating ?? this.rating,
      popular: popular ?? this.popular,
    );
  }
}

class CartItem {
  final ServiceItem service;
  final int quantity;
  final String? notes;

  const CartItem({
    required this.service,
    this.quantity = 1,
    this.notes,
  });

  CartItem copyWith({int? quantity, String? notes}) {
    return CartItem(
      service: service,
      quantity: quantity ?? this.quantity,
      notes: notes ?? this.notes,
    );
  }
}

class CartState {
  final List<CartItem> items;

  const CartState({this.items = const []});

  int get itemCount => items.fold(0, (sum, i) => sum + i.quantity);

  bool get isEmpty => items.isEmpty;

  double get totalAmount => items.fold<double>(
      0, (sum, item) => sum + (item.service.priceValue * item.quantity));

  String get cartTotal {
    final total = totalAmount;
    final whole = total.truncateToDouble() == total;
    return whole
        ? 'R${total.toStringAsFixed(0)}'
        : 'R${total.toStringAsFixed(2)}';
  }

  bool containsService(int serviceId) =>
      items.any((i) => i.service.id == serviceId);

  CartState copyWith({List<CartItem>? items}) =>
      CartState(items: items ?? this.items);
}

class CartNotifier extends StateNotifier<CartState> {
  CartNotifier() : super(const CartState());

  void addItem(ServiceItem service, {String? notes}) {
    final idx = state.items.indexWhere((i) => i.service.id == service.id);
    if (idx >= 0) {
      final updated = List<CartItem>.from(state.items);
      updated[idx] = updated[idx].copyWith(quantity: updated[idx].quantity + 1);
      state = state.copyWith(items: updated);
    } else {
      state = state.copyWith(
        items: [...state.items, CartItem(service: service, notes: notes)],
      );
    }
  }

  void removeItem(int serviceId) {
    state = state.copyWith(
      items: state.items.where((i) => i.service.id != serviceId).toList(),
    );
  }

  void updateQuantity(int serviceId, int quantity) {
    if (quantity <= 0) {
      removeItem(serviceId);
      return;
    }
    final updated = state.items.map((i) {
      if (i.service.id == serviceId) return i.copyWith(quantity: quantity);
      return i;
    }).toList();
    state = state.copyWith(items: updated);
  }

  void replaceItem(int currentServiceId, ServiceItem service) {
    final currentIndex =
        state.items.indexWhere((item) => item.service.id == currentServiceId);
    if (currentIndex < 0) {
      return;
    }

    final replacementIndex =
        state.items.indexWhere((item) => item.service.id == service.id);
    final updated = List<CartItem>.from(state.items);
    final currentItem = updated[currentIndex];

    if (replacementIndex >= 0 && replacementIndex != currentIndex) {
      final mergedItem = updated[replacementIndex].copyWith(
        quantity: updated[replacementIndex].quantity + currentItem.quantity,
      );
      updated[replacementIndex] = mergedItem;
      updated.removeAt(currentIndex);
      state = state.copyWith(items: updated);
      return;
    }

    updated[currentIndex] = CartItem(
      service: service,
      quantity: currentItem.quantity,
      notes: currentItem.notes,
    );
    state = state.copyWith(items: updated);
  }

  void clear() => state = const CartState();
}

final cartProvider = StateNotifierProvider<CartNotifier, CartState>(
  (ref) => CartNotifier(),
);
