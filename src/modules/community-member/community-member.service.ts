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
import { CommunityMemberStatus, CommunityType, CommunityUserType } from '@prisma/client';

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

  private async checkAdminOrModeratorPermission(req: Request, communityId: string) {
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

    if (
      !membership ||
      (membership.userType !== CommunityUserType.ADMIN &&
        membership.userType !== CommunityUserType.MODERATOR)
    ) {
      throw new ApiError(
        HttpStatus.FORBIDDEN,
        'Only community admins or moderators can perform this action',
      );
    }
  }

  async create(req: Request, payload: CreateCommunityMemberDto) {
    const requesterCustomerId = await this.getCustomerId(req);

    const community = await this.prisma.community.findUnique({
      where: { id: payload.communityId },
    });
    if (!community) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Community not found');
    }

    // Check if the requester is an admin/moderator of this community
    const requesterMembership = await this.prisma.communityMember.findUnique({
      where: {
        communityId_customerId: {
          communityId: payload.communityId,
          customerId: requesterCustomerId!,
        },
      },
    });

    const user: any = req?.user;
    const isGlobalAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    const isAdminOrModerator =
      isGlobalAdmin ||
      (requesterMembership &&
        (requesterMembership.userType === CommunityUserType.ADMIN ||
          requesterMembership.userType === CommunityUserType.MODERATOR));

    let status: CommunityMemberStatus = CommunityMemberStatus.PENDING;

    if (community.type === CommunityType.PUBLIC) {
      status = CommunityMemberStatus.ACTIVE;
    } else if (community.type === CommunityType.PRIVATE) {
      if (isAdminOrModerator) {
        status = CommunityMemberStatus.ACTIVE;
      } else {
        status = CommunityMemberStatus.PENDING;
      }
    }

    // If the requester is joining themselves, they should be a MEMBER by default
    // unless specified otherwise by an admin
    const userType = isAdminOrModerator
      ? payload.userType || CommunityUserType.MEMBER
      : CommunityUserType.MEMBER;

    return await this.prisma.communityMember.create({
      data: {
        ...payload,
        status,
        userType,
      },
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

  async update(req: Request, id: string, payload: UpdateCommunityMemberDto) {
    const isExist = await this.findOne(id);
    await this.checkAdminOrModeratorPermission(req, isExist.communityId);

    return await this.prisma.communityMember.update({
      where: { id },
      data: payload,
    });
  }

  async remove(req: Request, id: string) {
    const isExist = await this.findOne(id);
    await this.checkAdminOrModeratorPermission(req, isExist.communityId);

    return await this.prisma.communityMember.delete({
      where: { id },
    });
  }
}
