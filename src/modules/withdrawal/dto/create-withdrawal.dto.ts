import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min } from 'class-validator';

export class CreateWithdrawalDto {
  @ApiProperty({ example: 100, description: 'Amount to withdraw' })
  @IsNumber()
  @IsPositive()
  @Min(1)
  amount: number;
}
