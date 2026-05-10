import { Injectable, InternalServerErrorException, HttpStatus } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '@/helper/prisma.service';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';

interface INotificationPayload {
  name: string;
  body: string;
  type: NotificationType;
  data?: string;
  fcmToken?: string;
  actionUrl?: string;
}

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async sendingNotification(deviceToken: string, payload: INotificationPayload, userId: string) {
    if (!deviceToken) return;

    try {
      const notification = await this.prisma.notification.create({
        data: {
          name: payload.name,
          body: payload.body,
          type: payload.type,
          data: payload.data,
          userId,
        },
      });

      return notification;
    } catch (error) {
      console.error('Firebase error:', error);
      throw new InternalServerErrorException('Notification failed');
    }
  }

  async sendNotification(deviceToken: string, payload: INotificationPayload, userId: string) {
    if (!deviceToken || typeof deviceToken !== 'string') {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid device token');
    }

    try {
      const notification = await this.prisma.notification.create({
        data: {
          name: payload.name,
          body: payload.body,
          type: payload.type,
          data: payload.data,
          userId,
        },
      });

      if (!notification) {
        throw new ApiError(HttpStatus.NOT_FOUND, `notification not found`);
      }

      return notification;
    } catch (error) {
      console.error('Firebase send error:', error);
      throw new InternalServerErrorException('Failed to send notification');
    }
  }

  async saveNotification(payload: INotificationPayload, userId: string) {
    return await this.prisma.notification.create({
      data: {
        name: payload.name,
        body: payload.body,
        type: payload.type,
        data: payload.data,
        userId,
      },
    });
  }

  async getAll(query: Record<string, any>) {
    const queryBuilder = new QueryBuilder(query, this.prisma.notification);

    const include: Prisma.NotificationInclude = {
      user: {
        select: {
          username: true,
          email: true,
          contactNo: true,
          avatar: true,
          role: true,
        },
      },
    };

    const notifications = await queryBuilder
      .search([])
      .filter()
      .sort()
      .paginate()
      .fields()
      .rawFilter({ ...(query?.userId ? { userId: query?.userId } : {}) })
      .include(include)
      .execute();

    const meta = await queryBuilder.countTotal();
    return { meta, data: notifications };
  }
}
