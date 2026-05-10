import { Module } from '@nestjs/common';
import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';
import { FileModule } from '../file/file.module';
import { PriceEngineModule } from '../price-engine/price-engine.module';

@Module({
  imports: [FileModule, PriceEngineModule],
  controllers: [ListingController],
  providers: [ListingService],
})
export class ListingModule {}
