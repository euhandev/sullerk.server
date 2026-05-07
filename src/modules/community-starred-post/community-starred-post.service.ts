import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateCommunityStarredPostDto } from './dto/create-community-starred-post.dto';
import { UpdateCommunityStarredPostDto } from './dto/update-community-starred-post.dto';
import { PrismaService } from '@/helper/prisma.service';
import { Request } from 'express';
import {
  communityStarredPostFilterFields,
  communityStarredPostInclude,
  communityStarredPostNestedFilters,
  communityStarredPostSearchFields,
} from './community-starred-post.constant';
import QueryBuilder from '@/utils/query_builder';
import { ApiError } from '@/utils/api_error';
import { CommunityMemberStatus } from '@prisma/client';

@Injectable()
export class CommunityStarredPostService {
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

  private async checkStarPermission(
    req: Request,
    starId: string,
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

    const star = await this.prisma.communityStarredPost.findUnique({ where: { id: starId } });
    if (!star) throw new ApiError(HttpStatus.NOT_FOUND, 'Starred post not found');

    // Author can delete
    if (star.starredById === customerId) return;

    // If not author and not global admin, forbid
    throw new ApiError(HttpStatus.FORBIDDEN, `Only the author can ${action} this star`);
  }

  async toggleStar(req: Request, paylaod: CreateCommunityStarredPostDto) {
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
      throw new ApiError(HttpStatus.FORBIDDEN, 'Only members can star posts in this community');
    }

    const existingStar = await this.prisma.communityStarredPost.findUnique({
      where: {
        postId_starredById: {
          postId: paylaod.postId,
          starredById: customerId!,
        },
      },
    });

    if (existingStar) {
      return await this.prisma.communityStarredPost.delete({
        where: { id: existingStar.id },
      });
    } else {
      return await this.prisma.communityStarredPost.create({
        data: {
          ...paylaod,
          starredById: customerId!,
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

    const queryBuilder = new QueryBuilder(query, this.prisma.communityStarredPost);
    const result = await queryBuilder

      .filter(communityStarredPostFilterFields)
      .search(communityStarredPostSearchFields)
      .nestedFilter(communityStarredPostNestedFilters)
      .sort()
      .paginate()
      .fields()
      .include(communityStarredPostInclude)
      .rawFilter({})
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();
    return { meta, data: result };
  }

  async findOne(id: string) {
    const isCommunityStarredPostExists = await this.prisma.communityStarredPost.findUnique({
      where: { id },
    });

    if (!isCommunityStarredPostExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'communityStarredPost not found');
    }

    return await this.prisma.communityStarredPost.findUnique({
      where: { id },
    });
  }

  async update(req: Request, id: string, paylaod: UpdateCommunityStarredPostDto) {
    const isExist = await this.findOne(id);
    await this.checkStarPermission(req, id, isExist.communityId, 'update');

    return await this.prisma.communityStarredPost.update({
      where: { id },
      data: paylaod,
    });
  }

  async remove(req: Request, id: string) {
    const isExist = await this.findOne(id);
    await this.checkStarPermission(req, id, isExist.communityId, 'delete');

    return await this.prisma.communityStarredPost.delete({
      where: { id },
    });
  }
}
