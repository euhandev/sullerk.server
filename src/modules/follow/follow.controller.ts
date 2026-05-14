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

  @Get('followers/:customerId')
  async getFollowers(@Param('customerId') customerId: string, @Query() query: any) {
    const result = await this.followService.getFollowers(customerId, query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Followers retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  }

  @Get('following/:customerId')
  async getFollowing(@Param('customerId') customerId: string, @Query() query: any) {
    const result = await this.followService.getFollowing(customerId, query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Following retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  }

  @Get('mutual/:targetCustomerId')
  async getMutualFollows(
    @Param('targetCustomerId') targetCustomerId: string,
    @Req() req: any,
    @Query() query: any,
  ) {
    const result = await this.followService.getMutualFollows(req.user.id, targetCustomerId, query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Mutual followers retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  }

  @Get('is-followed/:targetCustomerId')
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  async isFollowed(@Param('targetCustomerId') targetCustomerId: string, @Req() req: any) {
    const result = await this.followService.isFollowed(req.user.id, targetCustomerId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Following status retrieved successfully',
      data: result,
    });
  }

  @Get('counts/:customerId')
  async getCounts(@Param('customerId') customerId: string) {
    const result = await this.followService.getFollowCounts(customerId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Follow counts retrieved successfully',
      data: result,
    });
  }
}
