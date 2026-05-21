import {
  IsArray,
  IsDateString,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReportDto {
  @ApiPropertyOptional({ example: 'Relatório Google Ads — Maio 2025' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
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
    description: 'IDs das integrações a incluir no relatório (substitui as atuais)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  integrationIds?: string[];

  @ApiPropertyOptional({
    type: 'object',
    example: { enabledTabs: ['META_ADS', 'ORGANIC', 'CALENDAR', 'KPI'], defaultTab: 'META_ADS' },
  })
  @IsOptional()
  @IsObject()
  moduleConfig?: {
    enabledTabs: string[];
    defaultTab?: string;
  };
}
