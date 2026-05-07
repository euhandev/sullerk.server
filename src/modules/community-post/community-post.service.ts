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
import { CommunityMemberStatus } from '@prisma/client';
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

  private async checkPostPermission(
    req: Request,
    postId: string,
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

    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new ApiError(HttpStatus.NOT_FOUND, 'Post not found');

    // Author can update/delete
    if (post.customerId === customerId) return;

    // If not author and not global admin, forbid
    throw new ApiError(HttpStatus.FORBIDDEN, `Only the author can ${action} this post`);
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

    const mappedResult = result.map((post: any) => ({
      ...post,
      totalReactions: post._count?.reactions || 0,
      totalReposts: post._count?.reports || 0,
      totalComments: post._count?.comments || 0,
    }));

    const meta = await queryBuilder.countTotal();
    return { meta, data: mappedResult };
  }

  async findAllCommunityPosts(req: Request, communityId: string) {
    const query = req.query;
    const populateFields = (query.populate as string)
      ? (query.populate as string).split(',').reduce((acc: Record<string, boolean>, field) => {
          acc[field] = true;
          return acc;
        }, {})
      : {};

    const customerId = await this.getCustomerId(req);
    console.log(`customer id is `, customerId);

    // validate is the the member has access to the community
    const membership = await this.prisma.communityMember.findUnique({
      where: {
        communityId_customerId: {
          communityId,
          customerId: customerId!,
        },
      },
    });

    console.log(`see member `, membership);

    if (!membership || membership.status === CommunityMemberStatus.BLOCKED) {
      throw new ApiError(
        HttpStatus.FORBIDDEN,
        'You do not have permission to view posts in this community',
      );
    }

    const queryBuilder = new QueryBuilder(query, this.prisma.communityPost);
    const result = await queryBuilder
      .filter(communityPostFilterFields)
      .search(communityPostSearchFields)
      .nestedFilter(communityPostNestedFilters)
      .sort()
      .paginate()
      .fields()
      .include(communityPostInclude)
      .rawFilter({ communityId })
      .populate(populateFields)
      .execute();

    const mappedResult = result.map((post: any) => ({
      ...post,
      totalReactions: post._count?.reactions || 0,
      totalReposts: post._count?.reports || 0,
      totalComments: post._count?.comments || 0,
    }));

    const meta = await queryBuilder.countTotal();
    return { meta, data: mappedResult };
  }

  async findOne(id: string) {
    const isExist = await this.prisma.communityPost.findUnique({
      where: { id },
      include: communityPostInclude,
    });
    if (!isExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Post not found');
    }
    return {
      ...isExist,
      totalReactions: (isExist as any)._count?.reactions || 0,
      totalReposts: (isExist as any)._count?.reports || 0,
      totalComments: (isExist as any)._count?.comments || 0,
    };
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
