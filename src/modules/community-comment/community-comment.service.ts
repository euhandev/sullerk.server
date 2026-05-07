import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateCommunityCommentDto } from './dto/create-community-comment.dto';
import { UpdateCommunityCommentDto } from './dto/update-community-comment.dto';
import { PrismaService } from '@/helper/prisma.service';
import { Request } from 'express';
import {
  communityCommentFilterFields,
  communityCommentInclude,
  communityCommentNestedFilters,
  communityCommentSearchFields,
} from './community-comment.constant';
import QueryBuilder from '@/utils/query_builder';
import { ApiError } from '@/utils/api_error';
import { CommunityMemberStatus } from '@prisma/client';
import { FileService } from '@/helper/file.service';

@Injectable()
export class CommunityCommentService {
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

  private async checkCommentPermission(
    req: Request,
    commentId: string,
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

    const comment = await this.prisma.communityComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new ApiError(HttpStatus.NOT_FOUND, 'Comment not found');

    // Author can update/delete
    if (comment.customerId === customerId) return;

    // If not author and not global admin, forbid
    throw new ApiError(HttpStatus.FORBIDDEN, `Only the author can ${action} this comment`);
  }

  async create(req: Request, paylaod: CreateCommunityCommentDto) {
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
      throw new ApiError(HttpStatus.FORBIDDEN, 'Only members can comment in this community');
    }

    return await this.prisma.communityComment.create({
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

    const queryBuilder = new QueryBuilder(query, this.prisma.communityComment);
    const result = await queryBuilder
      .filter(communityCommentFilterFields)
      .search(communityCommentSearchFields)
      .nestedFilter(communityCommentNestedFilters)
      .sort()
      .paginate()
      .fields()
      .include(communityCommentInclude)
      .rawFilter({})
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();
    return { meta, data: result };
  }

  async findAllByPostId(req: Request, postId: string) {
    const query = req.query;
    const populateFields = (query.populate as string)
      ? (query.populate as string).split(',').reduce((acc: Record<string, boolean>, field) => {
          acc[field] = true;
          return acc;
        }, {})
      : {};
    const customerId = await this.getCustomerId(req);

    const isPostExists = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!isPostExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Post not found');
    }

    const membership = await this.prisma.communityMember.findUnique({
      where: {
        communityId_customerId: {
          communityId: isPostExists.communityId,
          customerId: customerId!,
        },
      },
    });

    if (!membership || membership.status === CommunityMemberStatus.BLOCKED) {
      throw new ApiError(HttpStatus.FORBIDDEN, 'Only members can comment in this community');
    }

    const queryBuilder = new QueryBuilder(query, this.prisma.communityComment);
    const result = await queryBuilder
      .filter(communityCommentFilterFields)
      .search(communityCommentSearchFields)
      .nestedFilter(communityCommentNestedFilters)
      .sort()
      .paginate()
      .fields()
      .include(communityCommentInclude)
      .rawFilter({})
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();
    return { meta, data: result };
  }

  async findOne(id: string) {
    const isExist = await this.prisma.communityComment.findUnique({
      where: { id },
      include: communityCommentInclude,
    });
    if (!isExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Comment not found');
    }
    return isExist;
  }

  async update(req: Request, id: string, paylaod: UpdateCommunityCommentDto) {
    const comment = await this.findOne(id);
    await this.checkCommentPermission(req, id, comment.communityId, 'update');

    return await this.prisma.communityComment.update({
      where: { id },
      data: paylaod,
    });
  }

  async remove(req: Request, id: string) {
    const comment = await this.findOne(id);
    await this.checkCommentPermission(req, id, comment.communityId, 'delete');

    return await this.prisma.communityComment.delete({
      where: { id },
    });
  }
}
