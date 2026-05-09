import { ListingCategory } from '@prisma/client';
import { IsEnum, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BaseValueItemDto {
  @ApiProperty({ enum: ListingCategory })
  @IsEnum(ListingCategory)
  category: ListingCategory;

  @ApiProperty()
  @IsNumber()
  basePrice: number;
}

export class UpdateBaseValuesDto {
  @ApiProperty({ type: [BaseValueItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BaseValueItemDto)
  values: BaseValueItemDto[];
}
