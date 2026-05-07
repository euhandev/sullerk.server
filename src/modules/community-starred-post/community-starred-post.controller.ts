import { Controller, Get, Post, Body, Param, Delete, HttpStatus, Req } from '@nestjs/common';
import { CommunityStarredPostService } from './community-starred-post.service';
import { CreateCommunityStarredPostDto } from './dto/create-community-starred-post.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseService } from '@/utils/response';
import { Request } from 'express';

@Controller('community-starred-posts')
export class CommunityStarredPostController {
  constructor(private readonly communityStarredPostService: CommunityStarredPostService) {}

  @Post('toggle')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async toggle(@Req() req: Request, @Body() paylaod: CreateCommunityStarredPostDto) {
    const result = await this.communityStarredPostService.toggleStar(req, paylaod);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Starred post toggled successfully`,
      data: result,
    });
  }

  @Get()
  async findAll(@Req() req: Request) {
    const result = await this.communityStarredPostService.findAll(req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityStarredPosts retrieved successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.communityStarredPostService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityStarredPost retrieved successfully`,
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const result = await this.communityStarredPostService.remove(req, id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityStarredPost deleted successfully`,
      data: result,
    });
  }
}
