import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/router/app_router.dart';
import '../controllers/clients_controller.dart';
import '../../../../core/widgets/app_sidebar.dart';

class ClientsPage extends ConsumerWidget {
  const ClientsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final clientsState = ref.watch(clientsControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Clientes')),
      body: Row(
        children: [
          AppSidebar(currentRoute: AppRoutes.clients),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Clientes',
                          style: theme.textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      FilledButton.icon(
                        onPressed: () => _showCreateClientModal(context, ref),
                        icon: const Icon(Icons.add),
                        label: const Text('Novo Cliente'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Lista de Clientes
                  Expanded(
                    child: clientsState.when(
                      loading: () => const Center(child: CircularProgressIndicator()),
                      error: (err, _) => Center(
                        child: Text('Erro ao carregar clientes: $err'),
                      ),
                      data: (clients) {
                        if (clients.isEmpty) {
                          return Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.business_outlined,
                                    size: 64, color: theme.colorScheme.onSurface.withOpacity(0.2)),
                                const SizedBox(height: 16),
                                Text('Nenhum cliente cadastrado',
                                    style: theme.textTheme.titleMedium?.copyWith(
                                        color: theme.colorScheme.onSurface.withOpacity(0.4))),
                              ],
                            ),
                          );
                        }
                        
                        return ListView.separated(
                          itemCount: clients.length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final client = clients[index];
                            return ListTile(
                              leading: CircleAvatar(
                                backgroundColor: theme.colorScheme.primaryContainer,
                                child: Text(
                                  client.name[0].toUpperCase(),
                                  style: TextStyle(color: theme.colorScheme.onPrimaryContainer),
                                ),
                              ),
                              title: Text(client.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                              subtitle: Text('Adicionado em ${DateFormat('dd/MM/yyyy').format(client.createdAt)}'),
                              trailing: IconButton(
                                icon: const Icon(Icons.more_vert),
                                onPressed: () {},
                              ),
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

  void _showCreateClientModal(BuildContext context, WidgetRef ref) {
    final formKey = GlobalKey<FormState>();
    final nameCtrl = TextEditingController();
    bool isLoading = false;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx, setState) {
          return AlertDialog(
            title: const Text('Novo Cliente'),
            content: Form(
              key: formKey,
              child: TextFormField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Nome da Empresa', prefixIcon: Icon(Icons.business)),
                validator: (v) => v == null || v.isEmpty ? 'Informe o nome' : null,
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
                          await ref.read(clientsControllerProvider.notifier).createClient(nameCtrl.text.trim());
                          if (ctx.mounted) Navigator.pop(ctx);
                        } catch (e) {
                          setState(() => isLoading = false);
                          if (ctx.mounted) {
                            ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Erro: $e')));
                          }
                        }
                      },
                child: isLoading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Salvar'),
              ),
            ],
          );
        });
      },
    );
  }
}
