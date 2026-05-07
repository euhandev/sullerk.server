import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { StripeService } from '@/helper/stripe.service';
import { ConfigService } from '@/config/config.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, StripeService, ConfigService],
  exports: [OrderService],
})
export class OrderModule {}
