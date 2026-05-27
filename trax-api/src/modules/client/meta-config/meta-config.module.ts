import { Module } from '@nestjs/common';
import { MetaConfigController } from './meta-config.controller';
import { MetaConfigService } from './meta-config.service';

@Module({
  controllers: [MetaConfigController],
  providers: [MetaConfigService],
  exports: [MetaConfigService],
})
export class MetaConfigModule {}
