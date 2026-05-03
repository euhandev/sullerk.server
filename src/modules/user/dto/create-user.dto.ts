import { Lang, Role, Status } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'john_doe', description: 'Unique username', required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+1234567890', description: 'Contact number', required: false })
  @IsOptional()
  @IsString()
  contactNo?: string;

  @ApiProperty({ example: 'password123', description: 'User password (min 6 chars)' })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Lang, default: Lang.ENG, required: false })
  @IsEnum(Lang)
  @IsOptional()
  lang?: Lang;

  @ApiProperty({ enum: Role, default: Role.CUSTOMER, required: false })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({ example: 'https://example.com/avatar.png', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ enum: Status, default: Status.ACTIVE, required: false })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;

  @ApiProperty({ example: 'fcm_token_123', required: false })
  @IsOptional()
  @IsString()
  fcmToken?: string;

  @ApiProperty({ example: '1990-01-01', description: 'Date of birth', required: false })
  @IsOptional()
  @IsString()
  dob?: string;
}
