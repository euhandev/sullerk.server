import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@/helper/prisma.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { ApiError } from '@/utils/api_error';
import { DisputeStatus, Role } from '@prisma/client';
import { IGenericResponse } from '@/interface/common';
import QueryBuilder from '@/utils/query_builder';
import { disputeFilterFields, disputeInclude, disputeSearchFields } from './dispute.constant';

@Injectable()
export class DisputeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDisputeDto, userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new ApiError(HttpStatus.NOT_FOUND, 'Customer profile not found');

    if (!dto.listingId && !dto.orderId) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Either listingId or orderId must be provided');
    }

    return await this.prisma.dispute.create({
      data: {
        listingId: dto.listingId,
        orderId: dto.orderId,
        raisedById: customer.id,
        type: dto.type,
        reason: dto.reason,
        details: dto.details,
        evidence: dto.evidence as any,
        status: DisputeStatus.OPEN,
      },
    });
  }

  async resolve(id: string, dto: ResolveDisputeDto, adminUserId: string) {
    const admin = await this.prisma.admin.findUnique({ where: { userId: adminUserId } });
    if (!admin) throw new ApiError(HttpStatus.NOT_FOUND, 'Admin profile not found');

    const dispute = await this.prisma.dispute.findUnique({ where: { id } });
    if (!dispute) throw new ApiError(HttpStatus.NOT_FOUND, 'Dispute not found');

    return await this.prisma.dispute.update({
      where: { id },
      data: {
        status: dto.status,
        resolutionNote: dto.resolutionNote,
        resolvedById: admin.id,
      },
    });
  }

  async findAll(query: any, user: any): Promise<IGenericResponse<any[]>> {
    const isUserRoute = user.role === Role.CUSTOMER;
    const isAdminRoute = !isUserRoute;
    const self = query.self === 'true';

    // 1. Normalize Single Filter Param
    const filterInput = (query.filter || 'all').toLowerCase();
    if (filterInput === 'dispute') query.type = 'DISPUTE';
    else if (filterInput === 'refund') query.type = 'REFUND';
    else if (filterInput === 'open' || filterInput === 'pending') query.status = 'OPEN';
    else if (filterInput === 'under review' || filterInput === 'under_review')
      query.status = 'UNDER_REVIEW';
    else if (filterInput === 'resolved') query.status = 'RESOLVED';

    delete query.filter;
    delete query.self;

    // 2. Pagination Defaults
    const page = parseInt(query.page as string);
    query.page = isNaN(page) || page < 1 ? 1 : page;
    const limit = parseInt(query.limit as string);
    query.limit = isNaN(limit) || limit < 1 || limit > 100 ? 10 : limit;

    const queryBuilder = new QueryBuilder(query, this.prisma.dispute);

    // 3. Apply "Party" Logic
    if (isUserRoute || (isAdminRoute && self)) {
      const customer = await this.prisma.customer.findUnique({ where: { userId: user.id } });
      if (customer) {
        queryBuilder.rawFilter({
          OR: [
            { raisedById: customer.id },
            { listing: { ownerId: customer.id } },
            { order: { OR: [{ buyerId: customer.id }, { sellerId: customer.id }] } },
          ],
        });
      } else if (isAdminRoute && self) {
        // Admin with self=true but no customer profile? Return empty.
        return { meta: { page: query.page, limit: query.limit, total: 0 }, data: [] };
      }
    }

    const [data, meta] = await Promise.all([
      queryBuilder
        .filter(disputeFilterFields)
        .search(disputeSearchFields)
        .sort() // Defaults to createdAt desc
        .paginate()
        .include(disputeInclude)
        .execute(),
      queryBuilder.countTotal(),
    ]);

    return { meta, data };
  }

  // Deprecated in favor of findAll with role logic
  async findMyDisputes(userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    return await this.prisma.dispute.findMany({
      where: { raisedById: customer?.id },
      include: disputeInclude,
      orderBy: { createdAt: 'desc' },
    });
  }
}
