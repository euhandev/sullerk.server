import { ApiProperty } from '@nestjs/swagger';
import { BloodGroup, Gender } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CustomerDto {
  @ApiProperty({ example: 'Customer Full Name', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ enum: BloodGroup, required: false })
  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @ApiProperty({ enum: Gender, required: false })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ example: '789 Customer Rd', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'London', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'SW1A 1AA' })
  @IsString()
  postcode: string;

  @ApiProperty({ example: 'Greater London', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: 'UK', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: false, default: false, required: false })
  @IsOptional()
  @IsBoolean()
  hasAttendedSeminar?: boolean = false;

  @ApiProperty({ example: '2026-02-16T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  seminarDate?: string;

  @ApiProperty({ example: 'NHS Trust', required: false })
  @IsOptional()
  @IsString()
  seminarTrust?: string;
}

export class UpdateCustomerDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsEnum(BloodGroup) bloodGroup?: BloodGroup;
  @IsOptional() @IsEnum(Gender) gender?: Gender;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() postcode?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsBoolean() hasAttendedSeminar?: boolean;
  @IsOptional() @IsDateString() seminarDate?: string;
  @IsOptional() @IsString() seminarTrust?: string;
}
