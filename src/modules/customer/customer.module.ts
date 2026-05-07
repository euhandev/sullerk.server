import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';

import { FileService } from '@/helper/file.service';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService, FileService],
  exports: [CustomerService],
})
export class CustomerModule {}
