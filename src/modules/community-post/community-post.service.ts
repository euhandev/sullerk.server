import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateCommunityPostDto } from './dto/create-community-post.dto';
import { UpdateCommunityPostDto } from './dto/update-community-post.dto';
import { PrismaService } from '@/helper/prisma.service';
import { Request } from 'express';
import {
  communityPostFilterFields,
  communityPostInclude,
  communityPostNestedFilters,
  communityPostSearchFields,
} from './community-post.constant';
import QueryBuilder from '@/utils/query_builder';
import { ApiError } from '@/utils/api_error';
import { CommunityMemberStatus, CommunityUserType } from '@prisma/client';
import { FileService } from '@/helper/file.service';

@Injectable()
export class CommunityPostService {
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

  private async checkPostPermission(req: Request, postId: string, communityId: string, action: 'update' | 'delete') {
    const user: any = req?.user;
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') return;

    const customerId = await this.getCustomerId(req);
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new ApiError(HttpStatus.NOT_FOUND, 'Post not found');

    // Author can update/delete
    if (post.customerId === customerId) return;

    // Community admin can delete (but maybe not update author's text? Usually admins can delete only)
    const membership = await this.prisma.communityMember.findUnique({
      where: {
        communityId_customerId: {
          communityId,
          customerId: customerId!,
        },
      },
    });

    if (!membership || membership.userType !== CommunityUserType.ADMIN) {
      throw new ApiError(HttpStatus.FORBIDDEN, 'You do not have permission to perform this action');
    }

    if (action === 'update' && membership.userType !== CommunityUserType.ADMIN && post.customerId !== customerId) {
       throw new ApiError(HttpStatus.FORBIDDEN, 'Only the author can update the post');
    }
  }

  async create(req: Request, paylaod: CreateCommunityPostDto) {
    const customerId = await this.getCustomerId(req);
    
    // Check if user is a member and not blocked
    const membership = await this.prisma.communityMember.findUnique({
      where: {
        communityId_customerId: {
          communityId: paylaod.communityId,
          customerId: customerId!,
        },
      },
    });

    if (!membership || membership.status === CommunityMemberStatus.BLOCKED) {
      throw new ApiError(HttpStatus.FORBIDDEN, 'Only members can post in this community');
    }

    return await this.prisma.communityPost.create({
      data: {
        ...paylaod,
        customerId: customerId!,
      },
    });
  }

  async findAll(req: Request) {
    const query = req.query;
    const populateFields = (query.populate as string)
      ? (query.populate as string).split(',').reduce((acc: Record<string, boolean>, field) => {
          acc[field] = true;
          return acc;
        }, {})
      : {};

    const queryBuilder = new QueryBuilder(query, this.prisma.communityPost);
    const result = await queryBuilder
      .filter(communityPostFilterFields)
      .search(communityPostSearchFields)
      .nestedFilter(communityPostNestedFilters)
      .sort()
      .paginate()
      .fields()
      .include(communityPostInclude)
      .rawFilter({})
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();
    return { meta, data: result };
  }

  async findOne(id: string) {
    const isExist = await this.prisma.communityPost.findUnique({
      where: { id },
      include: communityPostInclude
    });
    if (!isExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Post not found');
    }
    return isExist;
  }

  async update(req: Request, id: string, paylaod: UpdateCommunityPostDto) {
    const post = await this.findOne(id);
    await this.checkPostPermission(req, id, post.communityId, 'update');

    return await this.prisma.communityPost.update({
      where: { id },
      data: paylaod,
    });
  }

  async remove(req: Request, id: string) {
    const post = await this.findOne(id);
    await this.checkPostPermission(req, id, post.communityId, 'delete');

    // Delete files from Cloudinary if they exist
    const files = (post as any).files;
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.url) {
          await this.fileService.deleteFromCloudinary(file.url);
        }
      }
    }

    return await this.prisma.communityPost.delete({
      where: { id },
    });
  }
}
