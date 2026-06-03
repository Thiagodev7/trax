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
import { CurrentTenant } from '@common/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@common/decorators/current-user.decorator';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ListCompaniesUseCase } from '../application/use-cases/list-companies.use-case';
import { CreateCompanyUseCase } from '../application/use-cases/create-company.use-case';
import { GetCompanyUseCase } from '../application/use-cases/get-company.use-case';
import { UpdateCompanyUseCase } from '../application/use-cases/update-company.use-case';
import { DeleteCompanyUseCase } from '../application/use-cases/delete-company.use-case';

@ApiBearerAuth()
@ApiTags('Companies')
@Controller('companies')
export class CompanyController {
  constructor(
    private readonly listCompanies: ListCompaniesUseCase,
    private readonly createCompany: CreateCompanyUseCase,
    private readonly getCompany: GetCompanyUseCase,
    private readonly updateCompany: UpdateCompanyUseCase,
    private readonly deleteCompany: DeleteCompanyUseCase,
  ) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Lista empresas da agência (filtrado por role)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @CurrentTenant('agencyId') agencyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.listCompanies.execute({ agencyId, user, page, limit, search });
  }

  @Get(':id')
  @Version('1')
  @ApiOperation({ summary: 'Busca empresa por ID' })
  async findOne(
    @CurrentTenant('agencyId') agencyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.getCompany.execute({ agencyId, companyId: id, user });
  }

  @Post()
  @Version('1')
  @Roles(UserRole.AGENCY_ADMIN)
  @ApiOperation({ summary: 'Cria nova empresa (somente AGENCY_ADMIN)' })
  async create(
    @CurrentTenant('agencyId') agencyId: string,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.createCompany.execute(agencyId, dto);
  }

  @Patch(':id')
  @Version('1')
  @Roles(UserRole.AGENCY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualiza empresa (somente AGENCY_ADMIN)' })
  async update(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.updateCompany.execute(agencyId, id, dto);
  }

  @Delete(':id')
  @Version('1')
  @Roles(UserRole.AGENCY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativa empresa (soft-delete, somente AGENCY_ADMIN)' })
  async remove(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deleteCompany.execute(agencyId, id);
  }
}
