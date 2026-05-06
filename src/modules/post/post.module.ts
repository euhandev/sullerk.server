import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PrismaService } from '@/helper/prisma.service';
import { FileService } from '@/helper/file.service';

@Module({
  controllers: [PostController],
  providers: [PostService, PrismaService, FileService],
  exports: [PostService],
})
export class PostModule {}
