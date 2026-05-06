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
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseService } from '@/utils/response';
import { Request } from 'express';
import { FileInterceptorInmemory } from '@/helper/file_interceptor_inmemorty';
import { ParseFormDataInterceptor } from '@/helper/form_data_interceptor';
import { FileService } from '@/helper/file.service';

@Controller('communities')
export class CommunityController {
  constructor(private readonly communityService: CommunityService, private readonly fileService: FileService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  @UseInterceptors(
      FileInterceptorInmemory([{ name: 'file', maxCount: 1 }]),
      ParseFormDataInterceptor,
    )
  async create(
    @Req() req: Request,
    @Body() paylaod: CreateCommunityDto,
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
  ) {

    let hero: string | undefined;

    const uploadableFiles = files?.file;

    if (Array.isArray(uploadableFiles) && uploadableFiles?.length > 0) {
      const uploaded = await this.fileService.uploadMultipleToCloudinary(uploadableFiles);
      hero = uploaded[0];
    }

    const result = await this.communityService.create(req, {...paylaod}, hero);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: `Community created successfully`,
      data: result,
    });
  }

  @Get()
  async findAll(@Req() req: Request) {
    const result = await this.communityService.findAll(req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Communitys retrieved successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const result = await this.communityService.findOne(req, id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Community retrieved successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  @UseInterceptors(
    FileInterceptorInmemory([{ name: 'file', maxCount: 1 }]),
    ParseFormDataInterceptor,
  )
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() paylaod: UpdateCommunityDto,
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
  ) {
    let hero: string | undefined;

    const uploadableFiles = files?.file;

    if (Array.isArray(uploadableFiles) && uploadableFiles?.length > 0) {
      const uploaded = await this.fileService.uploadMultipleToCloudinary(uploadableFiles);
      hero = uploaded[0];
    }

    const result = await this.communityService.update(req, id, paylaod, hero);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Community updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const result = await this.communityService.remove(req, id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Community deleted successfully`,
      data: result,
    });
  }
}
