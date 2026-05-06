
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString } from 'class-validator';

export class CreateCommunityReactionDto {
  @ApiProperty()
  @IsMongoId()
  @IsString()
  postId: string;

  @ApiProperty()
  @IsMongoId()
  @IsString()
  communityId: string;
}
