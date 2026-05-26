import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseUUIDPipe, Version, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentTenant } from '@common/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@common/decorators/current-user.decorator';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersUseCase } from '../application/use-cases/list-users.use-case';
import { InviteUserUseCase } from '../application/use-cases/invite-user.use-case';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../application/use-cases/delete-user.use-case';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly listUsers: ListUsersUseCase,
    private readonly inviteUser: InviteUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly deleteUser: DeleteUserUseCase,
  ) {}

  @Get()
  @Version('1')
  @Roles(UserRole.AGENCY_ADMIN)
  @ApiOperation({ summary: 'Lista todos os usuários da agência' })
  findAll(@CurrentTenant('agencyId') agencyId: string) {
    return this.listUsers.execute(agencyId);
  }

  @Post('invite')
  @Version('1')
  @Roles(UserRole.AGENCY_ADMIN)
  @ApiOperation({ summary: 'Convida (cria) um novo usuário na agência' })
  invite(
    @CurrentTenant('agencyId') agencyId: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.inviteUser.execute(agencyId, dto);
  }

  @Patch(':id')
  @Version('1')
  @Roles(UserRole.AGENCY_ADMIN)
  @ApiOperation({ summary: 'Atualiza role, status ou clientes de um usuário' })
  update(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.updateUser.execute(agencyId, id, dto);
  }

  @Delete(':id')
  @Version('1')
  @Roles(UserRole.AGENCY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove (desativa) um usuário da agência' })
  remove(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deleteUser.execute(agencyId, id, user.sub);
  }
}
