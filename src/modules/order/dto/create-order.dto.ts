import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    example: '69fae180e0c772d77befd5b8',
    description: 'The ID of the listing to purchase',
  })
  @IsString()
  @IsNotEmpty()
  listingId: string;
}
