import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/modules/auth/auth.decorator';
import { PrismaService } from '@/helper/prisma.service';
import { ConfigService } from '@/config/config.service';
import * as pkg from '../../package.json';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Welcome Message' })
  getHello(): string {
    return `Welcome to ${pkg.name} API! Visit /api for documentation.`;
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Detailed System Health Check' })
  async getHealth() {
    const dbStatus = await this.checkDatabase();
    const status = dbStatus ? 'pass' : 'fail';

    return {
      status,
      timestamp: new Date().toISOString(),
      serviceId: pkg.name,
      version: pkg.version,
      environment: this.config.get('NODE_ENV') || 'development',
      description: pkg.description || 'Sullerk API Health Check',
      uptime: process.uptime(),
      checks: {
        database: {
          status: dbStatus ? 'pass' : 'fail',
          componentType: 'database',
          componentId: 'mongodb',
        },
      },
      metrics: {
        memory: this.getMemoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
      },
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      // For MongoDB with Prisma, we can do a simple query or $runCommand
      await this.prisma.$runCommandRaw({ ping: 1 });
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  private getMemoryUsage() {
    const used = process.memoryUsage();
    const toMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

    return {
      rss: `${toMB(used.rss)} MB`,
      heapTotal: `${toMB(used.heapTotal)} MB`,
      heapUsed: `${toMB(used.heapUsed)} MB`,
      external: `${toMB(used.external)} MB`,
    };
  }
}
