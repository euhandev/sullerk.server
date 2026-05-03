import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNewsletterDto {
  @ApiProperty({ example: '60d0fe4f5311236168a109ca', description: 'Advisor ID' })
  @IsString()
  @IsNotEmpty()
  AdvisorId: string;

  @ApiProperty({ example: '60d0fe4f5311236168a109ca', description: 'Customer ID', required: false })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ example: 'john@example.com', description: 'Subscriber email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
