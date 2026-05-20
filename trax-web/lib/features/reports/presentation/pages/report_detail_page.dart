import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fl_chart/fl_chart.dart';
import '../controllers/reports_controller.dart';
import '../widgets/stat_card.dart';
import '../widgets/line_chart_card.dart';
import '../../../../core/router/app_router.dart';

class ReportDetailPage extends ConsumerWidget {
  final String reportId;
  
  const ReportDetailPage({super.key, required this.reportId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final reports = ref.watch(reportsControllerProvider).valueOrNull ?? [];
    final report = reports.firstWhere((r) => r.id == reportId);

    // Mock data para os gráficos
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
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: Text(report.title),
        actions: [
          if (report.isPublished && report.shareToken != null)
            TextButton.icon(
              onPressed: () => _copyShareLink(context, report.shareToken!),
              icon: const Icon(Icons.link),
              label: const Text('Copiar Link'),
            )
          else
            FilledButton.icon(
              onPressed: () => _publish(context, ref),
              icon: const Icon(Icons.public),
              label: const Text('Publicar'),
            ),
          const SizedBox(width: 16),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
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
    );
  }

  Future<void> _publish(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(reportsControllerProvider.notifier).publishReport(reportId);
      if (context.mounted) {
        final updated = ref.read(reportsControllerProvider).valueOrNull?.firstWhere((r) => r.id == reportId);
        if (updated?.shareToken != null) {
          _showShareDialog(context, updated!.shareToken!);
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erro: $e')));
      }
    }
  }

  void _showShareDialog(BuildContext context, String token) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Relatório Publicado! 🎉'),
        content: const Text('O link público foi gerado e já pode ser enviado ao cliente. Eles não precisam de login para visualizar.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Fechar')),
          FilledButton(
            onPressed: () {
              Navigator.pop(ctx);
              _copyShareLink(context, token);
            },
            child: const Text('Copiar Link'),
          ),
        ],
      ),
    );
  }

  void _copyShareLink(BuildContext context, String token) {
    final baseUrl = Uri.base.origin;
    final shareUrl = '$baseUrl/#/shared/$token';
    Clipboard.setData(ClipboardData(text: shareUrl));
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link copiado para a área de transferência!')));
  }
}
