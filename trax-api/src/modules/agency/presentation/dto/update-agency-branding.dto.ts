import {
  IsString,
  IsOptional,
  IsUrl,
  ValidateIf,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAgencyBrandingDto {
  @ApiPropertyOptional({ example: 'Agência Criativa' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'https://cdn.agencia.com/logo.png' })
  @IsOptional()
  @ValidateIf(e => e.logoUrl !== '')
  @IsUrl({ require_tld: false })
  @MaxLength(1024)
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://cdn.agencia.com/favicon.png' })
  @IsOptional()
  @ValidateIf(e => e.faviconUrl !== '')
  @IsUrl({ require_tld: false })
  @MaxLength(1024)
  faviconUrl?: string;

  @ApiPropertyOptional({ example: '#6366F1', description: 'Cor primária em hex' })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'primaryColor deve ser um hex válido (#RRGGBB)' })
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#818CF8' })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'secondaryColor deve ser um hex válido (#RRGGBB)' })
  secondaryColor?: string;

  @ApiPropertyOptional({ example: '#F59E0B' })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'accentColor deve ser um hex válido (#RRGGBB)' })
  accentColor?: string;

  @ApiPropertyOptional({ example: 'Inter' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fontFamily?: string;

  @ApiPropertyOptional({ example: 'relatorios.agencia.com.br' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  customDomain?: string;

  @ApiPropertyOptional({ example: 'dark' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  themeMode?: string;

  @ApiPropertyOptional({ example: 'medium' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  borderRadius?: string;

  @ApiPropertyOptional({ example: 'sidebar' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  portalLayout?: string;

  @ApiPropertyOptional({ example: 'centered' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  loginLayout?: string;

  @ApiPropertyOptional({ example: 'https://cdn.agencia.com/login-bg.jpg' })
  @IsOptional()
  @ValidateIf(e => e.loginBackgroundUrl !== '')
  @IsUrl({ require_tld: false })
  @MaxLength(1024)
  loginBackgroundUrl?: string;

  @ApiPropertyOptional({ example: 'Bem-vindo ao Portal' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  loginTitle?: string;

  @ApiPropertyOptional({ example: 'Faça login para ver seus resultados' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  loginSubtitle?: string;

  @ApiPropertyOptional({ example: ':root { --color-primary: #FF0000; }', description: 'CSS customizado injetado no <head> do portal' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  customCss?: string;
}
