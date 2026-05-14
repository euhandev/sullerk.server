import { Module } from '@nestjs/common';
import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';
import { FileModule } from '../file/file.module';
import { PriceEngineModule } from '../price-engine/price-engine.module';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@/config/config.module';
import { ConfigService } from '@/config/config.service';

@Module({
  imports: [
    FileModule,
    PriceEngineModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        limits: {
          fileSize: configService.getFileLimit('video') * 1024 * 1024,
        },
      }),
    }),
  ],
  controllers: [ListingController],
  providers: [ListingService],
  exports: [ListingService],
})
export class ListingModule {}
