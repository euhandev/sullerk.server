import { Module } from '@nestjs/common';
import { CommunityPostService } from './community-post.service';
import { CommunityPostController } from './community-post.controller';
import { FileService } from '@/helper/file.service';

@Module({
  controllers: [CommunityPostController],
  providers: [CommunityPostService, FileService],
})
export class CommunityPostModule {}
