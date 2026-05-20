import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/controllers/auth_controller.dart';
import '../../features/dashboard/presentation/pages/dashboard_page.dart';
import '../../features/clients/presentation/pages/clients_page.dart';
import '../../features/reports/presentation/pages/reports_page.dart';
import '../../features/reports/presentation/pages/report_detail_page.dart';
import '../../features/reports/presentation/pages/report_shared_page.dart';

/// Rotas nomeadas — usar constantes evita typos
class AppRoutes {
  static const login = '/login';
  static const dashboard = '/dashboard';
  static const clients = '/clients';
  static const reports = '/reports';
  static const reportDetail = '/reports/:id';
  static const reportShared = '/shared/:token';
}

final appRouterProvider = Provider<GoRouter>((ref) {
  // Ouve o estado de autenticação para redirecionar automaticamente
  final authState = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: AppRoutes.dashboard,
    debugLogDiagnostics: false,
    redirect: (context, state) {
      final isLoggedIn = authState.valueOrNull != null;
      final isLoggingIn = state.matchedLocation == AppRoutes.login;
      final isSharedRoute = state.matchedLocation.startsWith('/shared/');

      // Rotas de compartilhamento são sempre públicas
      if (isSharedRoute) return null;

      if (!isLoggedIn && !isLoggingIn) return AppRoutes.login;
      if (isLoggedIn && isLoggingIn) return AppRoutes.dashboard;
      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.login,
        name: 'login',
        builder: (_, __) => const LoginPage(),
      ),
      GoRoute(
        path: AppRoutes.dashboard,
        name: 'dashboard',
        builder: (_, __) => const DashboardPage(),
      ),
      GoRoute(
        path: AppRoutes.clients,
        name: 'clients',
        builder: (_, __) => const ClientsPage(),
      ),
      GoRoute(
        path: AppRoutes.reports,
        name: 'reports',
        builder: (_, __) => const ReportsPage(),
      ),
      GoRoute(
        path: AppRoutes.reportDetail,
        name: 'report-detail',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return ReportDetailPage(reportId: id);
        },
      ),
      // Rota pública — acesso sem login via share token
      GoRoute(
        path: AppRoutes.reportShared,
        name: 'report-shared',
        builder: (context, state) {
          final token = state.pathParameters['token']!;
          return ReportSharedPage(shareToken: token);
        },
      ),
    ],
  );
});
