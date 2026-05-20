import 'package:equatable/equatable.dart';

class AuthUser extends Equatable {
  final String id;
  final String agencyId;
  final String email;
  final String name;
  final String role;
  final String accessToken;
  final String refreshToken;

  const AuthUser({
    required this.id,
    required this.agencyId,
    required this.email,
    required this.name,
    required this.role,
    required this.accessToken,
    required this.refreshToken,
  });

  bool get isAgencyAdmin => role == 'AGENCY_ADMIN';
  bool get isAgencyViewer => role == 'AGENCY_VIEWER';
  bool get isClientViewer => role == 'CLIENT_VIEWER';

  @override
  List<Object?> get props => [id, agencyId, email, role];
}
