import { Module } from '@nestjs/common';
import { CommunityStarredPostService } from './community-starred-post.service';
import { CommunityStarredPostController } from './community-starred-post.controller';

@Module({
  controllers: [CommunityStarredPostController],
  providers: [CommunityStarredPostService],
})
export class CommunityStarredPostModule {}
