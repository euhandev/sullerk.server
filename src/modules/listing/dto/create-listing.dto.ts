import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ListingCategory, SignatureKey, ProofViewKey, COAStatus, SaleFormat } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FileItem {
  @ApiProperty({ example: '69fae180e0c772d77befd5b8', description: 'Database ID of the file' })
  fileId: string;

  @ApiProperty({
    example: 'http://localhost:8989/api/v1/files/example.webp',
    description: 'Absolute URL of the file',
  })
  url: string;
}

export class CreateListingDto {
  @ApiProperty({
    example: 'Vintage 2003 Manchester United Jersey',
    required: false,
    description: 'The title of the listing',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Football', description: 'The sport category of the item' })
  @IsString()
  @IsNotEmpty()
  sport: string;

  @ApiProperty({
    example: 'Premier League',
    required: false,
    description: 'The league category of the item',
  })
  @IsString()
  @IsOptional()
  league?: string;

  @ApiProperty({
    example: 'Manchester United',
    required: false,
    description: 'The team or country associated with the item',
  })
  @IsString()
  @IsOptional()
  teamOrCountry?: string;

  @ApiProperty({
    example: 'Cristiano Ronaldo',
    required: false,
    description: 'The name of the player or manager',
  })
  @IsString()
  @IsOptional()
  playerOrManagerName?: string;

  @ApiProperty({
    enum: ListingCategory,
    example: ListingCategory.SHIRT,
    description: 'The type of item being listed',
  })
  @IsEnum(ListingCategory)
  @IsNotEmpty()
  category: ListingCategory;

  @ApiProperty({
    example: '2023/24',
    required: false,
    description: 'The season or year of the item',
  })
  @IsString()
  @IsOptional()
  seasonOrYear?: string;

  @ApiProperty({
    example: 'Home',
    required: false,
    description: 'The kit type (e.g., Home, Away, Third)',
  })
  @IsString()
  @IsOptional()
  kitType?: string;

  @ApiProperty({
    example: 'Signed home shirt from the 2023/24 season.',
    required: false,
    description: 'A detailed description of the listing',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: SignatureKey,
    example: SignatureKey.NONE,
    required: false,
    description: 'The type of signature on the item',
  })
  @IsEnum(SignatureKey)
  @IsOptional()
  signatureType?: SignatureKey;

  @ApiProperty({
    enum: ProofViewKey,
    example: ProofViewKey.NO_PROOF,
    required: false,
    description: 'Type of photo proof provided',
  })
  @IsEnum(ProofViewKey)
  @IsOptional()
  photoProofType?: ProofViewKey;

  @ApiProperty({
    enum: ProofViewKey,
    example: ProofViewKey.NO_PROOF,
    required: false,
    description: 'Type of video proof provided',
  })
  @IsEnum(ProofViewKey)
  @IsOptional()
  videoProofType?: ProofViewKey;

  @ApiProperty({
    enum: COAStatus,
    example: COAStatus.NO_COA,
    required: false,
    description: 'Status of the Certificate of Authenticity',
  })
  @IsEnum(COAStatus)
  @IsOptional()
  coaStatus?: COAStatus;

  @ApiProperty({
    example: 'PSA',
    required: false,
    description: 'The company that authenticated the item',
  })
  @IsString()
  @IsOptional()
  companyAuthentication?: string;

  @ApiProperty({
    example: 'NUM_10',
    required: false,
    description: 'Card numbering multiplier key',
  })
  @IsString()
  @IsOptional()
  cardNumbered?: string;

  @ApiProperty({
    example: 'PATCH_ONLY',
    required: false,
    description: 'Card feature multiplier key',
  })
  @IsString()
  @IsOptional()
  cardFeature?: string;

  @ApiProperty({
    example: 'GRADE_10',
    required: false,
    description: 'Card grade multiplier key',
  })
  @IsString()
  @IsOptional()
  cardGrade?: string;

  @ApiProperty({
    example: ['Premier League', 'Champions League'],
    required: false,
    description: 'List of honours/trophies won',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  appliedHonours?: string[];

  @ApiProperty({
    enum: SaleFormat,
    example: SaleFormat.BUY_NOW,
    required: false,
    description: 'The listing format',
  })
  @IsEnum(SaleFormat)
  @IsOptional()
  format?: SaleFormat;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Whether trading is enabled for this listing',
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isTradingEnable?: boolean;

  @ApiProperty({ example: false, required: false, description: 'Whether to hold the price' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isHoldPrice?: boolean;

  @ApiProperty({ example: false, required: false, description: 'Whether the listing is paused' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isPauseListing?: boolean;

  @ApiProperty({
    example: 500,
    required: false,
    description: 'The estimated base value of the item',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  estimatedBaseValue?: number;

  @ApiProperty({ example: 450, required: false, description: 'The initial asking price' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  initialPrice?: number;

  @ApiProperty({ example: true, required: false, description: 'Allow buyers to make offers' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  allowOffers?: boolean;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Automatically adjust price based on market',
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  autoPriceAdjust?: boolean;

  @ApiProperty({
    example: '2023-01-01',
    required: false,
    description: 'Date when the item was acquired',
  })
  @IsString()
  @IsOptional()
  acquiredDate?: string;

  @ApiProperty({
    description: 'Array of file objects (ObjectIDs and Absolute URLs)',
    type: () => FileItem,
    isArray: true,
    required: false,
  })
  @IsArray()
  @IsOptional()
  @Type(() => FileItem)
  photos?: FileItem[];

  @ApiProperty({
    description: 'Array of proof photos',
    type: () => FileItem,
    isArray: true,
    required: false,
  })
  @IsArray()
  @IsOptional()
  @Type(() => FileItem)
  photoProofs?: FileItem[];

  @ApiProperty({
    description: 'Array of proof videos',
    type: () => FileItem,
    isArray: true,
    required: false,
  })
  @IsArray()
  @IsOptional()
  @Type(() => FileItem)
  videoProofs?: FileItem[];

  @ApiProperty({
    description: 'Array of COA files',
    type: () => FileItem,
    isArray: true,
    required: false,
  })
  @IsArray()
  @IsOptional()
  @Type(() => FileItem)
  coaFiles?: FileItem[];
}
