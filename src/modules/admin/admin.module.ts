import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

import { FileService } from '@/helper/file.service';

import { ListingModule } from '../listing/listing.module';

import { BcryptService } from '@/utils/bcrypt.service';

import { WithdrawalModule } from '../withdrawal/withdrawal.module';
import { DisputeModule } from '../dispute/dispute.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [ListingModule, WithdrawalModule, DisputeModule, TransactionModule],
  controllers: [AdminController],
  providers: [AdminService, FileService, BcryptService],
})
export class AdminModule {}
