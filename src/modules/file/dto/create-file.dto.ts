import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { FileType } from '@prisma/client';

export class CreateFileDto {
  @ApiProperty({ example: 'My Document', description: 'File name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '60d0fe4f5311236168a109ca', description: 'Advisor ID' })
  @IsString()
  @IsNotEmpty()
  advisorId: string;

  @ApiProperty({ example: 'http://example.com/file.pdf', description: 'File URL' })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ enum: FileType, default: FileType.DOC, description: 'File type' })
  @IsEnum(FileType)
  @IsNotEmpty()
  type: FileType = FileType.DOC;
}
