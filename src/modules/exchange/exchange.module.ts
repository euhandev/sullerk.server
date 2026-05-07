import { Module } from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import { ExchangeController } from './exchange.controller';
import { StripeService } from '@/helper/stripe.service';
import { ConfigService } from '@/config/config.service';

@Module({
  controllers: [ExchangeController],
  providers: [ExchangeService, StripeService, ConfigService],
  exports: [ExchangeService],
})
export class ExchangeModule {}
