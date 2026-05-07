import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@/helper/prisma.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { ApiError } from '@/utils/api_error';
import { DisputeStatus } from '@prisma/client';

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

  async findAll(status?: DisputeStatus) {
    return await this.prisma.dispute.findMany({
      where: { status: status || undefined },
      include: {
        raisedBy: { select: { fullName: true } },
        listing: { select: { title: true } },
        order: { select: { orderNumber: true } },
        resolvedBy: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyDisputes(userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    return await this.prisma.dispute.findMany({
      where: { raisedById: customer?.id },
      include: {
        listing: { select: { title: true } },
        order: { select: { orderNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
