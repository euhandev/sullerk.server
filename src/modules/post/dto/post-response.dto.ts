import { ApiProperty } from '@nestjs/swagger';
import { FileItem } from './create-post.dto';

export class PostPollOption {
  @ApiProperty({ example: '69fb06a63915f10779259595' })
  id: string;

  @ApiProperty({ example: 'Football' })
  text: string;

  @ApiProperty({ example: 0 })
  votes: number;
}

export class PostResponseDto {
  @ApiProperty({ example: '69fb06a63915f10779259594' })
  id: string;

  @ApiProperty({ example: 'This is a test post with a poll and an image.' })
  description: string;

  @ApiProperty({ type: [FileItem] })
  images: FileItem[];

  @ApiProperty({ example: 'Which sport is the best?' })
  pollQuestion: string;

  @ApiProperty({ type: [PostPollOption] })
  pollOptions: PostPollOption[];

  @ApiProperty({ example: false })
  pollMultipleChoice: boolean;

  @ApiProperty({ example: '2026-05-06T09:15:18.210Z' })
  createdAt: string;
}

export class CreatePostResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Post created successfully' })
  message: string;

  @ApiProperty({ type: PostResponseDto })
  data: PostResponseDto;
}

export class PostFileUploadData {
  @ApiProperty({ example: '69fb040e3915f10779259593' })
  id: string;

  @ApiProperty({
    example: 'http://localhost:8989/api/v1/files/5a1a1f9c-ccf2-43d7-a3cd-c13cebd1f410.webp',
  })
  url: string;

  @ApiProperty({ example: 'PHOTOS' })
  purpose: string;

  @ApiProperty({ example: true })
  isPending: boolean;
}

export class PostFileUploadResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'File uploaded successfully' })
  message: string;

  @ApiProperty({ type: [PostFileUploadData] })
  data: PostFileUploadData[];
}
