import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateCommunityMemberDto } from './dto/create-community-member.dto';
import { UpdateCommunityMemberDto } from './dto/update-community-member.dto';
import { PrismaService } from '@/helper/prisma.service';
import { Request } from 'express';
import {
  communityMemberFilterFields,
  communityMemberInclude,
  communityMemberNestedFilters,
  communityMemberSearchFields,
} from './community-member.constant';
import QueryBuilder from '@/utils/query_builder';
import { ApiError } from '@/utils/api_error';
import { CommunityUserType } from '@prisma/client';

@Injectable()
export class CommunityMemberService {
  constructor(private prisma: PrismaService) {}

  private async getCustomerId(req: Request): Promise<string | null> {
    const user: any = req?.user;
    if (!user) throw new ApiError(HttpStatus.UNAUTHORIZED, 'Unauthorized');

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return (req.query?.customerId as string) || null;
    }
    const customer = await this.prisma.customer.findUnique({ where: { userId: user.id } });
    if (!customer) throw new ApiError(HttpStatus.NOT_FOUND, 'Customer profile not found');
    return customer.id;
  }

  private async checkAdminPermission(req: Request, communityId: string) {
    const user: any = req?.user;
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') return;

    const customerId = await this.getCustomerId(req);
    const membership = await this.prisma.communityMember.findUnique({
      where: {
        communityId_customerId: {
          communityId,
          customerId: customerId!,
        },
      },
    });

    if (!membership || membership.userType !== CommunityUserType.ADMIN) {
      throw new ApiError(HttpStatus.FORBIDDEN, 'Only community admins can perform this action');
    }
  }

  async create(req: Request, paylaod: CreateCommunityMemberDto) {
    await this.checkAdminPermission(req, paylaod.communityId);

    return await this.prisma.communityMember.create({
      data: paylaod,
    });
  }

  async findAll(req: Request, communityId?: string) {
    const query = req.query;
    const populateFields = (query.populate as string)
      ? (query.populate as string).split(',').reduce((acc: Record<string, boolean>, field) => {
          acc[field] = true;
          return acc;
        }, {})
      : {};

    const queryBuilder = new QueryBuilder(query, this.prisma.communityMember);
    if (communityId) {
      queryBuilder.rawFilter({ communityId });
    }

    const result = await queryBuilder
      .filter(communityMemberFilterFields)
      .search(communityMemberSearchFields)
      .nestedFilter(communityMemberNestedFilters)
      .sort()
      .paginate()
      .fields()
      .include(communityMemberInclude)
      .rawFilter({})
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();
    return { meta, data: result };
  }

  async findOne(id: string) {
    const isExist = await this.prisma.communityMember.findUnique({
      where: { id },
      include: communityMemberInclude,
    });
    if (!isExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Member not found');
    }
    return isExist;
  }

  async update(req: Request, id: string, paylaod: UpdateCommunityMemberDto) {
    const isExist = await this.findOne(id);
    await this.checkAdminPermission(req, isExist.communityId);

    return await this.prisma.communityMember.update({
      where: { id },
      data: paylaod,
    });
  }

  async remove(req: Request, id: string) {
    const isExist = await this.findOne(id);
    await this.checkAdminPermission(req, isExist.communityId);

    return await this.prisma.communityMember.delete({
      where: { id },
    });
  }
}
