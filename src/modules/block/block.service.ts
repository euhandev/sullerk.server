import { PrismaService } from '@/helper/prisma.service';
import { ApiError } from '@/utils/api_error';
import { HttpStatus, Injectable } from '@nestjs/common';
import { blockedUserInclude } from './block.constant';
import QueryBuilder from '@/utils/query_builder';

@Injectable()
export class BlockService {
  constructor(private prisma: PrismaService) {}

  async toggleBlock(blockerUserId: string, targetIdentifier: string) {
    const blocker = await this.prisma.customer.findUnique({
      where: { userId: blockerUserId },
    });
    if (!blocker) throw new ApiError(HttpStatus.NOT_FOUND, 'Blocker profile not found');

    const targetCustomer = await this.resolveTargetCustomer(targetIdentifier);

    if (blocker.id === targetCustomer.id) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'You cannot block yourself');
    }

    const existingBlock = await this.prisma.blockedUser.findUnique({
      where: {
        blockedById_blockedUserId: {
          blockedById: blocker.id,
          blockedUserId: targetCustomer.id,
        },
      },
    });

    if (existingBlock) {
      await this.prisma.blockedUser.delete({
        where: { id: existingBlock.id },
      });
      return { message: 'User unblocked successfully', blocked: false };
    } else {
      // Auto unfollow both ways
      await this.prisma.$transaction(async (tx) => {
        await tx.follow.deleteMany({
          where: {
            OR: [
              { followerId: blocker.id, followingId: targetCustomer.id },
              { followerId: targetCustomer.id, followingId: blocker.id },
            ],
          },
        });

        await tx.blockedUser.create({
          data: {
            blockedById: blocker.id,
            blockedUserId: targetCustomer.id,
          },
        });
      });

      return { message: 'User blocked successfully', blocked: true };
    }
  }

  async getBlockedUsers(userId: string, query: Record<string, any>) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new ApiError(HttpStatus.NOT_FOUND, 'User profile not found');

    const queryBuilder = new QueryBuilder(query, this.prisma.blockedUser);
    const result = await queryBuilder
      .paginate()
      .sort()
      .include(blockedUserInclude)
      .rawFilter({ blockedById: customer.id })
      .execute();

    const meta = await queryBuilder.countTotal();
    return { meta, data: result };
  }

  async isBlocked(userId: string, targetUserId: string) {
    const [me, target] = await Promise.all([
      this.prisma.customer.findUnique({ where: { userId } }),
      this.prisma.customer.findUnique({ where: { userId: targetUserId } }),
    ]);

    if (!me || !target) return { blockedByMe: false, blockedByThem: false };

    const [blockedByMe, blockedByThem] = await Promise.all([
      this.prisma.blockedUser.findUnique({
        where: { blockedById_blockedUserId: { blockedById: me.id, blockedUserId: target.id } },
      }),
      this.prisma.blockedUser.findUnique({
        where: { blockedById_blockedUserId: { blockedById: target.id, blockedUserId: me.id } },
      }),
    ]);

    return {
      blockedByMe: !!blockedByMe,
      blockedByThem: !!blockedByThem,
    };
  }

  private async resolveTargetCustomer(identifier: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: identifier.length === 24 ? identifier : undefined },
    });
    if (customer) return customer;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: identifier.length === 24 ? identifier : undefined }, { username: identifier }],
      },
      include: { customer: true },
    });

    if (user?.customer) return user.customer;

    throw new ApiError(HttpStatus.NOT_FOUND, 'Target user not found');
  }
}
