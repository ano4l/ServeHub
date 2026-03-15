import 'package:flutter/material.dart';
import 'package:serveify/core/theme/app_theme.dart';

class CustomerDemoData {
  static const categoryColors = <Color>[
    AppColors.pastelBlue,
    AppColors.pastelGreen,
    AppColors.pastelYellow,
    AppColors.pastelPink,
    AppColors.pastelPurple,
    AppColors.pastelMint,
    AppColors.pastelOrange,
    AppColors.pastelCyan,
  ];

  static const bannerColors = <Color>[
    AppColors.pastelPurple,
    AppColors.pastelBlue,
    AppColors.pastelGreen,
    AppColors.pastelYellow,
    AppColors.pastelPink,
    AppColors.pastelMint,
    AppColors.pastelCyan,
    AppColors.pastelOrange,
  ];

  static List<Map<String, dynamic>> providers() {
    return const [
      {
        'id': 'provider-1',
        'name': 'Sarah Johnson',
        'category': 'Cleaning',
        'city': 'Cape Town',
        'rating': 4.9,
        'reviews': 342,
        'badge': 'Top Rated',
        'responseTime': '15 min',
        'verified': true,
        'bio': 'Deep cleans, move-out refreshes, and eco-friendly home upkeep.',
      },
      {
        'id': 'provider-2',
        'name': 'Mike Chen',
        'category': 'HVAC',
        'city': 'Johannesburg',
        'rating': 4.8,
        'reviews': 287,
        'badge': 'Fast Response',
        'responseTime': '30 min',
        'verified': true,
        'bio': 'AC installs, repairs, and same-week maintenance for home systems.',
      },
      {
        'id': 'provider-3',
        'name': 'Nina Styles',
        'category': 'Hair',
        'city': 'Pretoria',
        'rating': 4.9,
        'reviews': 201,
        'badge': 'Popular',
        'responseTime': '25 min',
        'verified': true,
        'bio': 'Braids, silk press, and at-home styling for events and everyday looks.',
      },
      {
        'id': 'provider-4',
        'name': 'Lebo Mokoena',
        'category': 'Makeup',
        'city': 'Sandton',
        'rating': 5.0,
        'reviews': 156,
        'badge': 'Master',
        'responseTime': '10 min',
        'verified': true,
        'bio': 'Soft glam, bridal, and content-ready makeup with pro-grade products.',
      },
      {
        'id': 'provider-5',
        'name': 'Paws & Bubbles',
        'category': 'Dog Washing',
        'city': 'Durban',
        'rating': 4.7,
        'reviews': 118,
        'badge': 'Pet Friendly',
        'responseTime': '20 min',
        'verified': true,
        'bio': 'Gentle wash, brush-out, and coat refresh for dogs of every size.',
      },
      {
        'id': 'provider-6',
        'name': 'Bluewater Pros',
        'category': 'Pool Cleaning',
        'city': 'Midrand',
        'rating': 4.8,
        'reviews': 94,
        'badge': 'Weekly Plans',
        'responseTime': '40 min',
        'verified': true,
        'bio': 'Pool balancing, cleaning, and regular maintenance with clear pricing.',
      },
    ];
  }

  static List<Map<String, dynamic>> services() {
    return [
      {
        'id': 'service-1',
        'title': 'Professional Home Cleaning',
        'description': 'A spotless home reset with kitchen, bathrooms, and living areas handled in one visit.',
        'category': 'Cleaning',
        'provider': 'Sarah Johnson',
        'priceLabel': 'From R450',
        'durationLabel': '2 hrs',
        'availability': 'Available today',
        'tags': ['Eco-friendly', 'Insured', 'Same-day'],
        'rating': 4.9,
        'reviews': 342,
        'verified': true,
      },
      {
        'id': 'service-2',
        'title': 'Silk Press & Styling',
        'description': 'At-home wash, prep, and polished styling with heat protection and finish options.',
        'category': 'Hair',
        'provider': 'Nina Styles',
        'priceLabel': 'From R380',
        'durationLabel': '90 min',
        'availability': 'Tomorrow morning',
        'tags': ['Home visit', 'Natural hair', 'Events'],
        'rating': 4.9,
        'reviews': 201,
        'verified': true,
      },
      {
        'id': 'service-3',
        'title': 'Bridal Soft Glam',
        'description': 'Full-face glam, lashes, and touch-up kit prep for weddings and celebrations.',
        'category': 'Makeup',
        'provider': 'Lebo Mokoena',
        'priceLabel': 'From R650',
        'durationLabel': '75 min',
        'availability': 'This weekend',
        'tags': ['Bridal', 'Premium', 'Long wear'],
        'rating': 5.0,
        'reviews': 156,
        'verified': true,
      },
      {
        'id': 'service-4',
        'title': 'Dog Wash & Brush-Out',
        'description': 'Warm wash, dry, and light grooming with pet-safe products that keep coats fresh.',
        'category': 'Dog Washing',
        'provider': 'Paws & Bubbles',
        'priceLabel': 'From R220',
        'durationLabel': '45 min',
        'availability': 'Available now',
        'tags': ['Mobile service', 'Pet-safe', 'Quick visit'],
        'rating': 4.7,
        'reviews': 118,
        'verified': true,
      },
      {
        'id': 'service-5',
        'title': 'Weekly Pool Refresh',
        'description': 'Skim, vacuum, water test, and chemical balance for a clean and swimmable pool.',
        'category': 'Pool Cleaning',
        'provider': 'Bluewater Pros',
        'priceLabel': 'From R540',
        'durationLabel': '1 hr',
        'availability': 'Next slot Thursday',
        'tags': ['Weekly plans', 'Reliable', 'Family homes'],
        'rating': 4.8,
        'reviews': 94,
        'verified': true,
      },
      {
        'id': 'service-6',
        'title': 'Dog Walking Routine',
        'description': 'Trusted neighborhood walks with updates, photos, and repeat scheduling options.',
        'category': 'Dog Walking',
        'provider': 'Happy Tails Walkers',
        'priceLabel': 'From R180',
        'durationLabel': '30 min',
        'availability': 'Today at 5 PM',
        'tags': ['Tracked route', 'Photos', 'Recurring'],
        'rating': 4.8,
        'reviews': 132,
        'verified': true,
      },
    ];
  }

  static List<Map<String, dynamic>> bookings() {
    final now = DateTime.now();
    return [
      {
        'id': 'booking-1',
        'service': 'Professional Home Cleaning',
        'provider': 'Sarah Johnson',
        'status': 'IN_PROGRESS',
        'scheduledAt': now.add(const Duration(hours: 2)).toIso8601String(),
        'price': 'R450',
        'address': '14 Glen Road, Cape Town',
        'thread': [
          {'id': 'm1', 'sender': 'Sarah Johnson', 'text': 'I am finishing my previous job and will head over in 20 minutes.', 'time': '5 min ago', 'own': false},
          {'id': 'm2', 'sender': 'You', 'text': 'Perfect, please ring the side gate on arrival.', 'time': 'Now', 'own': true},
        ],
      },
      {
        'id': 'booking-2',
        'service': 'Bridal Soft Glam',
        'provider': 'Lebo Mokoena',
        'status': 'ACCEPTED',
        'scheduledAt': now.add(const Duration(days: 1, hours: 4)).toIso8601String(),
        'price': 'R650',
        'address': '18 Parkview Drive, Sandton',
        'thread': [
          {'id': 'm3', 'sender': 'Lebo Mokoena', 'text': 'Please send your reference look so I can match the finish.', 'time': '18 min ago', 'own': false},
        ],
      },
      {
        'id': 'booking-3',
        'service': 'Dog Walk Routine',
        'provider': 'Happy Tails Walkers',
        'status': 'REQUESTED',
        'scheduledAt': now.add(const Duration(days: 2)).toIso8601String(),
        'price': 'R180',
        'address': '25 Hillcrest Ave, Pretoria',
        'thread': [],
      },
      {
        'id': 'booking-4',
        'service': 'Weekly Pool Refresh',
        'provider': 'Bluewater Pros',
        'status': 'COMPLETED',
        'scheduledAt': now.subtract(const Duration(days: 2)).toIso8601String(),
        'price': 'R540',
        'address': '7 Palm Estate, Midrand',
        'thread': [
          {'id': 'm4', 'sender': 'Bluewater Pros', 'text': 'Water chemistry is balanced and the filter is clean.', 'time': '2 days ago', 'own': false},
        ],
      },
    ];
  }

  static List<Map<String, dynamic>> notifications() {
    final now = DateTime.now();
    return [
      {
        'id': 'notification-1',
        'title': 'Booking Accepted',
        'message': 'Lebo Mokoena accepted your makeup booking for tomorrow morning.',
        'createdAt': now.subtract(const Duration(minutes: 12)).toIso8601String(),
        'kind': 'booking',
        'read': false,
        'action': 'Open',
      },
      {
        'id': 'notification-2',
        'title': 'New Message',
        'message': 'Sarah Johnson sent an update on your cleaning appointment.',
        'createdAt': now.subtract(const Duration(hours: 1)).toIso8601String(),
        'kind': 'message',
        'read': false,
        'action': 'Reply',
      },
      {
        'id': 'notification-3',
        'title': 'Payment Required',
        'message': 'Your pool cleaning invoice is ready for payment.',
        'createdAt': now.subtract(const Duration(hours: 4)).toIso8601String(),
        'kind': 'payment',
        'read': true,
        'action': 'Pay Now',
      },
      {
        'id': 'notification-4',
        'title': 'Rate Your Experience',
        'message': 'How was your last dog wash appointment? Leave a quick review.',
        'createdAt': now.subtract(const Duration(days: 1)).toIso8601String(),
        'kind': 'review',
        'read': true,
        'action': 'Rate',
      },
    ];
  }

  static const profileSections = <Map<String, dynamic>>[
    {
      'title': 'Account',
      'items': ['Edit Profile', 'Saved Addresses', 'Notifications'],
    },
    {
      'title': 'Activity',
      'items': ['My Reviews', 'Payment Methods', 'Support Tickets'],
    },
    {
      'title': 'Support',
      'items': ['Help Center', 'Privacy Policy', 'Terms of Service'],
    },
  ];
}
