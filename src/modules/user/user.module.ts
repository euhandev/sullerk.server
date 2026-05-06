import { BcryptService } from '@/utils/bcrypt.service';
import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { UserService } from './user.service';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [CustomerModule],
  controllers: [UsersController],
  providers: [UserService, BcryptService],
  exports: [UserService],
})
export class UserModule {}
