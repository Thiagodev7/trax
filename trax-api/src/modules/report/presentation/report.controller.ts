import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  Version,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@common/decorators/roles.decorator';
import { Public } from '@common/decorators/roles.decorator';
import { CurrentTenant } from '@common/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@common/decorators/current-user.decorator';
import { CreateReportDto } from './dto/create-report.dto';
import { ListReportsUseCase } from '../application/use-cases/list-reports.use-case';
import { GetReportUseCase } from '../application/use-cases/get-report.use-case';
import { CreateReportUseCase } from '../application/use-cases/create-report.use-case';
import { PublishReportUseCase } from '../application/use-cases/publish-report.use-case';
import { DeleteReportUseCase } from '../application/use-cases/delete-report.use-case';

@ApiTags('Reports')
@Controller('reports')
export class ReportController {
  constructor(
    private readonly listReports: ListReportsUseCase,
    private readonly getReport: GetReportUseCase,
    private readonly createReport: CreateReportUseCase,
    private readonly publishReport: PublishReportUseCase,
    private readonly deleteReport: DeleteReportUseCase,
  ) {}

  @ApiBearerAuth()
  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Lista relatórios acessíveis pelo usuário logado' })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentTenant('agencyId') agencyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('clientId') clientId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.listReports.execute({ agencyId, user, clientId, page, limit });
  }

  @ApiBearerAuth()
  @Get(':id')
  @Version('1')
  @ApiOperation({ summary: 'Busca relatório por ID (autenticado)' })
  async findOne(
    @CurrentTenant('agencyId') agencyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.getReport.execute({ agencyId, reportId: id, user });
  }

  /**
   * Acesso público por share token — sem autenticação.
   * Token é único, opaco, gerado na publicação.
   */
  @Public()
  @Get('shared/:token')
  @Version('1')
  @ApiOperation({ summary: 'Acessa relatório compartilhado via share token (sem login)' })
  async findShared(@Param('token') token: string) {
    return this.getReport.executeByShareToken(token);
  }

  @ApiBearerAuth()
  @Post()
  @Version('1')
  @Roles(UserRole.AGENCY_ADMIN, UserRole.AGENCY_VIEWER)
  @ApiOperation({ summary: 'Cria novo relatório em rascunho' })
  async create(
    @CurrentTenant('agencyId') agencyId: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.createReport.execute(agencyId, dto);
  }

  @ApiBearerAuth()
  @Patch(':id/publish')
  @Version('1')
  @Roles(UserRole.AGENCY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publica relatório e gera share token (somente AGENCY_ADMIN)' })
  async publish(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.publishReport.execute(agencyId, id);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @Version('1')
  @Roles(UserRole.AGENCY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui relatório (somente AGENCY_ADMIN)' })
  async remove(
    @CurrentTenant('agencyId') agencyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deleteReport.execute({ agencyId, reportId: id, user });
  }
}
