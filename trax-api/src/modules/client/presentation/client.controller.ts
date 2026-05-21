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
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ListClientsUseCase } from '../application/use-cases/list-clients.use-case';
import { CreateClientUseCase } from '../application/use-cases/create-client.use-case';
import { GetClientUseCase } from '../application/use-cases/get-client.use-case';
import { UpdateClientUseCase } from '../application/use-cases/update-client.use-case';
import { DeleteClientUseCase } from '../application/use-cases/delete-client.use-case';

@ApiBearerAuth()
@ApiTags('Clients')
@Controller('clients')
export class ClientController {
  constructor(
    private readonly listClients: ListClientsUseCase,
    private readonly createClient: CreateClientUseCase,
    private readonly getClient: GetClientUseCase,
    private readonly updateClient: UpdateClientUseCase,
    private readonly deleteClient: DeleteClientUseCase,
  ) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Lista clientes da agência (filtrado por role)' })
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
    return this.listClients.execute({ agencyId, user, page, limit, search });
  }

  @Get(':id')
  @Version('1')
  @ApiOperation({ summary: 'Busca cliente por ID' })
  async findOne(
    @CurrentTenant('agencyId') agencyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.getClient.execute({ agencyId, clientId: id, user });
  }

  @Post()
  @Version('1')
  @Roles(UserRole.AGENCY_ADMIN)
  @ApiOperation({ summary: 'Cria novo cliente (somente AGENCY_ADMIN)' })
  async create(
    @CurrentTenant('agencyId') agencyId: string,
    @Body() dto: CreateClientDto,
  ) {
    return this.createClient.execute(agencyId, dto);
  }

  @Patch(':id')
  @Version('1')
  @Roles(UserRole.AGENCY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualiza cliente (somente AGENCY_ADMIN)' })
  async update(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.updateClient.execute(agencyId, id, dto);
  }

  @Delete(':id')
  @Version('1')
  @Roles(UserRole.AGENCY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativa cliente (soft-delete, somente AGENCY_ADMIN)' })
  async remove(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deleteClient.execute(agencyId, id);
  }
}
