import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { FileService as FileServiceProvider } from '@/helper/file.service';

@Module({
  controllers: [FileController],
  providers: [FileService, FileServiceProvider],
})
export class FileModule {}
