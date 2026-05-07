import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { FileService } from '@/helper/file.service';
import { CommentService } from '../comment/comment.service';
import { PostListener } from './post.listener';

@Module({
  controllers: [PostController],
  providers: [PostService, CommentService, PostListener, FileService],
  exports: [PostService],
})
export class PostModule {}
