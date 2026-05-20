import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/widgets/app_sidebar.dart';
import '../controllers/reports_controller.dart';
import '../../../clients/presentation/controllers/clients_controller.dart';
import '../../domain/entities/report.dart';

class ReportsPage extends ConsumerWidget {
  const ReportsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final reportsState = ref.watch(reportsControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Relatórios')),
      body: Row(
        children: [
          AppSidebar(currentRoute: AppRoutes.reports),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text('Relatórios',
                            style: theme.textTheme.headlineMedium
                                ?.copyWith(fontWeight: FontWeight.w700)),
                      ),
                      FilledButton.icon(
                        onPressed: () => _showCreateReportModal(context, ref),
                        icon: const Icon(Icons.add),
                        label: const Text('Novo Relatório'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Lista de relatórios
                  Expanded(
                    child: reportsState.when(
                      loading: () => const Center(child: CircularProgressIndicator()),
                      error: (err, _) => Center(child: Text('Erro: $err')),
                      data: (reports) {
                        if (reports.isEmpty) return _EmptyReports();

                        return ListView.separated(
                          itemCount: reports.length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final report = reports[index];
                            return ListTile(
                              leading: Icon(Icons.description_outlined, color: theme.colorScheme.primary),
                              title: Text(report.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                              subtitle: Text('Criado em ${DateFormat('dd/MM/yyyy').format(report.createdAt)}'),
                              trailing: report.isPublished 
                                ? Chip(
                                    label: const Text('Publicado', style: TextStyle(fontSize: 12)),
                                    backgroundColor: Colors.green.withOpacity(0.1),
                                    side: BorderSide.none,
                                    labelStyle: const TextStyle(color: Colors.green),
                                  )
                                : Chip(
                                    label: const Text('Rascunho', style: TextStyle(fontSize: 12)),
                                    backgroundColor: theme.colorScheme.outline.withOpacity(0.1),
                                    side: BorderSide.none,
                                    labelStyle: TextStyle(color: theme.colorScheme.onSurface),
                                  ),
                              onTap: () {
                                context.go(AppRoutes.reportDetail.replaceFirst(':id', report.id));
                              },
                            );
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showCreateReportModal(BuildContext context, WidgetRef ref) {
    final formKey = GlobalKey<FormState>();
    final titleCtrl = TextEditingController();
    String? selectedClientId;
    bool isLoading = false;

    // Garante que a lista de clientes esteja carregada
    final clientsState = ref.watch(clientsControllerProvider);

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx, setState) {
          return AlertDialog(
            title: const Text('Novo Relatório'),
            content: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: titleCtrl,
                    decoration: const InputDecoration(labelText: 'Título do Relatório', prefixIcon: Icon(Icons.title)),
                    validator: (v) => v == null || v.isEmpty ? 'Informe o título' : null,
                  ),
                  const SizedBox(height: 16),
                  
                  // Dropdown de clientes
                  clientsState.when(
                    loading: () => const CircularProgressIndicator(),
                    error: (err, _) => Text('Erro ao carregar clientes: $err'),
                    data: (clients) {
                      if (clients.isEmpty) return const Text('Cadastre um cliente primeiro.');
                      return DropdownButtonFormField<String>(
                        decoration: const InputDecoration(labelText: 'Cliente', prefixIcon: Icon(Icons.business)),
                        value: selectedClientId,
                        items: clients.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))).toList(),
                        onChanged: (v) => setState(() => selectedClientId = v),
                        validator: (v) => v == null ? 'Selecione um cliente' : null,
                      );
                    },
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: isLoading ? null : () => Navigator.pop(ctx),
                child: const Text('Cancelar'),
              ),
              FilledButton(
                onPressed: isLoading
                    ? null
                    : () async {
                        if (!formKey.currentState!.validate()) return;
                        setState(() => isLoading = true);
                        try {
                          final newReport = await ref
                              .read(reportsControllerProvider.notifier)
                              .createReport(titleCtrl.text.trim(), selectedClientId!);
                          if (ctx.mounted) {
                            Navigator.pop(ctx);
                            ctx.go(AppRoutes.reportDetail.replaceFirst(':id', newReport.id));
                          }
                        } catch (e) {
                          setState(() => isLoading = false);
                          if (ctx.mounted) {
                            ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Erro: $e')));
                          }
                        }
                      },
                child: isLoading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Criar'),
              ),
            ],
          );
        });
      },
    );
  }
}

class _EmptyReports extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.description_outlined,
              size: 64, color: theme.colorScheme.onSurface.withOpacity(0.2)),
          const SizedBox(height: 16),
          Text('Nenhum relatório encontrado',
              style: theme.textTheme.titleMedium?.copyWith(
                  color: theme.colorScheme.onSurface.withOpacity(0.4))),
          const SizedBox(height: 8),
          Text('Crie o primeiro relatório para o seu cliente',
              style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurface.withOpacity(0.3))),
        ],
      ),
    );
  }
}
