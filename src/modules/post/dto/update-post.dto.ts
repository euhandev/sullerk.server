import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';
import { IsOptional, IsDateString } from 'class-validator';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @ApiProperty({ example: '2025-01-01T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  pollExpiresAt?: string;
}
