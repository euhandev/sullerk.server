<<<<<<< HEAD
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
=======
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommunityType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FileItem {
  @ApiPropertyOptional({
    example: '69fae180e0c772d77befd5b8',
    description: 'Database ID of the file',
  })
  @IsString()
  @IsOptional()
  fileId?: string;

  @ApiPropertyOptional({
    example: 'http://localhost:8989/api/v1/files/example.webp',
    description: 'Absolute URL of the file',
  })
  @IsString()
  @IsOptional()
  url?: string;
}

export class CreateCommunityDto {
  @ApiProperty({ example: 'Vintage Jersey Collectors' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'A place for collectors of rare football kits.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: ['football', 'vintage'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ enum: CommunityType, example: 'PUBLIC' })
  @IsEnum(CommunityType)
  @IsNotEmpty()
  type: CommunityType;

  @ApiPropertyOptional({ type: FileItem })
  @IsOptional()
  @ValidateNested()
  @Type(() => FileItem)
  heroImg?: FileItem;
>>>>>>> 4c011a9 (add post community creation module)
}
