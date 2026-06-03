import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AgencyPlan } from '@prisma/client';

export class CreateAgencyBySuperAdminDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'O slug deve conter apenas letras minúsculas, números e hifens',
  })
  slug: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  adminName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  adminPassword: string;

  @ApiPropertyOptional({ enum: AgencyPlan, default: AgencyPlan.TRIAL })
  @IsEnum(AgencyPlan)
  @IsOptional()
  plan?: AgencyPlan;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  maxCompanies?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  maxUsers?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  trialEndsAt?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
