import { Module } from '@nestjs/common';
import { UploadController } from './presentation/upload.controller';

@Module({
  controllers: [UploadController]
})
export class UploadModule {}
