import { HttpStatus, Injectable } from '@nestjs/common';
import { UpdateChatDto } from './dto/update-chat.dto';
import { PrismaService } from '@/helper/prisma.service';
import type { Request } from 'express';

import {
  chatFilterFields,
  chatInclude,
  chatNestedFilters,
  chatSearchFields,
} from './chat.constant';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async findAll(req: Request) {
    const query = req.query;
    const user: any = req?.user;

    const senderId = user.id;

    if (query?.roomId) {
      const isUserExistsInRoom = await this.prisma.roomParticipant.findFirst({
        where: { userId: senderId, roomId: query?.roomId as string },
      });

      if (!isUserExistsInRoom) {
        throw new ApiError(HttpStatus.NOT_FOUND, `user room not found`);
      }
    }

    const populateFields = (query.populate as string)
      ? (query.populate as string).split(',').reduce((acc: Record<string, boolean>, field) => {
          acc[field] = true;
          return acc;
        }, {})
      : {};

    const queryBuilder = new QueryBuilder(query, this.prisma.chat);

    const result = await queryBuilder
      .filter(chatFilterFields)
      .search(chatSearchFields)
      .nestedFilter(chatNestedFilters)
      .sort()
      .paginate()
      .fields()
      .include(chatInclude)
      .rawFilter({
        roomId: query?.roomId,
      })
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();
    return { meta, data: result };
  }

  async findOne(id: string) {
    return await this.prisma.chat.findUnique({
      where: { id },
      include: chatInclude,
    });
  }

  async update(id: string, updateChatDto: UpdateChatDto) {
    const isExist = await this.findOne(id);
    if (!isExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'chat not found with this id:' + id);
    }
    return await this.prisma.chat.update({
      where: { id },
      data: updateChatDto,
    });
  }

  async remove(id: string) {
    const isExist = await this.findOne(id);
    if (!isExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'chat not found with this id:' + id);
    }
    return await this.prisma.chat.delete({
      where: { id },
    });
  }
}
