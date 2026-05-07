import { FileService as FileServiceProvider } from '@/helper/file.service';
// import { CustomFileFieldsInterceptor } from '@/helper/file_interceptor';
import { ParseFormDataInterceptor } from '@/helper/form_data_interceptor';
import { ResponseService } from '@/utils/response';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { Roles } from '../roles/roles.decorator';
import { UpdateFileDto } from './dto/update-file.dto';
import { FileService } from './file.service';
import { FileInterceptorInmemory } from '@/helper/file_interceptor_inmemorty';
import { CreateFileDto } from './dto/create-file.dto';

@Controller('files')
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private fileServiceProvider: FileServiceProvider,
  ) {}

  @Post('upload')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptorInmemory([{ name: 'files', maxCount: 10 }]),
    ParseFormDataInterceptor,
  )
  async upload(@UploadedFiles() files: Record<string, Express.Multer.File[]>) {
    let uploadedFiles: any[] | null = null;

    const uploadableFiles = files?.files;

    if (uploadableFiles)
      uploadedFiles = await this.fileServiceProvider.uploadMultipleToDigitalOcean(
        uploadableFiles,
        'memory',
      );

    console.log(`see uploaded files`, uploadableFiles);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Files Created successfully`,
      data: uploadedFiles,
    });
  }

  @Get()
  async findAll(@Req() req: Request) {
    const result = await this.fileService.findAll(req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Files retrieved successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.fileService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `File retrieved successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async update(@Param('id') id: string, @Body() updateFileDto: UpdateFileDto) {
    const result = await this.fileService.update(id, updateFileDto);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `File updated successfully`,
      data: result,
    });
  }

  @Delete('multiple')
  @Roles(
    Role.ADMIN,
    Role.SUPER_ADMIN,

    Role.CUSTOMER,
  )
  async deleteFiles(@Body('urls') urls: string[]) {
    if (!urls || urls.length === 0) {
      return ResponseService.formatResponse({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'No file URLs provided for deletion',
      });
    }

    const deletedFiles = await this.fileServiceProvider.deleteMultipleFromDigitalOcean(urls);

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Files deleted successfully',
      data: deletedFiles,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    const result = await this.fileService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `File deleted successfully`,
      data: result,
    });
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async create(@Body() createFileDto: CreateFileDto) {
    const result = await this.fileService.create(createFileDto);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: 'File record created successfully',
      data: result,
    });
  }
}
