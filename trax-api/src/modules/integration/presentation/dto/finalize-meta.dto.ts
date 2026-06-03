import { IsString, IsOptional, IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IntegrationProvider } from '@prisma/client';

export class FinalizeMetaDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pendingId!: string;

  @ApiProperty({ required: false, description: 'Meta Ads — act_XXXXXXXX' })
  @IsOptional()
  @IsString()
  adAccountId?: string;

  @ApiProperty({ required: false, description: 'Página do Facebook (para Instagram / Facebook Page)' })
  @IsOptional()
  @IsString()
  pageId?: string;

  @ApiProperty({ enum: ['META_ADS', 'INSTAGRAM', 'FACEBOOK_PAGE'] })
  @IsIn(['META_ADS', 'INSTAGRAM', 'FACEBOOK_PAGE'] as IntegrationProvider[])
  targetProvider!: IntegrationProvider;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  displayName?: string;
}
