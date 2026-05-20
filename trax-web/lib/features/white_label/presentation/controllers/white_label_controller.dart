import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/dio_provider.dart';
import '../../data/datasources/white_label_remote_datasource.dart';
import '../../domain/entities/branding.dart';

/// Controller que carrega o white-label na inicialização do app.
/// Usa AsyncNotifier para gerenciar loading/error/data automaticamente.
class WhiteLabelController extends AsyncNotifier<Branding?> {
  @override
  Future<Branding?> build() async {
    return _loadBranding();
  }

  Future<Branding?> _loadBranding() async {
    final dio = ref.read(dioProvider);
    final dataSource = WhiteLabelRemoteDataSource(dio);

    try {
      return await dataSource.resolveTenant();
    } catch (e) {
      // Em localhost sem tenant configurado, retorna branding padrão
      // Em produção, o erro é propagado para mostrar a tela de erro
      if (Uri.base.host == 'localhost' || Uri.base.host == '127.0.0.1') {
        return null; // Usa tema padrão do Trax
      }
      rethrow;
    }
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_loadBranding);
  }
}

final whiteLabelControllerProvider =
    AsyncNotifierProvider<WhiteLabelController, Branding?>(
  WhiteLabelController.new,
);
