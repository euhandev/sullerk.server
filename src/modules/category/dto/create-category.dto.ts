import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReferralPathType } from '@prisma/client';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Wills Fundamentals', description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'wills-fundamentals', description: 'URL slug' })
  @IsOptional()
  @IsString()
  slug: string;

  @ApiProperty({ example: 'Basic wills knowledge', description: 'Description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Basic wills knowledge', description: 'Thumbnail url', required: false })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiProperty({ example: 0, description: 'Display order', required: false })
  @IsOptional()
  @IsInt()
  order?: number = 0;

  @ApiProperty({ example: 'All segments', description: 'Target audience', required: false })
  @IsOptional()
  @IsString()
  targetAudience?: string;

  @ApiProperty({
    enum: ReferralPathType,
    default: ReferralPathType.ESTATE_PLANNING,
    required: false,
  })
  @IsOptional()
  @IsEnum(ReferralPathType)
  referralPath?: ReferralPathType = ReferralPathType.ESTATE_PLANNING;
}
