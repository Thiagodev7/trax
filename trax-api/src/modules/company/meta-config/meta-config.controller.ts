import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '@common/decorators/current-tenant.decorator';
import { MetaConfigService } from './meta-config.service';
import { MetaConfigSegment, MetaConfigShape } from './meta-config.template';

@ApiBearerAuth()
@ApiTags('Meta Config')
@Controller('companies/:companyId/meta-config')
export class MetaConfigController {
  constructor(private readonly metaConfig: MetaConfigService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Obter configuração Meta Ads da empresa' })
  get(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ) {
    return this.metaConfig.getOrCreate(agencyId, companyId);
  }

  @Put()
  @Version('1')
  @ApiOperation({ summary: 'Atualizar configuração Meta Ads' })
  update(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() body: Partial<MetaConfigShape>,
  ) {
    return this.metaConfig.update(agencyId, companyId, body);
  }

  @Post('reset')
  @Version('1')
  @ApiOperation({ summary: 'Restaurar template padrão ou por segmento' })
  @ApiQuery({
    name: 'segment',
    required: false,
    enum: ['general', 'ecommerce', 'education', 'real-estate'],
    description: 'Segmento de mercado para aplicar template pré-definido',
  })
  reset(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query('segment') segment?: MetaConfigSegment,
  ) {
    return this.metaConfig.reset(agencyId, companyId, segment);
  }
}
