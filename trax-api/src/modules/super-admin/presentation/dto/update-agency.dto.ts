import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  MaxLength,
  Matches,
  IsUrl,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AgencyPlan } from '@prisma/client';

export class UpdateAgencyDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'O slug deve conter apenas letras minúsculas, números e hifens',
  })
  slug?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  customDomain?: string | null;

  @ApiPropertyOptional()
  @IsUrl({}, { message: 'URL do logo inválida' })
  @IsOptional()
  logoUrl?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Cor primária deve ser hex #RRGGBB' })
  primaryColor?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Cor secundária deve ser hex #RRGGBB' })
  secondaryColor?: string;

  @ApiPropertyOptional({ enum: AgencyPlan })
  @IsEnum(AgencyPlan)
  @IsOptional()
  plan?: AgencyPlan;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  maxClients?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  maxUsers?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  trialEndsAt?: string | null;
}
