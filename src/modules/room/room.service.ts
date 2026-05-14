import { PrismaService } from '@/helper/prisma.service';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, RoomType } from '@prisma/client';
import type { Request } from 'express';
import {
  roomFilterFields,
  roomInclude,
  roomNestedFilters,
  roomRangeFilter,
  roomSearchFields,
} from './room.constant';

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}

  async createOrGetPrivateRoom(userId: string, receiverId: string, tx?: Prisma.TransactionClient) {
    const prisma = tx || this.prisma;

    if (!tx) {
      return this.prisma.$transaction(async (tx) => {
        return this._createOrGetPrivateRoom(userId, receiverId, tx);
      });
    }

    return this._createOrGetPrivateRoom(userId, receiverId, prisma);
  }

  private async _createOrGetPrivateRoom(
    userId: string,
    receiverId: string,
    prisma: Prisma.TransactionClient | PrismaClient,
  ) {
    // 1️⃣ Prevent self-room creation
    if (userId === receiverId) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Cannot create private room with yourself');
    }

    // 2️⃣ Check user existence
    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.user.findUnique({ where: { id: receiverId } }),
    ]);

    if (!sender) throw new ApiError(HttpStatus.NOT_FOUND, 'Sender user not found');
    if (!receiver) throw new ApiError(HttpStatus.NOT_FOUND, 'Receiver user not found');

    // 3️⃣ Find existing private room between both users
    const room = await prisma.room.findFirst({
      where: {
        type: RoomType.PRIVATE,
        AND: [
          { participants: { some: { userId: userId } } },
          { participants: { some: { userId: receiverId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                avatar: true,
                email: true,
                username: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // 4️⃣ If room exists, return it
    if (room) {
      return room;
    }

    // 5️⃣ Create new room if doesn't exist
    return prisma.room.create({
      data: {
        type: RoomType.PRIVATE,
        creatorId: userId,
        participants: {
          create: [{ userId: userId }, { userId: receiverId }],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                avatar: true,
                email: true,
                username: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(req: Request) {
    const user = req.user as any;
    const query = req.query as Record<string, string>;
    const populateFields = query.populate
      ? query.populate.split(',').reduce((acc: Record<string, boolean>, field) => {
          acc[field] = true;
          return acc;
        }, {})
      : {};

    const rawFilter: Prisma.RoomWhereInput = {
      OR: [{ participants: { some: { userId: user?.id } } }],
    };

    const queryBuilder = new QueryBuilder(query, this.prisma.room);
    const result = await queryBuilder
      .filter(roomFilterFields)
      .search(roomSearchFields)
      .nestedFilter(roomNestedFilters)
      .sort()
      .paginate()
      .include({ ...roomInclude })
      .fields()
      .filterByRange(roomRangeFilter)
      .populate(populateFields)
      .rawFilter(rawFilter)
      .execute();

    const meta = await queryBuilder.countTotal();

    // Now fetch unread counts per room using lastReadAt
    const roomIds = result.map((room: any) => room.id);

    // Get the current user's lastReadAt per room
    const participantData = await this.prisma.roomParticipant.findMany({
      where: { userId: user?.id, roomId: { in: roomIds } },
      select: { roomId: true, lastReadAt: true },
    });

    const lastReadMap = participantData.reduce(
      (acc, item) => {
        acc[item.roomId] = item.lastReadAt;
        return acc;
      },
      {} as Record<string, Date | null>,
    );

    // Count unread messages per room (messages after lastReadAt, not from current user)
    const unreadCounts = await Promise.all(
      roomIds.map(async (roomId: string) => {
        const lastReadAt = lastReadMap[roomId];
        const count = await this.prisma.chat.count({
          where: {
            roomId,
            senderId: { not: user?.id },
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
          },
        });
        return { roomId, count };
      }),
    );

    const unreadMap = unreadCounts.reduce(
      (acc, item) => {
        acc[item.roomId] = item.count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const finalresult = result.map(({ participants, ...item }: any) => {
      return {
        ...item,
        unReadCount: unreadMap[item.id] || 0,
        participants,
      };
    });

    return { meta, data: finalresult };
  }

  async findOne(id: string) {
    const isRoomExists = await this.prisma.room
      .findUnique({
        where: { id },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
        },
      })
      .catch(() => null);

    if (!isRoomExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Room Not Found');
    }

    return isRoomExists;
  }

  async remove(id: string) {
    const isRoomExists = await this.prisma.room.findUnique({
      where: { id },
    });

    if (!isRoomExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Room Not Found');
    }

    return await this.prisma.room.delete({
      where: { id },
    });
  }
}
