import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { PrismaService } from '@/helper/prisma.service';
import { Request } from 'express';
import {
  communityFilterFields,
  communityInclude,
  communityNestedFilters,
  communitySearchFields,
} from './community.constant';
import QueryBuilder from '@/utils/query_builder';
import { ApiError } from '@/utils/api_error';
import { CommunityMemberStatus, CommunityUserType } from '@prisma/client';
import { FileService } from '@/helper/file.service';

@Injectable()
export class CommunityService {
  constructor(
    private prisma: PrismaService,
    private readonly fileService: FileService,
  ) {}

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

  async create(req: Request, paylaod: CreateCommunityDto, hero?: string) {
    const customerId = await this.getCustomerId(req);

    if (!customerId) throw new ApiError(HttpStatus.BAD_REQUEST, 'Only admin can create community');

    const result = await this.prisma.$transaction(async tx => {

      const communityCreation = await tx.community.create({
        data: { ...paylaod, heroImg: hero, },
      });

      await tx.communityMember.create({
        data: {
          communityId: communityCreation.id,
          customerId: customerId!,
          userType: CommunityUserType.ADMIN,
          status: CommunityMemberStatus.ACTIVE,
        }
      })

      return communityCreation;
    }) 

    return result;
  }

  async findAll(req: Request) {
    const query = req.query;
    const populateFields = (query.populate as string)
      ? (query.populate as string).split(',').reduce((acc: Record<string, boolean>, field) => {
          acc[field] = true;
          return acc;
        }, {})
      : {};

    const queryBuilder = new QueryBuilder(query, this.prisma.community);
    
    const user: any = req?.user;
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      const customerId = await this.getCustomerId(req);
      queryBuilder.rawFilter({
        members: {
          some: {
            customerId,
            status: { not: CommunityMemberStatus.BLOCKED },
          },
        },
      });
    }

    const result = await queryBuilder
      .filter(communityFilterFields)
      .search(communitySearchFields)
      .nestedFilter(communityNestedFilters)
      .sort()
      .paginate()
      .fields()
      .include(communityInclude)
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();
    return { meta, data: result };
  }

  async findOne(req: Request, id: string) {
    const isCommunityExists = await this.prisma.community.findUnique({
      where: { id },
      include: communityInclude,
    });

    if (!isCommunityExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'community not found');
    }

    const user: any = req?.user;
    // System admins bypass membership check
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      const customerId = await this.getCustomerId(req);
      const membership = await this.prisma.communityMember.findUnique({
        where: {
          communityId_customerId: {
            communityId: id,
            customerId: customerId!,
          },
        },
      });

      if (!membership || membership.status === CommunityMemberStatus.BLOCKED) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'You do not have permission to view this community');
      }
    }

    return isCommunityExists;
  }

  async update(req: Request, id: string, paylaod: UpdateCommunityDto, hero?: string) {
    const isExist = await this.prisma.community.findUnique({ where: { id } });
    if (!isExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'community not found with this id:' + id);
    }

    const user: any = req?.user;
    // System admins bypass community admin check
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      const customerId = await this.getCustomerId(req);
      const membership = await this.prisma.communityMember.findUnique({
        where: {
          communityId_customerId: {
            communityId: id,
            customerId: customerId!,
          },
        },
      });

      if (!membership || membership.userType !== CommunityUserType.ADMIN) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Only community admins can update this community');
      }
    }

    const community = await this.prisma.$transaction(async tx => {
      if (hero && isExist?.heroImg) {
        await this.fileService.deleteFromCloudinary(isExist.heroImg);
      }
      const result = await tx.community.update({
        where: { id },
        data: { ...paylaod, ...(hero && { heroImg: hero }) },
      });
      return result;
    });

    return community;
  }

  async remove(req: Request, id: string) {
    const isExist = await this.prisma.community.findUnique({ where: { id } });
    if (!isExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'community not found with this id:' + id);
    }

    const user: any = req?.user;
    // System admins bypass community admin check
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      const customerId = await this.getCustomerId(req);
      const membership = await this.prisma.communityMember.findUnique({
        where: {
          communityId_customerId: {
            communityId: id,
            customerId: customerId!,
          },
        },
      });

      if (!membership || membership.userType !== CommunityUserType.ADMIN) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Only community admins can delete this community');
      }
    }

    if (isExist.heroImg) {
      await this.fileService.deleteFromCloudinary(isExist.heroImg);
    }

    return await this.prisma.community.delete({
      where: { id },
    });
  }
}
