import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AgencyPlan } from '@prisma/client';
import { Public } from '@common/decorators/roles.decorator';
import { SuperAdminGuard } from '@common/guards/super-admin.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { SuperAdminLoginDto } from './dto/super-admin-login.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { CreateAgencyBySuperAdminDto } from './dto/create-agency.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateSuperAdminPasswordDto } from './dto/update-super-admin-password.dto';
import { SuperAdminLoginUseCase } from '../application/use-cases/super-admin-login.use-case';
import { ListAgenciesUseCase } from '../application/use-cases/list-agencies.use-case';
import { GetStatsUseCase } from '../application/use-cases/get-stats.use-case';
import { UpdateAgencyUseCase } from '../application/use-cases/update-agency.use-case';
import { CreateAgencyBySuperAdminUseCase } from '../application/use-cases/create-agency-by-super-admin.use-case';
import { GetAgencyUseCase } from '../application/use-cases/get-agency.use-case';
import { DeleteAgencyUseCase } from '../application/use-cases/delete-agency.use-case';
import { ListUsersUseCase } from '../application/use-cases/list-users.use-case';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';
import { GetHealthUseCase } from '../application/use-cases/get-health.use-case';
import {
  GetSuperAdminMeUseCase,
  UpdateSuperAdminPasswordUseCase,
} from '../application/use-cases/super-admin-profile.use-case';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
import { ListAuditLogsUseCase } from '@modules/audit-log/application/use-cases/list-audit-logs.use-case';
import {
  ListAgencyCompaniesUseCase,
  ListAgencyIntegrationsUseCase,
} from '../application/use-cases/list-agency-resources.use-case';

@ApiTags('Super Admin')
@Controller('super-admin')
@UseGuards(SuperAdminGuard)
export class SuperAdminController {
  constructor(
    private readonly loginUseCase: SuperAdminLoginUseCase,
    private readonly listAgenciesUseCase: ListAgenciesUseCase,
    private readonly getStatsUseCase: GetStatsUseCase,
    private readonly updateAgencyUseCase: UpdateAgencyUseCase,
    private readonly createAgencyUseCase: CreateAgencyBySuperAdminUseCase,
    private readonly getAgencyUseCase: GetAgencyUseCase,
    private readonly deleteAgencyUseCase: DeleteAgencyUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly getHealthUseCase: GetHealthUseCase,
    private readonly getSuperAdminMeUseCase: GetSuperAdminMeUseCase,
    private readonly updateSuperAdminPasswordUseCase: UpdateSuperAdminPasswordUseCase,
    private readonly listAgencyCompaniesUseCase: ListAgencyCompaniesUseCase,
    private readonly listAgencyIntegrationsUseCase: ListAgencyIntegrationsUseCase,
    private readonly listAuditLogsUseCase: ListAuditLogsUseCase,
  ) {}

  // ── Auth ────────────────────────────────────────────────────────────────────

  @Public()
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Login do super-admin da plataforma' })
  async login(@Body() dto: SuperAdminLoginDto) {
    return this.loginUseCase.execute(dto);
  }

  // ── Profile ─────────────────────────────────────────────────────────────────

  @UseGuards(SuperAdminGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil do super-admin logado' })
  async me(@CurrentUser('sub') adminId: string) {
    return this.getSuperAdminMeUseCase.execute(adminId);
  }

  @UseGuards(SuperAdminGuard)
  @Patch('me/password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alterar senha do super-admin' })
  async updatePassword(
    @CurrentUser('sub') adminId: string,
    @Body() dto: UpdateSuperAdminPasswordDto,
  ) {
    return this.updateSuperAdminPasswordUseCase.execute(adminId, dto);
  }

  // ── Health & Stats ──────────────────────────────────────────────────────────

  @UseGuards(SuperAdminGuard)
  @Get('health')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Status real dos serviços da plataforma' })
  async health() {
    return this.getHealthUseCase.execute();
  }

  @UseGuards(SuperAdminGuard)
  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Métricas globais da plataforma' })
  async stats() {
    return this.getStatsUseCase.execute();
  }

  // ── Agencies ────────────────────────────────────────────────────────────────

  @UseGuards(SuperAdminGuard)
  @Get('agencies')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista todas as agências' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'plan', required: false, enum: AgencyPlan })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async listAgencies(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('plan') plan?: AgencyPlan,
    @Query('isActive') isActiveRaw?: string,
  ) {
    const isActive =
      isActiveRaw === undefined ? undefined : isActiveRaw === 'true';
    return this.listAgenciesUseCase.execute({ page, limit, search, plan, isActive });
  }

  @UseGuards(SuperAdminGuard)
  @Post('agencies')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria uma nova agência provisionada pelo admin' })
  async createAgency(@Body() dto: CreateAgencyBySuperAdminDto) {
    return this.createAgencyUseCase.execute(dto);
  }

  @UseGuards(SuperAdminGuard)
  @Get('agencies/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalhe de uma agência' })
  async getAgency(@Param('id', ParseUUIDPipe) id: string) {
    return this.getAgencyUseCase.execute(id);
  }

  @UseGuards(SuperAdminGuard)
  @Get('agencies/:id/delete-preview')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Preview do que será removido ao excluir agência' })
  async deletePreview(@Param('id', ParseUUIDPipe) id: string) {
    return this.deleteAgencyUseCase.getPreview(id);
  }

  @UseGuards(SuperAdminGuard)
  @Get('agencies/:id/users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Usuários de uma agência' })
  async agencyUsers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.listUsersUseCase.execute({ page, limit, search, agencyIdFilter: id });
  }

  @UseGuards(SuperAdminGuard)
  @Get('agencies/:id/companies')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Empresas de uma agência' })
  async agencyCompanies(@Param('id', ParseUUIDPipe) id: string) {
    return this.listAgencyCompaniesUseCase.execute(id);
  }

  @UseGuards(SuperAdminGuard)
  @Get('agencies/:id/integrations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Integrações de uma agência' })
  async agencyIntegrations(@Param('id', ParseUUIDPipe) id: string) {
    return this.listAgencyIntegrationsUseCase.execute(id);
  }

  @UseGuards(SuperAdminGuard)
  @Patch('agencies/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza dados de uma agência' })
  async updateAgency(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgencyDto,
  ) {
    return this.updateAgencyUseCase.execute(id, dto);
  }

  @UseGuards(SuperAdminGuard)
  @Delete('agencies/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove permanentemente uma agência e todos seus dados' })
  async deleteAgency(@Param('id', ParseUUIDPipe) id: string) {
    return this.deleteAgencyUseCase.execute(id);
  }

  // ── Users ───────────────────────────────────────────────────────────────────

  @UseGuards(SuperAdminGuard)
  @Get('users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista usuários de todas as agências' })
  async listUsers(@Query() query: ListUsersQueryDto) {
    return this.listUsersUseCase.execute(query);
  }

  @UseGuards(SuperAdminGuard)
  @Patch('users/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza role ou status de um usuário' })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.updateUserUseCase.execute(id, dto);
  }

  // ── Audit Logs ──────────────────────────────────────────────────────────────

  @UseGuards(SuperAdminGuard)
  @Get('audit-logs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista logs de atividade de todas as agências' })
  async listAuditLogs(@Query() query: ListAuditLogsQueryDto) {
    return this.listAuditLogsUseCase.execute(query);
  }

  @UseGuards(SuperAdminGuard)
  @Get('agencies/:id/audit-logs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista logs de atividade de uma agência' })
  async agencyAuditLogs(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListAuditLogsQueryDto,
  ) {
    return this.listAuditLogsUseCase.execute({ ...query, agencyIdFilter: id });
  }
}
