import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { CronJob } from 'cron';
import { PrismaService } from './prisma.service';
import { CapacityStatus } from '@prisma/client';

@Injectable()
export class CronJobService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CronJobService.name);
  private jobs: CronJob[] = [];

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // 2️⃣ ✅ NEW: Weekly Sunday Reset - Every Sunday at 00:00 Sweden Time
    const weeklyResetJob = new CronJob(
      '0 0 0 * * 0', // sec min hour day month weekday (0 = Sunday)
      async () => {
        this.logger.log('🔄 Weekly Advisor Reset Cron job started');
        await this.resetAdvisorWeeklyCapacity();
        this.logger.log('✅ Weekly Advisor Reset Cron job finished');
      },
      null,
      true,
    );

    // Store jobs so we can stop them later
    this.jobs.push(weeklyResetJob);

    this.logger.log('📅 Cron jobs initialized successfully');
  }

  onModuleDestroy() {
    this.logger.log('🛑 Stopping all cron jobs...');
    this.jobs.forEach((job) => job.stop());
    this.logger.log('✅ All cron jobs stopped');
  }

  // ✅ NEW: Reset all advisors' weekly capacity every Sunday
  private async resetAdvisorWeeklyCapacity() {
    try {
      const resetTime = new Date();

      // Update ALL advisors: set capacityStatus=AVAILABLE and maxReferralsPerWeek=4
      const result = await this.prisma.advisor.updateMany({
        where: {},
        data: {
          currentCapacity: CapacityStatus.AVAILABLE,
          maxReferralsPerWeek: 4,
          updatedAt: resetTime,
        },
      });

      this.logger.log(
        `📊 Weekly capacity reset complete: ${result.count} advisors updated at ${resetTime.toISOString()}`,
      );

      if (result.count > 0) {
        const updatedAdvisors = await this.prisma.advisor.findMany({
          where: { updatedAt: { equals: resetTime } },
          select: { id: true, fullName: true, currentCapacity: true, maxReferralsPerWeek: true },
          take: 10,
        });
        this.logger.debug(`📋 Sample updated advisors: ${JSON.stringify(updatedAdvisors)}`);
      }

      return { success: true, count: result.count };
    } catch (error) {
      this.logger.error('❌ Failed to reset advisor weekly capacity', error);
      // Optional: Send alert to admin/monitoring system
      // await this.alertService.sendAdminAlert('Advisor Capacity Reset Failed', error);
      throw error; // Re-throw if you want the job to fail visibly
    }
  }
}
