import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class StatCard extends StatelessWidget {
  final String title;
  final num value;
  final bool isCurrency;

  const StatCard({
    super.key,
    required this.title,
    required this.value,
    this.isCurrency = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final formattedValue = isCurrency 
      ? NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$').format(value)
      : NumberFormat.compact(locale: 'pt_BR').format(value);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6))),
            const SizedBox(height: 12),
            Text(formattedValue, style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}
