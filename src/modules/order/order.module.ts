import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaService } from '@/helper/prisma.service';
import { StripeService } from '@/helper/stripe.service';
import { ConfigService } from '@/config/config.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, PrismaService, StripeService, ConfigService],
  exports: [OrderService],
})
export class OrderModule {}
