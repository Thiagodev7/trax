import 'package:equatable/equatable.dart';

/// Entidade de domínio pura — sem fromJson/toJson (isso fica no data layer)
class Branding extends Equatable {
  final String agencyId;
  final String agencyName;
  final String slug;
  final String? logoUrl;
  final String? faviconUrl;
  final String primaryColor;
  final String secondaryColor;
  final String accentColor;
  final String fontFamily;

  const Branding({
    required this.agencyId,
    required this.agencyName,
    required this.slug,
    this.logoUrl,
    this.faviconUrl,
    required this.primaryColor,
    required this.secondaryColor,
    required this.accentColor,
    required this.fontFamily,
  });

  @override
  List<Object?> get props => [
        agencyId,
        agencyName,
        slug,
        logoUrl,
        faviconUrl,
        primaryColor,
        secondaryColor,
        accentColor,
        fontFamily,
      ];
}
