import { ApiProperty } from '@nestjs/swagger';
import { FileItem } from './create-listing.dto';
import { ListingCategory } from '@prisma/client';

export class ListingResponseDto {
  @ApiProperty({ example: '69fae643f1fc5bef091a485b' })
  id: string;

  @ApiProperty({ example: 'Football' })
  sport: string;

  @ApiProperty({ example: 'Premier League', required: false })
  league?: string;

  @ApiProperty({ example: 'Argentina' })
  teamOrCountry: string;

  @ApiProperty({ example: 'Lionel Messi', required: false })
  playerOrManagerName?: string;

  @ApiProperty({ enum: ListingCategory, example: ListingCategory.SHIRT })
  category: ListingCategory;

  @ApiProperty({ example: '2023/24' })
  seasonOrYear: string;

  @ApiProperty({ example: 'Home', required: false })
  kitType?: string;

  @ApiProperty({ example: 'Authentic signed home shirt.' })
  description: string;

  @ApiProperty({ type: () => FileItem, isArray: true })
  photos: FileItem[];

  @ApiProperty({ type: () => FileItem, isArray: true })
  proofPhotos: FileItem[];

  @ApiProperty({ type: () => FileItem, isArray: true })
  proofVideos: FileItem[];

  @ApiProperty({ type: () => FileItem, isArray: true })
  coaFiles: FileItem[];

  @ApiProperty({ example: 'NUM_10', required: false })
  cardNumbered?: string;

  @ApiProperty({ example: 'PATCH_ONLY', required: false })
  cardFeature?: string;

  @ApiProperty({ example: 'GRADE_10', required: false })
  cardGrade?: string;

  @ApiProperty({ example: ['Premier League'], isArray: true, required: false })
  appliedHonours?: string[];

  @ApiProperty({ example: 500 })
  calculatedBasePrice: number;

  @ApiProperty({ example: 550 })
  displayPrice: number;

  @ApiProperty({ example: [{ label: 'Base Price', value: 500 }] })
  priceBreakdown: any;

  @ApiProperty({ example: 450 })
  initialPrice: number;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty({ example: '2026-05-06T06:57:07Z' })
  createdAt: Date;
}

export class CreateListingResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Listing created successfully' })
  message: string;

  @ApiProperty({ type: ListingResponseDto })
  data: ListingResponseDto;
}

export class FileUploadData {
  @ApiProperty({ example: '69fae180e0c772d77befd5b8' })
  id: string;

  @ApiProperty({ example: 'http://localhost:8989/api/v1/files/image1.webp' })
  url: string;

  @ApiProperty({ example: 'listings/photos/uuid-image1' })
  key: string;

  @ApiProperty({ example: 'shirt_front.jpg' })
  name: string;

  @ApiProperty({ example: 'PHOTOS' })
  purpose: string;

  @ApiProperty({ example: true })
  isPending: boolean;

  @ApiProperty({ example: 'CREATE' })
  context: string;
}

export class FileUploadResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Files uploaded successfully' })
  message: string;

  @ApiProperty({ type: () => FileUploadData, isArray: true })
  data: FileUploadData[];
}
