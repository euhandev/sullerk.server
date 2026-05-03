// config.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigService } from './config.service';

@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService], // 👈 must export so other modules can use it
})
export class ConfigModule {}
