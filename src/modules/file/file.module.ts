import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { FileService as FileServiceProvider } from '@/helper/file.service';
import { FileListener } from './file.listener';

@Module({
  controllers: [FileController],
  providers: [FileService, FileServiceProvider, FileListener],
  exports: [FileServiceProvider],
})
export class FileModule {}
