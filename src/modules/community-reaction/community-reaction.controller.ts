import { Controller, Get, Post, Body, Param, Delete, HttpStatus, Req } from '@nestjs/common';
import { CommunityReactionService } from './community-reaction.service';
import { CreateCommunityReactionDto } from './dto/create-community-reaction.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseService } from '@/utils/response';
import { Request } from 'express';

@Controller('community-reactions')
export class CommunityReactionController {
  constructor(private readonly communityReactionService: CommunityReactionService) {}

  @Post('toggle')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async toggle(@Req() req: Request, @Body() paylaod: CreateCommunityReactionDto) {
    const result = await this.communityReactionService.toggleReaction(req, paylaod);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Reaction toggled successfully`,
      data: result,
    });
  }

  @Get()
  async findAll(@Req() req: Request) {
    const result = await this.communityReactionService.findAll(req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityReactions retrieved successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.communityReactionService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityReaction retrieved successfully`,
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const result = await this.communityReactionService.remove(req, id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityReaction deleted successfully`,
      data: result,
    });
  }
}
