import { FileService } from '@/helper/file.service';
import { FileInterceptorInmemory } from '@/helper/file_interceptor_inmemorty';
import { ParseFormDataInterceptor } from '@/helper/form_data_interceptor';
import { ResponseService } from '@/utils/response';
import {
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../roles/roles.decorator';
import { RoomService } from './room.service';

@Controller('rooms')
export class RoomController {
  constructor(
    private readonly RoomService: RoomService,
    private readonly fileService: FileService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async findAll(@Req() req: Request) {
    const result = await this.RoomService.findAll(req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `all Rooms found successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async findOne(@Param('id') id: string) {
    const result = await this.RoomService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `single Room found successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  @UseInterceptors(
    FileInterceptorInmemory([{ name: 'img', maxCount: 1 }]),
    ParseFormDataInterceptor,
  )
  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async remove(@Param('id') id: string) {
    const result = await this.RoomService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Room deleted successfully`,
      data: result,
    });
  }
}
