import { Controller, Get, HttpStatus, Req } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ResponseService } from '@/utils/response';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Transactions')
@ApiBearerAuth('JWT-auth')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get transaction history',
    description: `
      Retrieves transaction history with filtering and search.
      - **ADMIN**: Can see all transactions.
      - **CUSTOMER**: Can see only their own transactions.
      
      **Filters (status):** all, PENDING, COMPLETED, CANCELLED
    `,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['all', 'PENDING', 'COMPLETED', 'CANCELLED'],
    default: 'all',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, default: 1 })
  @ApiQuery({ name: 'limit', required: false, default: 10 })
  async findAll(@Req() req: Request) {
    const result = await this.transactionService.findAll(req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Transactions retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }
}
