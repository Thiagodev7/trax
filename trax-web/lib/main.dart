import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/white_label/presentation/controllers/white_label_controller.dart';

void main() {
  runApp(
    // ProviderScope no topo da árvore — obrigatório para Riverpod
    const ProviderScope(
      child: TraxApp(),
    ),
  );
}

class TraxApp extends ConsumerWidget {
  const TraxApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    // Carrega o tema white-label do tenant atual na inicialização
    final brandingAsync = ref.watch(whiteLabelControllerProvider);

    return brandingAsync.when(
      loading: () => const _SplashScreen(),
      error: (err, _) => _ErrorApp(message: err.toString()),
      data: (branding) {
        return MaterialApp.router(
          title: branding?.agencyName ?? 'Trax',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.fromBranding(branding),
          darkTheme: AppTheme.fromBrandingDark(branding),
          themeMode: ThemeMode.system,
          routerConfig: router,
        );
      },
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        backgroundColor: Color(0xFF0F172A),
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF6366F1)),
        ),
      ),
    );
  }
}

class _ErrorApp extends StatelessWidget {
  final String message;
  const _ErrorApp({required this.message});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        backgroundColor: const Color(0xFF0F172A),
        body: Center(
          child: Text(
            'Erro ao carregar portal: $message',
            style: const TextStyle(color: Colors.white70),
          ),
        ),
      ),
    );
  }
}
