import { Controller, Get, HttpStatus, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ResponseService } from '@/utils/response';
import { Request } from 'express';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(`admin`)
  @Roles(Role.ADMIN)
  async adminAnalytics(@Req() req: Request) {
    const user: any = req?.user;
    const result = await this.analyticsService.adminAnalytics(user);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `admin analytics retrieved successfully`,
      data: result,
    });
  }
}
