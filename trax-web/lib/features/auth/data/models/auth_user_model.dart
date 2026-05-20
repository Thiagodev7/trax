import 'package:dart_jsonwebtoken/dart_jsonwebtoken.dart' show JWT;
import '../../domain/entities/auth_user.dart';

class AuthUserModel extends AuthUser {
  const AuthUserModel({
    required super.id,
    required super.agencyId,
    required super.email,
    required super.name,
    required super.role,
    required super.accessToken,
    required super.refreshToken,
  });

  /// Cria o AuthUser decodificando o JWT sem verificar assinatura.
  /// A assinatura já foi validada pelo servidor.
  factory AuthUserModel.fromTokenResponse(Map<String, dynamic> json) {
    final accessToken = json['accessToken'] as String;
    final refreshToken = json['refreshToken'] as String;

    // Decode payload sem validar assinatura (confiamos no servidor)
    final jwt = JWT.decode(accessToken);
    final payload = jwt.payload as Map<String, dynamic>;

    return AuthUserModel(
      id: payload['sub'] as String,
      agencyId: payload['agencyId'] as String,
      email: payload['email'] as String,
      name: payload['name'] as String? ?? payload['email'] as String,
      role: payload['role'] as String,
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
  }
}
