import { Module } from '@nestjs/common';
import { PriceEngineService } from './price-engine.service';
import { PriceEngineController } from './price-engine.controller';
import { PrismaModule } from '@/helper/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PriceEngineController],
  providers: [PriceEngineService],
  exports: [PriceEngineService],
})
export class PriceEngineModule {}
