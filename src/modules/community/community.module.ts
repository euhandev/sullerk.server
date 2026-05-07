import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { PrismaService } from '@/helper/prisma.service';
import { FileService } from '@/helper/file.service';

@Module({
  controllers: [CommunityController],
  providers: [CommunityService, PrismaService, FileService],
  exports: [CommunityService],
})
export class CommunityModule {}
