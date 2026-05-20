import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../widgets/stat_card.dart';
import '../widgets/line_chart_card.dart';
import '../../../../core/theme/app_theme.dart';

class ReportSharedPage extends ConsumerWidget {
  final String shareToken;

  const ReportSharedPage({super.key, required this.shareToken});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    // TODO: Fetch public report using shareToken
    // Aqui assumimos que já carregou o branding e os dados do relatório público

    final clicksData = [
      const FlSpot(1, 120),
      const FlSpot(2, 250),
      const FlSpot(3, 180),
      const FlSpot(4, 300),
      const FlSpot(5, 450),
      const FlSpot(6, 420),
      const FlSpot(7, 500),
    ];
    final costData = [
      const FlSpot(1, 100),
      const FlSpot(2, 120),
      const FlSpot(3, 110),
      const FlSpot(4, 150),
      const FlSpot(5, 180),
      const FlSpot(6, 170),
      const FlSpot(7, 200),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Relatório de Desempenho'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1024),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Visão Geral do Período (Últimos 7 dias)', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 24),
                Row(
                  children: [
                    const Expanded(child: StatCard(title: 'Investimento Total', value: 3450.50, isCurrency: true)),
                    const SizedBox(width: 16),
                    const Expanded(child: StatCard(title: 'Cliques Totais', value: 12450)),
                    const SizedBox(width: 16),
                    Expanded(
                      child: StatCard(
                        title: 'Custo por Clique (CPC)',
                        value: 3450.50 / 12450,
                        isCurrency: true,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),
                Row(
                  children: [
                    Expanded(child: LineChartCard(title: 'Cliques por Dia', spots: clicksData)),
                    const SizedBox(width: 24),
                    Expanded(child: LineChartCard(title: 'Custo por Dia (R\$)', spots: costData)),
                  ],
                )
              ],
            ),
          ),
        ),
      ),
    );
  }
}
