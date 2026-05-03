import { IsString, IsOptional, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBlogDto {
  @ApiProperty({ example: 'My Blog Post', description: 'Blog post title' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'my-blog-post', description: 'URL slug', required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'John Smith', description: 'Writer name' })
  @IsString()
  @IsNotEmpty()
  writer: string;

  @ApiProperty({ example: 'This is a description', description: 'Blog description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'http://example.com', description: 'Primary URL', required: false })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiProperty({ example: 'http://example.com/sec', description: 'Secondary URL', required: false })
  @IsOptional()
  @IsUrl()
  secUrl?: string;
}
