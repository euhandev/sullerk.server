import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: '65fc1234567890abcdef' })
  @IsString()
  @IsNotEmpty()
  postId: string;

  @ApiProperty({ example: 'This is a great post!' })
  @IsString()
  @IsNotEmpty()
  body: string;
}
