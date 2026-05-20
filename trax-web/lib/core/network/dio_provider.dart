import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class TokenStorage {
  Future<String?> read({required String key}) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(key);
  }

  Future<void> write({required String key, required String value}) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(key, value);
  }

  Future<void> deleteAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}

const _baseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:3000/api/v1',
);

final secureStorageProvider = Provider<TokenStorage>((ref) => TokenStorage());

final dioProvider = Provider<Dio>((ref) {
  final storage = ref.read(secureStorageProvider);

  final dio = Dio(
    BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  // Interceptor 1: injeta domínio do tenant + access token em cada request
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Envia o domínio atual para o backend resolver o tenant
        // Em ambiente de desenvolvimento local, forçamos o domínio de demo
        final host = Uri.base.host;
        options.headers['X-Agency-Domain'] =
            (host == 'localhost' || host == '127.0.0.1') ? 'demo-agency.trax.app' : host;

        // Injeta access token se existir
        final token = await storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        // Prevent infinite loop on refresh
        if (error.response?.statusCode == 401 && error.requestOptions.path != '/auth/refresh') {
          final refreshed = await _tryRefresh(dio, storage);
          if (refreshed) {
            // Repete a request original com novo token
            final token = await storage.read(key: 'access_token');
            final opts = error.requestOptions;
            opts.headers['Authorization'] = 'Bearer $token';
            try {
              final response = await dio.fetch(opts);
              return handler.resolve(response);
            } catch (e) {
              return handler.reject(e is DioException ? e : error);
            }
          }
        }
        return handler.next(error);
      },
    ),
  );

  return dio;
});

/// Tenta renovar o access token usando o refresh token armazenado.
/// Retorna true se o refresh foi bem-sucedido.
Future<bool> _tryRefresh(Dio dio, TokenStorage storage) async {
  try {
    final refreshToken = await storage.read(key: 'refresh_token');
    if (refreshToken == null) return false;

    // Usa uma nova instância do Dio para evitar deadlocks nos interceptors
    final refreshDio = Dio(BaseOptions(baseUrl: dio.options.baseUrl));
    refreshDio.options.headers['X-Agency-Domain'] = dio.options.headers['X-Agency-Domain'] ?? 'demo-agency.trax.app';

    final response = await refreshDio.post(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
    );

    final newToken = response.data['accessToken'] as String?;
    if (newToken != null) {
      await storage.write(key: 'access_token', value: newToken);
      return true;
    }
  } catch (_) {
    // Refresh falhou — força logout
    await storage.deleteAll();
  }
  return false;
}

