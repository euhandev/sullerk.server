import { Module } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { DisputeController } from './dispute.controller';
import { PrismaService } from '@/helper/prisma.service';

@Module({
  controllers: [DisputeController],
  providers: [DisputeService, PrismaService],
})
export class DisputeModule {}
