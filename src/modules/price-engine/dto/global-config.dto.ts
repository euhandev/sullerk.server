import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGlobalConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  platformFeePercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sellerAdjustRangePercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  apiRecalcIntervalGames?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
