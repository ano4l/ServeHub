import 'package:flutter_riverpod/flutter_riverpod.dart';

class ServiceItem {
  final int id;
  final String name;
  final String categoryId;
  final String imageUrl;
  final String description;
  final String priceRange;
  final String duration;
  final double rating;
  final bool popular;

  const ServiceItem({
    required this.id,
    required this.name,
    required this.categoryId,
    required this.imageUrl,
    required this.description,
    required this.priceRange,
    required this.duration,
    required this.rating,
    this.popular = false,
  });
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

  String get cartTotal {
    final total = items.fold<int>(0, (sum, item) {
      final match = RegExp(r'R\s*([\d\s]+)').firstMatch(item.service.priceRange);
      final price = match != null
          ? int.tryParse(match.group(1)!.replaceAll(' ', '')) ?? 0
          : 0;
      return sum + (price * item.quantity);
    });
    return 'R$total';
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

  void clear() => state = const CartState();
}

final cartProvider = StateNotifierProvider<CartNotifier, CartState>(
  (ref) => CartNotifier(),
);
