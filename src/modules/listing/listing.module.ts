import { Module } from '@nestjs/common';
import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';
import { FileModule } from '../file/file.module';

@Module({
  imports: [FileModule],
  controllers: [ListingController],
  providers: [ListingService],
})
export class ListingModule {}
