import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HonourItemDto {
  @ApiProperty()
  @IsString()
  honourKey: string;

  @ApiProperty()
  @IsNumber()
  multiplier: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateHonoursDto {
  @ApiProperty({ type: [HonourItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HonourItemDto)
  honours: HonourItemDto[];
}
