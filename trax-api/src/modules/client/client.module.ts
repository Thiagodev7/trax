import { Module } from '@nestjs/common';
import { ClientController } from './presentation/client.controller';
import { ListClientsUseCase } from './application/use-cases/list-clients.use-case';
import { CreateClientUseCase } from './application/use-cases/create-client.use-case';
import { GetClientUseCase } from './application/use-cases/get-client.use-case';
import { UpdateClientUseCase } from './application/use-cases/update-client.use-case';
import { DeleteClientUseCase } from './application/use-cases/delete-client.use-case';

@Module({
  controllers: [ClientController],
  providers: [
    ListClientsUseCase,
    CreateClientUseCase,
    GetClientUseCase,
    UpdateClientUseCase,
    DeleteClientUseCase,
  ],
})
export class ClientModule {}
