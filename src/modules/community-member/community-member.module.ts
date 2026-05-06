import { Module } from '@nestjs/common';
import { CommunityMemberService } from './community-member.service';
import { CommunityMemberController } from './community-member.controller';

@Module({
  controllers: [CommunityMemberController],
  providers: [CommunityMemberService],
})
export class CommunityMemberModule {}
