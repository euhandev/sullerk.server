import { ApiEffectType } from '@prisma/client';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiRuleItemDto {
  @ApiProperty()
  @IsString()
  metricKey: string;

  @ApiProperty({ enum: ApiEffectType })
  @IsEnum(ApiEffectType)
  effectType: ApiEffectType;

  @ApiProperty()
  @IsNumber()
  adjustmentPercent: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateApiRulesDto {
  @ApiProperty({ type: [ApiRuleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApiRuleItemDto)
  rules: ApiRuleItemDto[];
}
