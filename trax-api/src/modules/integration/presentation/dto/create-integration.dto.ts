import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IntegrationProvider } from '@prisma/client';

export class CreateIntegrationDto {
  @ApiProperty({ enum: IntegrationProvider, example: IntegrationProvider.META_ADS })
  @IsEnum(IntegrationProvider)
  provider: IntegrationProvider;

  @ApiPropertyOptional({ example: 'Meta Ads — Conta Principal' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  /**
   * Credenciais em texto plano — serão criptografadas pelo use-case antes de persistir.
   * Estrutura varia por provider:
   *   META_ADS:      { accessToken, adAccountId }
   *   INSTAGRAM:     { accessToken, igUserId }
   *   FACEBOOK_PAGE: { accessToken, pageId }
   *   NECTAR_CRM:    { apiToken, baseUrl? }
   *   GOOGLE_ADS:    { refreshToken, customerId, developerToken }
   */
  @ApiProperty({
    type: 'object',
    example: { accessToken: 'EAAx...', adAccountId: 'act_123456' },
  })
  @IsObject()
  @IsNotEmpty()
  credentials: Record<string, string>;

  /**
   * Metadados não-sensíveis adicionais.
   * Ex: { campaignIds: ['123', '456'], nectarBaseUrl: 'https://...' }
   */
  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  /** ID da conta/recurso externo (ex: act_123, page_456) — chave de unicidade */
  @ApiPropertyOptional({ example: 'act_1088579197977036' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  externalAccount?: string;
}
