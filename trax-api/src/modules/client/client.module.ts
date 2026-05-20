import { Module } from '@nestjs/common';
import { ClientController } from './presentation/client.controller';
import { ListClientsUseCase } from './application/use-cases/list-clients.use-case';
import { CreateClientUseCase } from './application/use-cases/create-client.use-case';
import { GetClientUseCase } from './application/use-cases/get-client.use-case';
import { UpdateClientUseCase } from './application/use-cases/update-client.use-case';

@Module({
  controllers: [ClientController],
  providers: [
    ListClientsUseCase,
    CreateClientUseCase,
    GetClientUseCase,
    UpdateClientUseCase,
  ],
})
export class ClientModule {}
