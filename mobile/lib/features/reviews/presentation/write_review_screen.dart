import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:serveify/core/network/api_client.dart';
import 'package:serveify/core/theme/app_theme.dart';

class WriteReviewScreen extends ConsumerStatefulWidget {
  final int bookingId;
  const WriteReviewScreen({super.key, required this.bookingId});

  @override
  ConsumerState<WriteReviewScreen> createState() => _WriteReviewScreenState();
}

class _WriteReviewScreenState extends ConsumerState<WriteReviewScreen> {
  int _rating = 0;
  int _communicationRating = 0;
  int _qualityRating = 0;
  int _valueRating = 0;
  final _commentController = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_rating == 0) {
      setState(() => _error = 'Please select an overall rating');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await ref.read(dioProvider).post('/reviews', data: {
        'bookingId': widget.bookingId,
        'rating': _rating,
        'communicationRating': _communicationRating > 0 ? _communicationRating : null,
        'qualityRating': _qualityRating > 0 ? _qualityRating : null,
        'valueRating': _valueRating > 0 ? _valueRating : null,
        'comment': _commentController.text.trim().isEmpty ? null : _commentController.text.trim(),
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Review submitted!'), backgroundColor: AppColors.success),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Write Review')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('How was your experience?',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            const Text('Your feedback helps improve services for everyone.',
                style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 24),

            if (_error != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
              ),

            // Overall rating
            _RatingSection(
              label: 'Overall Rating *',
              rating: _rating,
              onChanged: (r) => setState(() => _rating = r),
              size: 40,
            ),
            const SizedBox(height: 20),

            // Sub-ratings
            _RatingSection(
              label: 'Communication',
              rating: _communicationRating,
              onChanged: (r) => setState(() => _communicationRating = r),
            ),
            const SizedBox(height: 12),
            _RatingSection(
              label: 'Quality of Work',
              rating: _qualityRating,
              onChanged: (r) => setState(() => _qualityRating = r),
            ),
            const SizedBox(height: 12),
            _RatingSection(
              label: 'Value for Money',
              rating: _valueRating,
              onChanged: (r) => setState(() => _valueRating = r),
            ),
            const SizedBox(height: 24),

            // Comment
            const Text('Comment (optional)',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            const SizedBox(height: 8),
            TextField(
              controller: _commentController,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: 'Share details of your experience...',
              ),
            ),
            const SizedBox(height: 32),

            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const SizedBox(
                        width: 20, height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Submit Review'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RatingSection extends StatelessWidget {
  final String label;
  final int rating;
  final ValueChanged<int> onChanged;
  final double size;

  const _RatingSection({
    required this.label,
    required this.rating,
    required this.onChanged,
    this.size = 32,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 6),
        Row(
          children: List.generate(5, (i) {
            final starIndex = i + 1;
            return GestureDetector(
              onTap: () => onChanged(starIndex),
              child: Padding(
                padding: const EdgeInsets.only(right: 4),
                child: Icon(
                  starIndex <= rating ? Icons.star : Icons.star_border,
                  color: starIndex <= rating ? Colors.amber : AppColors.textMuted,
                  size: size,
                ),
              ),
            );
          }),
        ),
      ],
    );
  }
}
