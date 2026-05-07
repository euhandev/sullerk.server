import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { DisputeType } from '@prisma/client';
import { Type } from 'class-transformer';

class FileItemDto {
  @ApiProperty()
  @IsString()
  fileId: string;

  @ApiProperty()
  @IsString()
  url: string;
}

export class CreateDisputeDto {
  @ApiPropertyOptional({ example: '69fae180e0c772d77befd5b8' })
  @IsOptional()
  @IsString()
  listingId?: string;

  @ApiPropertyOptional({ example: '69fae180e0c772d77befd5b9' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({ enum: DisputeType })
  @IsEnum(DisputeType)
  @IsNotEmpty()
  type: DisputeType;

  @ApiProperty({ example: 'Damaged Item' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ example: 'The box was crushed and the item is cracked.' })
  @IsString()
  @IsOptional()
  details?: string;

  @ApiPropertyOptional({ type: [FileItemDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FileItemDto)
  evidence?: FileItemDto[];
}
