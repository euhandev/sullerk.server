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
import { CommunityCommentService } from './community-comment.service';
import { CreateCommunityCommentDto } from './dto/create-community-comment.dto';
import { UpdateCommunityCommentDto } from './dto/update-community-comment.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseService } from '@/utils/response';
import { Request } from 'express';

@Controller('community-comments')
export class CommunityCommentController {
  constructor(
    private readonly communityCommentService: CommunityCommentService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async create(@Req() req: Request, @Body() paylaod: CreateCommunityCommentDto) {
    const result = await this.communityCommentService.create(req, paylaod);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: `CommunityComment created successfully`,
      data: result,
    });
  }

  @Get()
  async findAll(@Req() req: Request) {
    const result = await this.communityCommentService.findAll(req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityComments retrieved successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.communityCommentService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityComment retrieved successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() paylaod: UpdateCommunityCommentDto,
  ) {
    const result = await this.communityCommentService.update(req, id, paylaod);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityComment updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const result = await this.communityCommentService.remove(req, id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityComment deleted successfully`,
      data: result,
    });
  }
}
