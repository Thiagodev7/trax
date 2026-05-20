import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../router/app_router.dart';

class AppSidebar extends StatelessWidget {
  final String currentRoute;
  const AppSidebar({super.key, required this.currentRoute});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final items = [
      (icon: Icons.dashboard_outlined, label: 'Dashboard', route: AppRoutes.dashboard),
      (icon: Icons.business_outlined, label: 'Clientes', route: AppRoutes.clients),
      (icon: Icons.bar_chart_outlined, label: 'Relatórios', route: AppRoutes.reports),
    ];

    return Container(
      width: 220,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border(right: BorderSide(color: theme.colorScheme.outline)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 24),
          ...items.map((item) {
            final isSelected = currentRoute == item.route;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
              child: ListTile(
                leading: Icon(item.icon,
                    color: isSelected
                        ? theme.colorScheme.primary
                        : theme.colorScheme.onSurface.withOpacity(0.6)),
                title: Text(item.label,
                    style: TextStyle(
                      color: isSelected
                          ? theme.colorScheme.primary
                          : theme.colorScheme.onSurface,
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.w400,
                    )),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
                tileColor: isSelected
                    ? theme.colorScheme.primary.withOpacity(0.1)
                    : null,
                onTap: () => context.go(item.route),
              ),
            );
          }),
        ],
      ),
    );
  }
}
