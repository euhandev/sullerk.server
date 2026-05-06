import { Module } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { FileService } from '@/helper/file.service';

@Module({
  controllers: [CommunityController],
  providers: [CommunityService, FileService],
})
export class CommunityModule { }
