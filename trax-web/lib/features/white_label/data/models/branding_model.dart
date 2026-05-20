import '../../domain/entities/branding.dart';

/// DTO do data layer — tem fromJson, mapeado para a entidade de domínio
class BrandingModel extends Branding {
  const BrandingModel({
    required super.agencyId,
    required super.agencyName,
    required super.slug,
    super.logoUrl,
    super.faviconUrl,
    required super.primaryColor,
    required super.secondaryColor,
    required super.accentColor,
    required super.fontFamily,
  });

  factory BrandingModel.fromJson(Map<String, dynamic> json) {
    final branding = json['branding'] as Map<String, dynamic>? ?? {};
    return BrandingModel(
      agencyId: json['agencyId'] as String,
      agencyName: json['name'] as String,
      slug: json['slug'] as String,
      logoUrl: branding['logoUrl'] as String?,
      faviconUrl: branding['faviconUrl'] as String?,
      primaryColor: branding['primaryColor'] as String? ?? '#6366F1',
      secondaryColor: branding['secondaryColor'] as String? ?? '#818CF8',
      accentColor: branding['accentColor'] as String? ?? '#F59E0B',
      fontFamily: branding['fontFamily'] as String? ?? 'Inter',
    );
  }
}
