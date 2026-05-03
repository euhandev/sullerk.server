import { ApiError } from '@/utils/api_error';
import { PipeTransform, Injectable, ArgumentMetadata, HttpStatus } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ParseDataPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    try {
      console.log(value);
      // Step 1: If `value.data` is a string, parse it.
      const parsedData = typeof value?.data === 'string' ? JSON.parse(value.data) : value;

      // Step 2: Apply class-validator on the parsed object
      if (metadata.metatype && typeof metadata.metatype === 'function') {
        const dtoObject = plainToInstance(metadata.metatype, parsedData);
        const errors = await validate(dtoObject, {
          whitelist: true,
          forbidNonWhitelisted: true,
        });

        if (errors.length > 0) {
          throw new ApiError(HttpStatus.BAD_REQUEST, 'Validation failed');
        }

        return dtoObject;
      }

      // Fallback
      return parsedData;
    } catch (error) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        error.message || 'Invalid data format or structure',
      );
    }
  }
}
