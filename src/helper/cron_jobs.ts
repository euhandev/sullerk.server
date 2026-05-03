import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { CronJob } from 'cron';
import { PrismaService } from './prisma.service';

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
    
  }
}
