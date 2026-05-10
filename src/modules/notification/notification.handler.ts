import { Injectable } from '@nestjs/common';
import { NotificationService } from '@/modules/notification/notification.service';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '@/helper/prisma.service';

interface NotificationContext {
  receiverId: string;
  senderId?: string;
  payload: {
    name: string;
    body: string;
    type: NotificationType;
    data?: string;
    actionUrl: string;
  };
}

@Injectable()
export class NotificationHandler {
  constructor(
    private notificationService: NotificationService,
    private prisma: PrismaService,
  ) {}

  async handleEvent(eventName: string, context: NotificationContext) {
    try {
      const receiver = await this.prisma.user.findUnique({
        where: { id: context.receiverId },
        select: { fcmToken: true, role: true },
      });

      if (!receiver?.fcmToken) return;

      await this.notificationService.sendingNotification(
        receiver.fcmToken,
        {
          name: context.payload.name,
          body: context.payload.body,
          type: context.payload.type,
          data: context.payload.data,
          actionUrl: context.payload.actionUrl,
        },
        context.receiverId,
      );
    } catch (error) {
      console.error(`Notification error for ${eventName}:`, error);
    }
  }

  async handleDirectMessage(data: {
    senderId: string;
    receiverId: string;
    message: string;
    roomId: string;
    chatId: string;
  }) {
    // Note: 'read' field check might need adjustment depending on Chat model
    const unreadCount = await this.prisma.chat.count({
      where: {
        // read: false, // Ensure this exists in Chat model
        senderId: data.senderId,
        roomId: data.roomId,
      },
    });

    const sender = await this.prisma.user.findUnique({
      where: { id: data.senderId },
      select: { username: true, role: true },
    });

    const actionUrls = this.getActionUrls(sender?.role || 'CUSTOMER');

    this.handleEvent('directMessage', {
      receiverId: data.receiverId,
      payload: {
        name: unreadCount > 0 ? `${unreadCount} new messages` : 'New Message',
        body: data.message.length > 50 ? `${data.message.substring(0, 47)}...` : data.message,
        type: NotificationType.SYSTEM,
        data: JSON.stringify({ chatId: data.chatId, roomId: data.roomId }),
        actionUrl: actionUrls[data.receiverId] || '/chat',
      },
    });
  }

  private getActionUrls(userRole: string): Record<string, string> {
    return {
      [userRole]: `/${userRole.toLowerCase()}-dashboard/messages`,
      CUSTOMER: '/chat',
      ADMIN: '/admin-dashboard/messages',
      SUPER_ADMIN: '/messages',
    };
  }
}
