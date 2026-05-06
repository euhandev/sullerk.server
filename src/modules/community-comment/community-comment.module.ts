import { Module } from '@nestjs/common';
import { CommunityCommentService } from './community-comment.service';
import { CommunityCommentController } from './community-comment.controller';
import { FileService } from '@/helper/file.service';

@Module({
  controllers: [CommunityCommentController],
  providers: [CommunityCommentService, FileService],
})
export class CommunityCommentModule {}
