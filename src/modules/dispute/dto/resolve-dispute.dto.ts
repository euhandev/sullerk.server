import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DisputeStatus } from '@prisma/client';

export class ResolveDisputeDto {
  @ApiProperty({ enum: DisputeStatus })
  @IsEnum(DisputeStatus)
  @IsNotEmpty()
  status: DisputeStatus;

  @ApiProperty({ example: 'Evidence verified. Refund issued.' })
  @IsString()
  @IsNotEmpty()
  resolutionNote: string;
}
