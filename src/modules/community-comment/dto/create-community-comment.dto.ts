import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateCommunityCommentDto {
  @ApiProperty()
  @IsMongoId()
  @IsString()
  postId: string;

  @ApiProperty()
  @IsMongoId()
  @IsString()
  communityId: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiProperty()
  @IsMongoId()
  @IsString()
  @IsOptional()
  parentId?: string;
}
