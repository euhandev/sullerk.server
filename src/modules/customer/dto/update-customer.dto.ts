import { CreateCustomerDto } from '@/modules/user/dto/create-customer.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
