import { Module } from '@nestjs/common';
import { CommunityRepostService } from './community-repost.service';
import { CommunityRepostController } from './community-repost.controller';

@Module({
  controllers: [CommunityRepostController],
  providers: [CommunityRepostService],
})
export class CommunityRepostModule {}
