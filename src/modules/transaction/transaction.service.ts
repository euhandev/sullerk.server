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

  /**
   * Get all transactions for Admin with detailed transformation
   */
  async findAllAdmin(query: Record<string, any>): Promise<IGenericResponse<any[]>> {
    // 1. Rename search to searchTerm for QueryBuilder compatibility
    if (query.search) {
      query.searchTerm = query.search;
      delete query.search;
    }

    // 2. Handle 'all' status
    if (query.status === 'all') {
      delete query.status;
    }

    // Default pagination values if not provided
    const page = parseInt(query.page as string);
    query.page = isNaN(page) || page < 1 ? 1 : page;

    const limit = parseInt(query.limit as string);
    query.limit = isNaN(limit) || limit < 1 || limit > 100 ? 10 : limit;

    const queryBuilder = new QueryBuilder(query, this.prisma.transaction);

    const [data, meta] = await Promise.all([
      queryBuilder
        .filter(transactionFilterFields)
        .search(transactionSearchFields)
        .sort() // Default to latest first
        .paginate()
        .include(transactionInclude)
        .execute(),
      queryBuilder.countTotal(),
    ]);

    // 3. Transform data for Admin UI requirements
    const transformedData = data.map((item: any) => {
      let buyer: any = null;
      let seller: any = null;
      let itemTitle: any = null;

      if (item.order) {
        buyer = {
          id: item.order.buyerId,
          name: item.order.buyer?.fullName || 'Unknown',
        };
        seller = {
          id: item.order.sellerId,
          name: item.order.seller?.fullName || 'Unknown',
        };
        itemTitle = {
          id: item.order.listingId,
          title: item.order.listing?.title || 'Unknown',
        };
      } else if (item.withdrawal) {
        // For withdrawals, the "Seller" is the one getting paid
        seller = {
          id: item.withdrawal.customerId,
          name: item.withdrawal.customer?.fullName || 'Unknown',
        };
        buyer = { id: 'SYSTEM', name: 'Sullerk Platform' };
        itemTitle = { id: 'N/A', title: 'Withdrawal Payout' };
      } else {
        // Fallback for other types
        seller = {
          id: item.customerId,
          name: item.customer?.fullName || 'Unknown',
        };
        buyer = { id: 'N/A', name: 'N/A' };
        itemTitle = { id: 'N/A', title: item.description };
      }

      const response: any = {
        transactionId: item.id,
        buyer: buyer,
        seller: seller,
        item: itemTitle,
        value: item.amount,
        date: item.createdAt,
        status: item.status.toLowerCase(),
      };

      if (item.orderId) {
        response.orderId = item.orderId;
      } else if (item.withdrawalId) {
        response.withdrawalId = item.withdrawalId;
      } else if (item.exchangeOfferId) {
        response.exchangeOfferId = item.exchangeOfferId;
      }

      return response;
    });

    return { meta, data: transformedData };
  }
}
