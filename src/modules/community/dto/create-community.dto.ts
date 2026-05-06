import { ApiProperty } from '@nestjs/swagger';
import { CommunityType } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommunityDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsEnum(CommunityType)
  type: CommunityType;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
