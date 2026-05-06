import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/modules/auth/auth.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Welcome Message' })
  getHello(): string {
    return 'Welcome to Sullerk API! Visit /api for documentation.';
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Server Health Check' })
  getHealth() {
    return {
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
