
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString } from 'class-validator';

export class CreateCommunityRepostDto {
  @ApiProperty()
  @IsMongoId()
  @IsString()
  postId: string;

  @ApiProperty()
  @IsMongoId()
  @IsString()
  communityId: string;
}
