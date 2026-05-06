import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FileItem {
  @ApiProperty({ example: '69fae180e0c772d77befd5b8', description: 'Database ID of the file' })
  @IsString()
  fileId: string;

  @ApiProperty({
    example: 'http://localhost:8989/api/v1/files/example.webp',
    description: 'Absolute URL of the file',
  })
  @IsUrl()
  url: string;
}

export class PollOptionDto {
  @ApiProperty({ example: 'Manchester United' })
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class PollDto {
  @ApiProperty({ example: 'Who will win the Premier League?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ type: [PollOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PollOptionDto)
  options: PollOptionDto[];

  @ApiProperty({ example: '2024-12-31T23:59:59Z', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  multipleChoice?: boolean;
}

export class CreatePostDto {
  @ApiProperty({ example: 'Check out my new jersey collection!', description: 'Post content' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Array of file objects (ObjectIDs and Absolute URLs)',
    type: [FileItem],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FileItem)
  images?: FileItem[];

  @ApiProperty({
    example: '69fae180e0c772d77befd5b8',
    required: false,
    description: 'ID of a linked listing',
  })
  @IsString()
  @IsOptional()
  listingId?: string;

  @ApiProperty({
    example: 'https://example.com',
    required: false,
    description: 'Any external link',
  })
  @IsUrl()
  @IsOptional()
  externalLink?: string;

  @ApiProperty({ type: PollDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => PollDto)
  poll?: PollDto;
}
