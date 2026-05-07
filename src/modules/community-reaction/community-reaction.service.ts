import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateCommunityReactionDto } from './dto/create-community-reaction.dto';
import { UpdateCommunityReactionDto } from './dto/update-community-reaction.dto';
import { PrismaService } from '@/helper/prisma.service';
import { Request } from 'express';
import {
  communityReactionFilterFields,
  communityReactionInclude,
  communityReactionNestedFilters,
  communityReactionSearchFields,
} from './community-reaction.constant';
import QueryBuilder from '@/utils/query_builder';
import { ApiError } from '@/utils/api_error';
import { CommunityMemberStatus } from '@prisma/client';

@Injectable()
export class CommunityReactionService {
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

  private async checkReactionPermission(
    req: Request,
    reactionId: string,
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

    const reaction = await this.prisma.communityReaction.findUnique({ where: { id: reactionId } });
    if (!reaction) throw new ApiError(HttpStatus.NOT_FOUND, 'Reaction not found');

    // Author can delete (reactions usually aren't updated, but for consistency)
    if (reaction.reactedById === customerId) return;

    // If not author and not global admin, forbid
    throw new ApiError(HttpStatus.FORBIDDEN, `Only the author can ${action} this reaction`);
  }

  async toggleReaction(req: Request, paylaod: CreateCommunityReactionDto) {
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
      throw new ApiError(HttpStatus.FORBIDDEN, 'Only members can react in this community');
    }

    const existingReaction = await this.prisma.communityReaction.findUnique({
      where: {
        postId_reactedById: {
          postId: paylaod.postId,
          reactedById: customerId!,
        },
      },
    });

    if (existingReaction) {
      return await this.prisma.communityReaction.delete({
        where: { id: existingReaction.id },
      });
    } else {
      return await this.prisma.communityReaction.create({
        data: {
          ...paylaod,
          reactedById: customerId!,
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

    const queryBuilder = new QueryBuilder(query, this.prisma.communityReaction);
    const result = await queryBuilder
      .filter(communityReactionFilterFields)
      .search(communityReactionSearchFields)
      .nestedFilter(communityReactionNestedFilters)
      .sort()
      .paginate()
      .fields()
      .include(communityReactionInclude)
      .rawFilter({})
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();
    return { meta, data: result };
  }

  async findOne(id: string) {
    const isExist = await this.prisma.communityReaction.findUnique({ where: { id } });
    if (!isExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Reaction not found');
    }
    return isExist;
  }

  async update(req: Request, id: string, paylaod: UpdateCommunityReactionDto) {
    const isExist = await this.findOne(id);
    await this.checkReactionPermission(req, id, isExist.communityId, 'update');

    return await this.prisma.communityReaction.update({
      where: { id },
      data: paylaod,
    });
  }

  async remove(req: Request, id: string) {
    const isExist = await this.findOne(id);
    await this.checkReactionPermission(req, id, isExist.communityId, 'delete');

    return await this.prisma.communityReaction.delete({
      where: { id },
    });
  }
}
