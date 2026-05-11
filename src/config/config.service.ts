// @/config/config.service.ts

import { ConfigService as NestConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { EnvKey } from './config.types';

@Injectable()
export class ConfigService extends NestConfigService {
  get<T extends EnvKey>(key: T): string {
    return super.get(key);
  }

  /**
   * Get file size limit in MB with fallbacks
   */
  getFileLimit(type: 'image' | 'video' | 'pdf'): number {
    const keyMap = {
      image: 'LISTING_IMAGE_SIZE_MB',
      video: 'LISTING_VIDEO_SIZE_MB',
      pdf: 'LISTING_PDF_SIZE_MB',
    } as const;

    const defaultLimits = {
      image: 5,
      video: 50,
      pdf: 10,
    };

    const envValue = super.get(keyMap[type]);
    return envValue ? parseInt(envValue, 10) : defaultLimits[type];
  }
}
