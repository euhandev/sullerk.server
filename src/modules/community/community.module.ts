import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
=======
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { PrismaService } from '@/helper/prisma.service';
>>>>>>> 4c011a9 (add post community creation module)
import { FileService } from '@/helper/file.service';

@Module({
  controllers: [CommunityController],
<<<<<<< HEAD
  providers: [CommunityService, FileService],
})
export class CommunityModule { }
=======
  providers: [CommunityService, PrismaService, FileService],
  exports: [CommunityService],
})
export class CommunityModule {}
>>>>>>> 4c011a9 (add post community creation module)
