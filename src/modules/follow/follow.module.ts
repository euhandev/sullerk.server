import { Module } from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { NotificationModule } from '../notification/notification.module';
import { NotificationService } from '../notification/notification.service';

@Module({
  imports: [NotificationModule],
  controllers: [FollowController],
  providers: [FollowService, NotificationService],
  exports: [FollowService],
})
export class FollowModule {}
