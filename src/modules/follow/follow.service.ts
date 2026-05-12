import { PrismaService } from '@/helper/prisma.service';
import { ApiError } from '@/utils/api_error';
import { HttpStatus, Injectable } from '@nestjs/common';
import QueryBuilder from '@/utils/query_builder';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '@prisma/client';
import { followerInclude, followInclude, followingInclude } from './follow.constant';

@Injectable()
export class FollowService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async toggleFollow(followerUserId: string, targetIdentifier: string) {
    const follower = await this.prisma.customer.findUnique({
      where: { userId: followerUserId },
    });
    if (!follower) throw new ApiError(HttpStatus.NOT_FOUND, 'Follower profile not found');

    const targetCustomer = await this.resolveTargetCustomer(targetIdentifier);

    if (follower.id === targetCustomer.id) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'You cannot follow yourself');
    }

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId: targetCustomer.id,
        },
      },
    });

    if (existingFollow) {
      await this.prisma.follow.delete({
        where: { id: existingFollow.id },
      });
      return { message: 'Unfollowed successfully', following: false };
    } else {
      await this.prisma.follow.create({
        data: {
          followerId: follower.id,
          followingId: targetCustomer.id,
        },
      });

      // Send notification
      const followerUser = await this.prisma.user.findUnique({ where: { id: followerUserId } });
      await this.notificationService.saveNotification(
        {
          name: 'New Follower',
          body: `${followerUser?.username} started following you`,
          type: NotificationType.SYSTEM,
          actionUrl: `/profile/${followerUser?.id}`,
        },
        targetCustomer.userId,
      );

      return { message: 'Followed successfully', following: true };
    }
  }

  async getFollowers(customerId: string, query: Record<string, any>) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });

    if (!customer) throw new ApiError(HttpStatus.NOT_FOUND, 'Customer profile not found');

    const queryBuilder = new QueryBuilder(query, this.prisma.follow);
    const result = await queryBuilder
      .paginate()
      .sort()
      .include(followerInclude)
      .rawFilter({ followingId: customer.id })
      .execute();

    const meta = await queryBuilder.countTotal();
    return { meta, data: result };
  }

  async getFollowing(customerId: string, query: Record<string, any>) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new ApiError(HttpStatus.NOT_FOUND, 'Customer profile not found');

    const queryBuilder = new QueryBuilder(query, this.prisma.follow);
    const result = await queryBuilder
      .paginate()
      .sort()
      .include(followingInclude)
      .rawFilter({ followerId: customer.id })
      .execute();

    const meta = await queryBuilder.countTotal();
    return { meta, data: result };
  }

  async getFollowCounts(customerId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return { followers: 0, following: 0 };

    const [followers, following] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: customer.id } }),
      this.prisma.follow.count({ where: { followerId: customer.id } }),
    ]);

    return { followers, following };
  }

  async getMutualFollows(
    currentUserId: string,
    targetCustomerId: string,
    query: Record<string, any>,
  ) {
    const myCustomer = await this.prisma.customer.findUnique({
      where: { userId: currentUserId },
    });
    const targetCustomer = await this.prisma.customer.findUnique({
      where: { id: targetCustomerId },
    });

    if (!myCustomer || !targetCustomer)
      throw new ApiError(HttpStatus.NOT_FOUND, 'Customer profile not found');

    // Get IDs of people I follow
    const myFollowing = await this.prisma.follow.findMany({
      where: { followerId: myCustomer.id },
      select: { followingId: true },
    });
    const myFollowingIds = myFollowing.map((f) => f.followingId);

    // Get people who follow the target user and are also in my following list
    const queryBuilder = new QueryBuilder(query, this.prisma.follow);
    const result = await queryBuilder
      .paginate()
      .sort()
      .include(followInclude)
      .rawFilter({
        followingId: targetCustomer.id,
        followerId: { in: myFollowingIds },
      })
      .execute();

    const meta = await queryBuilder.countTotal();
    return { meta, data: result };
  }

  private async resolveTargetCustomer(identifier: string) {
    // Try to find directly by customer ID
    if (identifier.length === 24) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: identifier },
      });
      if (customer) return customer;
    }

    // Fallback: try to find by username
    const user = await this.prisma.user.findFirst({
      where: { username: identifier },
      include: { customer: true },
    });

    if (user?.customer) return user.customer;

    throw new ApiError(HttpStatus.NOT_FOUND, 'Target user not found');
  }
}
