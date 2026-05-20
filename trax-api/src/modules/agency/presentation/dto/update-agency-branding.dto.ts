import {
  IsString,
  IsOptional,
  IsUrl,
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
  @IsUrl()
  @MaxLength(1024)
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://cdn.agencia.com/favicon.png' })
  @IsOptional()
  @IsUrl()
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
}
