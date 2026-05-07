import { Controller, Get, Post, Body, Param, Delete, HttpStatus, Req } from '@nestjs/common';
import { CommunityRepostService } from './community-repost.service';
import { CreateCommunityRepostDto } from './dto/create-community-repost.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseService } from '@/utils/response';
import { Request } from 'express';

@Controller('community-reposts')
export class CommunityRepostController {
  constructor(private readonly communityRepostService: CommunityRepostService) {}

  @Post('toggle')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async toggle(@Req() req: Request, @Body() paylaod: CreateCommunityRepostDto) {
    const result = await this.communityRepostService.toggleRepost(req, paylaod);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Repost toggled successfully`,
      data: result,
    });
  }

  @Get()
  async findAll(@Req() req: Request) {
    const result = await this.communityRepostService.findAll(req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityReposts retrieved successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.communityRepostService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityRepost retrieved successfully`,
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const result = await this.communityRepostService.remove(req, id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityRepost deleted successfully`,
      data: result,
    });
  }
}
