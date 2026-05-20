import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../features/white_label/domain/entities/branding.dart';

/// Gera o ThemeData a partir das configurações white-label da agência.
/// Cada agência tem suas próprias cores e fonte, injetadas dinamicamente.
class AppTheme {
  AppTheme._();

  static ThemeData fromBranding(Branding? branding) {
    final primary = _hexToColor(branding?.primaryColor ?? '#6366F1');
    final secondary = _hexToColor(branding?.secondaryColor ?? '#818CF8');
    final accent = _hexToColor(branding?.accentColor ?? '#F59E0B');
    final font = branding?.fontFamily ?? 'Inter';

    return _buildTheme(
      brightness: Brightness.light,
      primary: primary,
      secondary: secondary,
      accent: accent,
      font: font,
    );
  }

  static ThemeData fromBrandingDark(Branding? branding) {
    final primary = _hexToColor(branding?.primaryColor ?? '#6366F1');
    final secondary = _hexToColor(branding?.secondaryColor ?? '#818CF8');
    final accent = _hexToColor(branding?.accentColor ?? '#F59E0B');
    final font = branding?.fontFamily ?? 'Inter';

    return _buildTheme(
      brightness: Brightness.dark,
      primary: primary,
      secondary: secondary,
      accent: accent,
      font: font,
    );
  }

  static ThemeData _buildTheme({
    required Brightness brightness,
    required Color primary,
    required Color secondary,
    required Color accent,
    required String font,
  }) {
    final isDark = brightness == Brightness.dark;

    final colorScheme = ColorScheme(
      brightness: brightness,
      primary: primary,
      onPrimary: Colors.white,
      secondary: secondary,
      onSecondary: Colors.white,
      tertiary: accent,
      onTertiary: Colors.white,
      error: const Color(0xFFEF4444),
      onError: Colors.white,
      surface: isDark ? const Color(0xFF1E293B) : Colors.white,
      onSurface: isDark ? const Color(0xFFF1F5F9) : const Color(0xFF0F172A),
      surfaceContainerHighest: isDark ? const Color(0xFF334155) : const Color(0xFFF8FAFC),
      outline: isDark ? const Color(0xFF475569) : const Color(0xFFE2E8F0),
    );

    final textTheme = _buildTextTheme(font, colorScheme);

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: colorScheme,
      textTheme: textTheme,
      scaffoldBackgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: colorScheme.outline),
        ),
        color: colorScheme.surface,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        centerTitle: false,
        titleTextStyle: textTheme.titleLarge?.copyWith(
          color: colorScheme.onSurface,
          fontWeight: FontWeight.w600,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: colorScheme.outline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: colorScheme.outline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          elevation: 0,
          textStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
        ),
      ),
    );
  }

  static TextTheme _buildTextTheme(String fontFamily, ColorScheme colorScheme) {
    try {
      final base = GoogleFonts.getTextTheme(fontFamily);
      return base.apply(
        bodyColor: colorScheme.onSurface,
        displayColor: colorScheme.onSurface,
      );
    } catch (_) {
      // Fallback se a fonte não existir no Google Fonts
      return GoogleFonts.interTextTheme().apply(
        bodyColor: colorScheme.onSurface,
        displayColor: colorScheme.onSurface,
      );
    }
  }

  static Color _hexToColor(String hex) {
    final clean = hex.replaceAll('#', '');
    if (clean.length == 6) {
      return Color(int.parse('FF$clean', radix: 16));
    }
    return const Color(0xFF6366F1); // fallback indigo
  }
}
