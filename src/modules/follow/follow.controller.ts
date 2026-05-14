import { Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { FollowService } from './follow.service';
import { ResponseService } from '@/utils/response';
import { HttpStatus } from '@nestjs/common';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth('JWT-auth')
@ApiTags('Follows')
@Controller('follows')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post('toggle/:identifier')
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  async toggleFollow(@Param('identifier') identifier: string, @Req() req: any) {
    const result = await this.followService.toggleFollow(req.user.id, identifier);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: result.message,
      data: result,
    });
  }

  @Get('followers/:userId')
  async getFollowers(@Param('userId') userId: string, @Query() query: any) {
    const result = await this.followService.getFollowers(userId, query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Followers retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  }

  @Get('following/:userId')
  async getFollowing(@Param('userId') userId: string, @Query() query: any) {
    const result = await this.followService.getFollowing(userId, query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Following retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  }

  @Get('mutual/:targetUserId')
  async getMutualFollows(
    @Param('targetUserId') targetUserId: string,
    @Req() req: any,
    @Query() query: any,
  ) {
    const result = await this.followService.getMutualFollows(req.user.id, targetUserId, query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Mutual followers retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  }

  @Get('counts/:userId')
  async getCounts(@Param('userId') userId: string) {
    const result = await this.followService.getFollowCounts(userId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Follow counts retrieved successfully',
      data: result,
    });
  }
}
