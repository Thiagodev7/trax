import { Module } from '@nestjs/common';
import { SchedulingController } from './presentation/scheduling.controller';
import { SchedulingService } from './application/scheduling.service';
import { PublishScheduledPostsScheduler } from './application/publish-scheduled-posts.scheduler';

@Module({
  controllers: [SchedulingController],
  providers: [SchedulingService, PublishScheduledPostsScheduler],
})
export class SchedulingModule {}
