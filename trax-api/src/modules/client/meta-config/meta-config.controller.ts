import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '@common/decorators/current-tenant.decorator';
import { MetaConfigService } from './meta-config.service';
import { MetaConfigShape } from './meta-config.template';

@ApiBearerAuth()
@ApiTags('Meta Config')
@Controller('clients/:clientId/meta-config')
export class MetaConfigController {
  constructor(private readonly metaConfig: MetaConfigService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Obter configuração Meta Ads do cliente' })
  get(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ) {
    return this.metaConfig.getOrCreate(agencyId, clientId);
  }

  @Put()
  @Version('1')
  @ApiOperation({ summary: 'Atualizar configuração Meta Ads' })
  update(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() body: Partial<MetaConfigShape>,
  ) {
    return this.metaConfig.update(agencyId, clientId, body);
  }

  @Post('reset')
  @Version('1')
  @ApiOperation({ summary: 'Restaurar template Tron padrão' })
  reset(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ) {
    return this.metaConfig.reset(agencyId, clientId);
  }
}
