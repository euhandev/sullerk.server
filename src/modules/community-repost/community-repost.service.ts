import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateCommunityRepostDto } from './dto/create-community-repost.dto';
import { UpdateCommunityRepostDto } from './dto/update-community-repost.dto';
import { PrismaService } from '@/helper/prisma.service';
import { Request } from 'express';
import {
  communityRepostFilterFields,
  communityRepostInclude,
  communityRepostNestedFilters,
  communityRepostSearchFields,
} from './community-repost.constant';
import QueryBuilder from '@/utils/query_builder';
import { ApiError } from '@/utils/api_error';
import { CommunityMemberStatus } from '@prisma/client';

@Injectable()
export class CommunityRepostService {
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

  private async checkRepostPermission(
    req: Request,
    repostId: string,
    communityId: string,
    action: 'update' | 'delete',
  ) {
    const user: any = req?.user;
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') return;

    const customerId = await this.getCustomerId(req);

    // 1. Check if user is a member and not blocked
    const membership = await this.prisma.communityMember.findUnique({
      where: {
        communityId_customerId: {
          communityId,
          customerId: customerId!,
        },
      },
    });

    if (!membership || membership.status === CommunityMemberStatus.BLOCKED) {
      throw new ApiError(
        HttpStatus.FORBIDDEN,
        'You must be a member of this community to perform this action',
      );
    }

    const repost = await this.prisma.communityRepost.findUnique({ where: { id: repostId } });
    if (!repost) throw new ApiError(HttpStatus.NOT_FOUND, 'Repost not found');

    // Author can delete
    if (repost.reportedById === customerId) return;

    // If not author and not global admin, forbid
    throw new ApiError(HttpStatus.FORBIDDEN, `Only the author can ${action} this repost`);
  }

  async toggleRepost(req: Request, paylaod: CreateCommunityRepostDto) {
    const customerId = await this.getCustomerId(req);

    const membership = await this.prisma.communityMember.findUnique({
      where: {
        communityId_customerId: {
          communityId: paylaod.communityId,
          customerId: customerId!,
        },
      },
    });

    if (!membership || membership.status === CommunityMemberStatus.BLOCKED) {
      throw new ApiError(HttpStatus.FORBIDDEN, 'Only members can repost in this community');
    }

    const existingRepost = await this.prisma.communityRepost.findUnique({
      where: {
        postId_reportedById: {
          postId: paylaod.postId,
          reportedById: customerId!,
        },
      },
    });

    if (existingRepost) {
      return await this.prisma.communityRepost.delete({
        where: { id: existingRepost.id },
      });
    } else {
      return await this.prisma.communityRepost.create({
        data: {
          ...paylaod,
          reportedById: customerId!,
        },
      });
    }
  }

  async findAll(req: Request) {
    const query = req.query;
    const populateFields = (query.populate as string)
      ? (query.populate as string).split(',').reduce((acc: Record<string, boolean>, field) => {
          acc[field] = true;
          return acc;
        }, {})
      : {};

    const queryBuilder = new QueryBuilder(query, this.prisma.communityRepost);
    const result = await queryBuilder

      .filter(communityRepostFilterFields)
      .search(communityRepostSearchFields)
      .nestedFilter(communityRepostNestedFilters)
      .sort()
      .paginate()
      .fields()
      .include(communityRepostInclude)
      .rawFilter({})
      .populate(populateFields)
      // .getAllQueries()
      .execute();

    const meta = await queryBuilder.countTotal();
    return { meta, data: result };
  }

  async findOne(id: string) {
    const isCommunityRepostExists = await this.prisma.communityRepost.findUnique({
      where: { id },
    });

    if (!isCommunityRepostExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'communityRepost not found');
    }

    return await this.prisma.communityRepost.findUnique({
      where: { id },
    });
  }

  async update(req: Request, id: string, paylaod: UpdateCommunityRepostDto) {
    const isExist = await this.findOne(id);
    await this.checkRepostPermission(req, id, isExist.communityId, 'update');

    return await this.prisma.communityRepost.update({
      where: { id },
      data: paylaod,
    });
  }

  async remove(req: Request, id: string) {
    const isExist = await this.findOne(id);
    await this.checkRepostPermission(req, id, isExist.communityId, 'delete');

    return await this.prisma.communityRepost.delete({
      where: { id },
    });
  }
}
