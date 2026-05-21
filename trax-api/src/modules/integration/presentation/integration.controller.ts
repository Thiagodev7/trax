import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Version,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentTenant } from '@common/decorators/current-tenant.decorator';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { ListIntegrationsUseCase } from '../application/use-cases/list-integrations.use-case';
import { CreateIntegrationUseCase } from '../application/use-cases/create-integration.use-case';
import { UpdateIntegrationUseCase } from '../application/use-cases/update-integration.use-case';
import { DeleteIntegrationUseCase } from '../application/use-cases/delete-integration.use-case';
import { SyncIntegrationUseCase } from '../application/use-cases/sync-integration.use-case';
import { TestIntegrationUseCase } from '../application/use-cases/test-integration.use-case';

@ApiBearerAuth()
@ApiTags('Integrations')
@Controller()
export class IntegrationController {
  constructor(
    private readonly listIntegrations: ListIntegrationsUseCase,
    private readonly createIntegration: CreateIntegrationUseCase,
    private readonly updateIntegration: UpdateIntegrationUseCase,
    private readonly deleteIntegration: DeleteIntegrationUseCase,
    private readonly syncIntegration: SyncIntegrationUseCase,
    private readonly testIntegration: TestIntegrationUseCase,
  ) {}

  @Get('clients/:clientId/integrations')
  @Version('1')
  @ApiOperation({ summary: 'Lista integrações de um cliente' })
  async findAll(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ) {
    return this.listIntegrations.execute(agencyId, clientId);
  }

  @Post('clients/:clientId/integrations')
  @Version('1')
  @Roles(UserRole.AGENCY_ADMIN, UserRole.AGENCY_VIEWER)
  @ApiOperation({ summary: 'Cria integração para um cliente' })
  async create(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: CreateIntegrationDto,
  ) {
    return this.createIntegration.execute(agencyId, clientId, dto);
  }

  @Patch('integrations/:id')
  @Version('1')
  @Roles(UserRole.AGENCY_ADMIN, UserRole.AGENCY_VIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualiza credenciais ou metadados da integração' })
  async update(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIntegrationDto,
  ) {
    return this.updateIntegration.execute(agencyId, id, dto);
  }

  @Delete('integrations/:id')
  @Version('1')
  @Roles(UserRole.AGENCY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove integração' })
  async remove(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deleteIntegration.execute(agencyId, id);
  }

  @Post('integrations/:id/sync')
  @Version('1')
  @Roles(UserRole.AGENCY_ADMIN, UserRole.AGENCY_VIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispara sincronização manual de dados' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'YYYY-MM-DD' })
  async sync(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.syncIntegration.execute({ agencyId, integrationId: id, startDate, endDate });
  }

  @Post('integrations/:id/test')
  @Version('1')
  @Roles(UserRole.AGENCY_ADMIN, UserRole.AGENCY_VIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Testa se as credenciais da integração são válidas' })
  async test(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.testIntegration.execute(agencyId, id);
  }
}
