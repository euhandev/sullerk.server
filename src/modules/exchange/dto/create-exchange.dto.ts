import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateExchangeDto {
  @ApiProperty({
    example: '69fae180e0c772d77befd5b8',
    description: 'The ID of the customer who owns the target listing',
  })
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @ApiProperty({
    example: ['69fae180e0c772d77befd5b8'],
    description: 'List of IDs of listings offered by the sender',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  senderListingIds: string[];

  @ApiProperty({
    example: ['69fae180e0c772d77befd5b9'],
    description: 'List of IDs of listings requested from the receiver',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  receiverListingIds: string[];

  @ApiPropertyOptional({ example: 'I would like to trade these for your rare jersey.' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({
    description: 'ID of the previous offer if this is a counter-offer',
  })
  @IsString()
  @IsOptional()
  parentOfferId?: string;
}
