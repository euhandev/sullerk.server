import { Module } from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import { ExchangeController } from './exchange.controller';
import { PrismaService } from '@/helper/prisma.service';
import { StripeService } from '@/helper/stripe.service';
import { ConfigService } from '@/config/config.service';

@Module({
  controllers: [ExchangeController],
  providers: [ExchangeService, PrismaService, StripeService, ConfigService],
  exports: [ExchangeService],
})
export class ExchangeModule {}
