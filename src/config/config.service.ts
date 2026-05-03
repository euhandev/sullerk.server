// @/config/config.service.ts

import { ConfigService as NestConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { EnvKey } from './config.types';

@Injectable()
export class ConfigService extends NestConfigService {
  get<T extends EnvKey>(key: T): string {
    return super.get(key);
  }
}
