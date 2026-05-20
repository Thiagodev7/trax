import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/dio_provider.dart';
import '../../data/datasources/auth_remote_datasource.dart';
import '../../domain/entities/auth_user.dart';

class AuthController extends AsyncNotifier<AuthUser?> {
  late AuthRemoteDataSource _dataSource;
  late TokenStorage _storage;

  @override
  Future<AuthUser?> build() async {
    _dataSource = AuthRemoteDataSource(ref.read(dioProvider));
    _storage = ref.read(secureStorageProvider);
    return _restoreSession();
  }

  Future<AuthUser?> _restoreSession() async {
    final token = await _storage.read(key: 'access_token');
    if (token == null) return null;

    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;
      
      final payloadStr = utf8.decode(base64Url.decode(base64Url.normalize(parts[1])));
      final payload = jsonDecode(payloadStr);
      
      if (payload['exp'] != null) {
        final exp = DateTime.fromMillisecondsSinceEpoch(payload['exp'] * 1000);
        if (exp.isBefore(DateTime.now())) {
          // Token expired, let it return null or rely on refresh on next request.
          // For simplicity, we just return null to force login if expired on load.
          return null;
        }
      }
      
      return AuthUser(
        id: payload['sub'] as String,
        agencyId: payload['agencyId'] as String,
        email: payload['email'] as String,
        name: payload['email'] as String, // name might not be in token, fallback to email
        role: payload['role'] as String,
        accessToken: token,
        refreshToken: await _storage.read(key: 'refresh_token') ?? '',
      );
    } catch (_) {
      return null;
    }
  }

  Future<void> login({required String email, required String password}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final user = await _dataSource.login(email: email, password: password);

      // Persiste tokens de forma segura
      await Future.wait([
        _storage.write(key: 'access_token', value: user.accessToken),
        _storage.write(key: 'refresh_token', value: user.refreshToken),
      ]);

      return user;
    });
  }

  Future<void> logout() async {
    await _storage.deleteAll();
    state = const AsyncData(null);
  }
}

final authControllerProvider =
    AsyncNotifierProvider<AuthController, AuthUser?>(
  AuthController.new,
);
