import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsArray,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty({ example: 'Relatório Google Ads — Maio 2025' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'uuid-da-empresa', description: 'ID da empresa' })
  @IsUUID()
  companyId: string;

  @ApiPropertyOptional({ example: 'Visão geral da performance do mês.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: '2025-05-01' })
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional({ example: '2025-05-31' })
  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'IDs das integrações a incluir no relatório',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  integrationIds?: string[];
}
