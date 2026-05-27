import { Module } from '@nestjs/common';
import { SuperAdminController } from './presentation/super-admin.controller';
import { SuperAdminLoginUseCase } from './application/use-cases/super-admin-login.use-case';
import { ListAgenciesUseCase } from './application/use-cases/list-agencies.use-case';
import { GetStatsUseCase } from './application/use-cases/get-stats.use-case';
import { UpdateAgencyUseCase } from './application/use-cases/update-agency.use-case';
import { CreateAgencyBySuperAdminUseCase } from './application/use-cases/create-agency-by-super-admin.use-case';
import { GetAgencyUseCase } from './application/use-cases/get-agency.use-case';
import { DeleteAgencyUseCase } from './application/use-cases/delete-agency.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { GetHealthUseCase } from './application/use-cases/get-health.use-case';
import {
  GetSuperAdminMeUseCase,
  UpdateSuperAdminPasswordUseCase,
} from './application/use-cases/super-admin-profile.use-case';
import {
  ListAgencyClientsUseCase,
  ListAgencyIntegrationsUseCase,
} from './application/use-cases/list-agency-resources.use-case';
import { AuthModule } from '@modules/auth/auth.module';
import { EmailModule } from '@modules/email/email.module';

@Module({
  imports: [AuthModule, EmailModule],
  controllers: [SuperAdminController],
  providers: [
    SuperAdminLoginUseCase,
    ListAgenciesUseCase,
    GetStatsUseCase,
    UpdateAgencyUseCase,
    CreateAgencyBySuperAdminUseCase,
    GetAgencyUseCase,
    DeleteAgencyUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
    GetHealthUseCase,
    GetSuperAdminMeUseCase,
    UpdateSuperAdminPasswordUseCase,
    ListAgencyClientsUseCase,
    ListAgencyIntegrationsUseCase,
  ],
})
export class SuperAdminModule {}
