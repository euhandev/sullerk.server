import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { CustomerDto } from '@/modules/customer/dto/create-customer.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto extends CreateUserDto {
  @ApiProperty({ type: CustomerDto })
  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;
}
