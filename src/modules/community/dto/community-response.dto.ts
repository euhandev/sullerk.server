import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommunityFileUploadResponse {
  @ApiProperty({ example: '69fae180e0c772d77befd5b8' })
  id: string;

  @ApiProperty({ example: 'http://localhost:8989/api/v1/files/hero.webp' })
  url: string;

  @ApiProperty({ example: 'COMMUNITY_HERO' })
  purpose: string;

  @ApiProperty({ example: 'COMMUNITY' })
  module: string;
}

export class CreateCommunityResponse {
  @ApiProperty({ example: '69fae180e0c772d77befd5b8' })
  id: string;

  @ApiProperty({ example: 'Vintage Jersey Collectors' })
  name: string;

  @ApiPropertyOptional({ example: 'A place for collectors of rare football kits.' })
  description?: string;

  @ApiPropertyOptional({ example: ['football', 'vintage'] })
  tags?: string[];

  @ApiProperty({ example: 'PUBLIC' })
  type: string;

  @ApiPropertyOptional({ example: 'http://localhost:8989/api/v1/files/hero.webp' })
  heroImg?: string;

  @ApiProperty({ example: '2026-05-07T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-05-07T10:00:00Z' })
  updatedAt: Date;
}
