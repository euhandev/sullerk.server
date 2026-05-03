import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { FileService } from '@/helper/file.service';

@Module({
  controllers: [CategoryController],
  providers: [FileService, CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
