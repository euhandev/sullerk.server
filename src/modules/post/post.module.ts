import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PrismaService } from '@/helper/prisma.service';
import { FileService } from '@/helper/file.service';
import { CommentService } from '../comment/comment.service';
import { PostListener } from './post.listener';

@Module({
  controllers: [PostController],
  providers: [PostService, CommentService, PostListener, PrismaService, FileService],
  exports: [PostService],
})
export class PostModule {}
