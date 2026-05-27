import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '@common/decorators/current-tenant.decorator';
import { SchedulingService } from '../application/scheduling.service';

@ApiBearerAuth()
@ApiTags('Scheduling')
@Controller('clients/:clientId/scheduled-posts')
export class SchedulingController {
  constructor(private readonly scheduling: SchedulingService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Listar posts agendados do cliente' })
  list(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ) {
    return this.scheduling.list(agencyId, clientId);
  }

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Agendar post orgânico' })
  create(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() body: { platform: 'instagram' | 'facebook'; caption?: string; mediaUrl: string; scheduledAt: string },
  ) {
    return this.scheduling.create(agencyId, { ...body, clientId });
  }

  @Delete(':id')
  @Version('1')
  @ApiOperation({ summary: 'Cancelar post agendado' })
  cancel(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.scheduling.cancel(agencyId, id);
  }
}
