import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AdminDto {
  @ApiProperty({ example: 'Admin Full Name' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '123 Admin St', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Experienced administrator', required: false })
  @IsOptional()
  @IsString()
  intro?: string;
}

export class UpdateAdminDto {
  @ApiProperty({ example: 'Admin Full Name', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ example: '123 Admin St', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Experienced administrator', required: false })
  @IsOptional()
  @IsString()
  intro?: string;
}
