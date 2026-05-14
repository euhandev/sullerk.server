import { Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { BlockService } from './block.service';
import { ResponseService } from '@/utils/response';
import { HttpStatus } from '@nestjs/common';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Blocks')
@Controller('blocks')
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @Post('toggle/:identifier')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  async toggleBlock(@Param('identifier') identifier: string, @Req() req: any) {
    const result = await this.blockService.toggleBlock(req.user.id, identifier);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: result.message,
      data: result,
    });
  }

  @Get('/')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  async getBlockedUsers(@Req() req: any, @Query() query: any) {
    const result = await this.blockService.getBlockedUsers(req.user.id, query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Blocked users retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  }

  @Get('check/:targetUserId')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  async checkBlock(@Param('targetUserId') targetUserId: string, @Req() req: any) {
    const result = await this.blockService.isBlocked(req.user.id, targetUserId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Block status checked successfully',
      data: result,
    });
  }
}
