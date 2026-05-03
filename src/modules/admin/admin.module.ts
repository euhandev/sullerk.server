import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

import { FileService } from '@/helper/file.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, FileService],
})
export class AdminModule {}
