import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaService } from '@/helper/prisma.service';
import { StripeService } from '@/helper/stripe.service';
import { ConfigService } from '@/config/config.service';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, PrismaService, StripeService, ConfigService],
})
export class PaymentModule {}
