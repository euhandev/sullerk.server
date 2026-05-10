import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { RoomType } from '@prisma/client';

export class CreateRoomDto {
  @IsEnum(RoomType)
  type: RoomType;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  img?: string;

  @IsUUID()
  @IsNotEmpty()
  creatorId: string;

  @IsUUID()
  @IsOptional()
  applicationId?: string;
}
