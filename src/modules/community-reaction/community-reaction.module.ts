import { Module } from '@nestjs/common';
import { CommunityReactionService } from './community-reaction.service';
import { CommunityReactionController } from './community-reaction.controller';

@Module({
  controllers: [CommunityReactionController],
  providers: [CommunityReactionService],
})
export class CommunityReactionModule {}
