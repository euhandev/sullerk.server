import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { Role, Transaction } from '@prisma/client';
import QueryBuilder from '@/utils/query_builder';
import { Request } from 'express';
import {
  transactionFilterFields,
  transactionInclude,
  transactionSearchFields,
} from './transaction.constant';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(req: Request): Promise<IGenericResponse<Transaction[]>> {
    const query = req.query as any;
    const user = (req as any).user;

    // 1. Rename search to searchTerm for QueryBuilder compatibility
    if (query.search) {
      query.searchTerm = query.search;
      delete query.search;
    }

    // 2. Enforce Defaults and Sanitize
    // Status
    if (!query.status || query.status === 'all') {
      delete query.status;
    }

    // Page: Use default if missing or invalid
    const page = parseInt(query.page as string);
    query.page = isNaN(page) || page < 1 ? 1 : page;

    // Limit: Use default if missing, invalid, or excessive
    const limit = parseInt(query.limit as string);
    query.limit = isNaN(limit) || limit < 1 || limit > 100 ? 10 : limit;

    const queryBuilder = new QueryBuilder(query, this.prisma.transaction);

    // Enforce ownership for CUSTOMERS
    if (user.role === Role.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({
        where: { userId: user.id },
      });
      if (customer) {
        queryBuilder.rawFilter({ customerId: customer.id });
      }
    }

    const [data, meta] = await Promise.all([
      queryBuilder
        .filter(transactionFilterFields)
        .search(transactionSearchFields)
        .sort() // Default: Latest first is handled inside QueryBuilder
        .paginate()
        .include(transactionInclude)
        .execute(),
      queryBuilder.countTotal(),
    ]);

    return { meta, data };
  }
}
