import { Module } from '@nestjs/common';
import { TenantController } from './presentation/tenant.controller';

@Module({
  controllers: [TenantController],
})
export class TenantModule {}
