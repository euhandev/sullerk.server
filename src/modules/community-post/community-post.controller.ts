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
} from '@nestjs/common';
import { CommunityPostService } from './community-post.service';
import { CreateCommunityPostDto } from './dto/create-community-post.dto';
import { UpdateCommunityPostDto } from './dto/update-community-post.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseService } from '@/utils/response';
import { Request } from 'express';

@Controller('community-posts')
export class CommunityPostController {
  constructor(
    private readonly communityPostService: CommunityPostService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async create(@Req() req: Request, @Body() paylaod: CreateCommunityPostDto) {
    const result = await this.communityPostService.create(req, paylaod);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: `CommunityPost created successfully`,
      data: result,
    });
  }

  @Get()
  async findAll(@Req() req: Request) {
    const result = await this.communityPostService.findAll(req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityPosts retrieved successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.communityPostService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityPost retrieved successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async update(@Req() req: Request, @Param('id') id: string, @Body() paylaod: UpdateCommunityPostDto) {
    const result = await this.communityPostService.update(req, id, paylaod);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityPost updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const result = await this.communityPostService.remove(req, id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityPost deleted successfully`,
      data: result,
    });
  }
}
