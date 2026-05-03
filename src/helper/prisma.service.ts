import { Injectable, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
  constructor() {
    super({
      log: ['error', 'warn'], // You can include 'query' in dev only
      transactionOptions: {
        maxWait: 10000,
        timeout: 30000,
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      // 🔌 Database Connection (Prisma)
      console.log('🔌 Database: Connected to MongoDB via Prisma');
    } catch (error) {
      console.log(error);
    }
  }

  async onApplicationShutdown(signal: string) {
    try {
      await this.$disconnect();
      console.log('👋 Database disconnected gracefully. Signal:', signal);
    } catch (error) {
      console.log(error);
    }
  }
}
