import { Module } from '@nestjs/common';
import { UserController } from './presentation/user.controller';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { InviteUserUseCase } from './application/use-cases/invite-user.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';

@Module({
  controllers: [UserController],
  providers: [
    ListUsersUseCase,
    InviteUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
  ],
})
export class UserModule {}
