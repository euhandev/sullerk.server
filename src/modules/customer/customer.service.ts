import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Customer, Role } from '@prisma/client';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import QueryBuilder from '@/utils/query_builder';
import {
  customerFilterFields,
  customerInclude,
  customerNestedFilters,
  customerRangeFilter,
  customerSearchFields,
} from './customer.constant';
import { FileService } from '@/helper/file.service';

@Injectable()
export class CustomerService {
  constructor(
    private prisma: PrismaService,
    private readonly fileService: FileService,
  ) {}

  async findAll(query: Record<string, any>): Promise<IGenericResponse<Customer[]>> {
    const queryBuilder = new QueryBuilder(query, this.prisma.user);
    const result = await queryBuilder

      .filter(customerFilterFields)
      .search(customerSearchFields)
      .nestedFilter(customerNestedFilters)
      .sort()
      .paginate()
      .include(customerInclude)
      .fields()
      .filterByRange(customerRangeFilter)
      .omit({ password: true })
      .rawFilter({ role: Role.CUSTOMER })
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: result };
  }

  async findOne(id: string) {
    let isCustomerExists = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!isCustomerExists) {
      isCustomerExists = await this.prisma.customer.findUnique({
        where: { userId: id },
      });
    }

    if (!isCustomerExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Customer Not Found');
    }

    return await this.prisma.user.findUnique({
      where: { id: isCustomerExists?.userId },
      omit: { password: true },
      include: { customer: true },
    });
  }

  async update(id: string, data: UpdateCustomerDto, avatar?: string) {
    const { customer: customerData, ...userData } = data;

    const isUserExists = await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      const CustomerUpdation = await tx.customer.update({
        where: { id: isUserExists?.customer?.id },
        data: customerData as any,
      });

      if (!CustomerUpdation) {
        throw new ApiError(HttpStatus.NOT_FOUND, `Customer updation failed`);
      }

      if (isUserExists?.avatar && avatar) {
        await this.fileService.deleteFromCloudinary(isUserExists?.avatar);
      }

      delete userData.role;
      delete userData.status;

      const userUpdation = await this.prisma.user.update({
        where: { id: isUserExists?.id },
        data: { ...userData, ...(avatar ? { avatar } : {}) },
      });

      if (!userUpdation) {
        throw new ApiError(HttpStatus.NOT_FOUND, `user updated`);
      }
      return userUpdation;
    });

    return await this.prisma.user.findUnique({
      where: { id: isUserExists?.id },
      include: { customer: true },
    });
  }

  async remove(id: string) {
    const isUserExists = await this.findOne(id);

    if (!isUserExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, `user not found`);
    }

    await this.prisma.$transaction(
      async (tx) => {
        await tx.customer.delete({
          where: { id: isUserExists?.customer.id },
        });

        const userDeletion = await tx.user.delete({
          where: { id: isUserExists.id },
        });
        return userDeletion;
      },
      {
        maxWait: 5000,
        timeout: 10000,
      },
    );

    return 'user deleted successfully';
  }

  private async resolveTargetCustomer(identifier: string): Promise<Customer> {
    // 1. Try to find by Customer ID directly
    const customer = await this.prisma.customer.findUnique({
      where: { id: identifier.length === 24 ? identifier : undefined },
    });

    if (customer) return customer;

    // 2. Try to find by User ID or Email
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: identifier.length === 24 ? identifier : undefined }, { email: identifier }],
      },
      include: { customer: true },
    });

    if (user?.customer) return user.customer;

    throw new ApiError(
      HttpStatus.NOT_FOUND,
      `Target customer profile not found for: ${identifier}`,
    );
  }

  async follow(followerUserId: string, targetIdentifier: string) {
    const follower = await this.prisma.customer.findUnique({ where: { userId: followerUserId } });
    if (!follower) throw new ApiError(HttpStatus.NOT_FOUND, 'Follower profile not found');

    const targetCustomer = await this.resolveTargetCustomer(targetIdentifier);

    if (follower.id === targetCustomer.id) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'You cannot follow yourself');
    }

    const existingFollow = await this.prisma.follower.findFirst({
      where: { followerId: follower.id, followingId: targetCustomer.id },
    });

    if (existingFollow) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Already following this user');
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.follower.create({
        data: { followerId: follower.id, followingId: targetCustomer.id },
      });

      await tx.following.create({
        data: { followerId: follower.id, followingId: targetCustomer.id },
      });

      return 'Followed successfully';
    });
  }

  async unfollow(followerUserId: string, targetIdentifier: string) {
    const follower = await this.prisma.customer.findUnique({ where: { userId: followerUserId } });
    if (!follower) throw new ApiError(HttpStatus.NOT_FOUND, 'Follower profile not found');

    const targetCustomer = await this.resolveTargetCustomer(targetIdentifier);

    return await this.prisma.$transaction(async (tx) => {
      await tx.follower.deleteMany({
        where: { followerId: follower.id, followingId: targetCustomer.id },
      });

      await tx.following.deleteMany({
        where: { followerId: follower.id, followingId: targetCustomer.id },
      });

      return 'Unfollowed successfully';
    });
  }

  async block(blockedByUserId: string, targetIdentifier: string) {
    const blocker = await this.prisma.customer.findUnique({ where: { userId: blockedByUserId } });
    if (!blocker) throw new ApiError(HttpStatus.NOT_FOUND, 'Blocker profile not found');

    const targetCustomer = await this.resolveTargetCustomer(targetIdentifier);

    if (blocker.id === targetCustomer.id) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'You cannot block yourself');
    }

    const existingBlock = await this.prisma.blockedUser.findFirst({
      where: { blockedById: blocker.id, blockedUserId: targetCustomer.id },
    });

    if (existingBlock) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'User already blocked');
    }

    // Auto unfollow when blocking
    await this.unfollow(blockedByUserId, targetIdentifier).catch(() => {});

    return await this.prisma.blockedUser.create({
      data: { blockedById: blocker.id, blockedUserId: targetCustomer.id },
    });
  }

  async unblock(blockedByUserId: string, targetIdentifier: string) {
    const blocker = await this.prisma.customer.findUnique({ where: { userId: blockedByUserId } });
    if (!blocker) throw new ApiError(HttpStatus.NOT_FOUND, 'Blocker profile not found');

    const targetCustomer = await this.resolveTargetCustomer(targetIdentifier);

    const existingBlock = await this.prisma.blockedUser.findFirst({
      where: { blockedById: blocker.id, blockedUserId: targetCustomer.id },
    });

    if (!existingBlock) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'User not blocked');
    }

    await this.prisma.blockedUser.delete({
      where: { id: existingBlock.id },
    });

    return 'User unblocked successfully';
  }
}
