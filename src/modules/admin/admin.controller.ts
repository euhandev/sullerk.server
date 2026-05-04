import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../roles/roles.decorator';
import { ResponseService } from '@/utils/response';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { ParseFormDataInterceptor } from '@/helper/form_data_interceptor';
import { FileService } from '../../helper/file.service';
import { Role } from '@prisma/client';
import { FileInterceptorInmemory } from '@/helper/file_interceptor_inmemorty';

@Controller('admins')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly fileService: FileService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.adminService.findAll(query);

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Admins Found successfully',
      meta: result?.meta,
      data: result?.data,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findOne(@Param('id') id: string) {
    const result = await this.adminService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Admin Found successfully',
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptorInmemory([{ name: 'avatar', maxCount: 1 }]),
    ParseFormDataInterceptor,
  )
  async update(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
  ) {
    let avatar: string | undefined;

    const uploadableFiles = files?.avatar;

    if (Array.isArray(uploadableFiles) && uploadableFiles?.length > 0) {
      const uploaded = await this.fileService.uploadMultipleToCloudinary(
        uploadableFiles,
        'avatars',
      );
      avatar = uploaded[0];
    }

    const result = await this.adminService.update(id, updateAdminDto, avatar);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Admin Updated successfully',
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    const result = await this.adminService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Admin Deleted successfully',
      data: result,
    });
  }
}
