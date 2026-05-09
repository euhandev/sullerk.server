import { CardMultiplierType, CardRuleKey } from '@prisma/client';
import { IsEnum, IsNumber, IsArray, ValidateNested, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CardRuleDto {
  @ApiProperty({ enum: CardRuleKey })
  @IsEnum(CardRuleKey)
  ruleKey: CardRuleKey;

  @ApiProperty()
  @IsNumber()
  multiplier: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CardGroupDto {
  @ApiProperty({ enum: CardMultiplierType })
  @IsEnum(CardMultiplierType)
  groupType: CardMultiplierType;

  @ApiProperty({ type: [CardRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CardRuleDto)
  rules: CardRuleDto[];
}

export class UpdateCardRulesDto {
  @ApiProperty({ type: [CardGroupDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CardGroupDto)
  groups: CardGroupDto[];
}
