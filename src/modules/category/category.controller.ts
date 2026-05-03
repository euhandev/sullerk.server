/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Req,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseService } from '@/utils/response';
import { Request } from 'express';
import { Public } from '../auth/auth.decorator';
import { FileInterceptorInmemory } from '@/helper/file_interceptor_inmemorty';
import { ApiError } from '@/utils/api_error';
import { plainToInstance } from 'class-transformer';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(FileInterceptorInmemory([{ name: 'thumbnail', maxCount: 1 }]))
  async create(
    @Body('data') data: string,
    @UploadedFiles() files: { thumbnail?: Express.Multer.File[] },
  ) {
    if (!data) throw new ApiError(HttpStatus.BAD_REQUEST, 'Payload data is required in formData');
    let payloadParsed;
    try {
      payloadParsed = JSON.parse(data);
    } catch (error) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid JSON data payload');
    }
    const payload = plainToInstance(CreateCategoryDto, payloadParsed);
    const result = await this.categoryService.create(payload, files);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: `Category created successfully`,
      data: result,
    });
  }

  @Public()
  @Get()
  async findAll(@Req() req: Request) {
    const result = await this.categoryService.findAll(req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Categorys retrieved successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const result = await this.categoryService.findOne(id, req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Category retrieved successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(FileInterceptorInmemory([{ name: 'thumbnail', maxCount: 1 }]))
  async update(
    @Param('id') id: string,
    @Body('data') data: string,
    @UploadedFiles() files?: { thumbnail?: Express.Multer.File[] },
  ) {
    let payloadParsed = {};
    if (data) {
      try {
        payloadParsed = JSON.parse(data);
      } catch (error) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid JSON data payload');
      }
    }
    const payload = plainToInstance(UpdateCategoryDto, payloadParsed);
    const result = await this.categoryService.update(id, payload, files);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Category updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    const result = await this.categoryService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Category deleted successfully`,
      data: result,
    });
  }
}
