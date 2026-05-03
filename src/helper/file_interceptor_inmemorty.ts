import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

export const FileInterceptorInmemory = (fields: { name: string; maxCount?: number }[]) => {
  return FileFieldsInterceptor(fields, {
    storage: memoryStorage(), // keep files in memory
    limits: {
      fileSize: 10 * 1024 * 1024, // optional: max 10MB
    },
  });
};
