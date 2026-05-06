
import { ApiProperty } from '@nestjs/swagger';
import { PostType } from '@prisma/client';
import { IsArray, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateCommunityPostDto {
  @ApiProperty()
  @IsMongoId()
  @IsString()
  communityId: string;

  @ApiProperty({ enum: PostType, isArray: true })
  @IsArray()
  @IsEnum(PostType, { each: true })
  type: PostType[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  text?: string;
}
