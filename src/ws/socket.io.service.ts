import { ConfigService } from '@/config/config.service';
import { PrismaService } from '@/helper/prisma.service';
import { NotificationService } from '@/modules/notification/notification.service';
import { RoomService } from '@/modules/room/room.service';
import { UserService } from '@/modules/user/user.service';
import { ApiError } from '@/utils/api_error';
import { PrismaHelperService } from '@/utils/is_existance';
import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { RoomType, NotificationType, FileType, ChatType } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { SocketEvents } from './socket.io.constant';

const getFileTypeFromUrl = (url: string): FileType => {
  const ext = url.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return FileType.IMAGE;
  if (['mp4', 'mov', 'webm'].includes(ext)) return FileType.VIDEO;
  if (['mp3', 'wav', 'ogg'].includes(ext)) return FileType.AUDIO;
  return FileType.DOC;
};

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'] },
  perMessageDeflate: false,
})
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private onlineUsers = new Set<string>();
  private userSockets = new Map<string, Socket>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly helper: PrismaHelperService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly roomService: RoomService,
  ) {}

  // -----------------------------
  // Lifecycle Hooks
  // -----------------------------
  afterInit(server: Server) {
    console.log('\x1b[36m✨ [Socket.IO] Server initialized 🚀\x1b[0m');
    server.of('/').on('connect_error', (err: any) => {
      console.error('Connection error:', err.message);
    });
  }

  handleConnection(socket: Socket) {
    console.log('User connected:', socket.id);
  }

  handleDisconnect(socket: Socket) {
    const userId = socket.data.userId as string;
    if (userId) {
      this.onlineUsers.delete(userId);
      this.userSockets.delete(userId);
      this.server.emit(SocketEvents.STATUS, { userId, isOnline: false });
    }
    console.log('User disconnected:', socket.id);
  }

  // -----------------------------
  // Authenticate User
  // -----------------------------
  @SubscribeMessage(SocketEvents.AUTHENTICATE)
  async handleAuthenticate(
    @MessageBody() payload: { token: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const { token } = payload;
    if (!token) return socket.disconnect(true);

    console.log(`see token`, token);

    try {
      const user = await this.jwtService.verifyAsync(token, {
        secret: this.config.get('JWT_SECRET'),
      });
      if (!user) throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid token');

      const userId = (user as any).id;
      socket.data.userId = userId;

      this.onlineUsers.add(userId);
      this.userSockets.set(userId, socket);
      console.log(`see user id`, userId);
      this.server.emit(SocketEvents.AUTHENTICATE, { userId, isOnline: true });
    } catch (err) {
      console.error('Authentication error:', err);
      socket.disconnect(true);
    }
  }

  // -----------------------------
  // Private Direct Message
  // -----------------------------
  @SubscribeMessage(SocketEvents.DIRECT_MESSAGE)
  async handleDirectMessage(
    @MessageBody()
    payload: { receiverId: string; message: string; images?: string[]; replyToId?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const senderId = socket.data.userId as string;
    const { receiverId, message, images } = payload;

    if (!senderId || !receiverId) {
      return socket.emit(SocketEvents.ERROR, { message: 'Invalid payload' });
    }
    if (senderId === receiverId) {
      return socket.emit(SocketEvents.ERROR, { message: 'Cannot message yourself' });
    }

    try {
      // Find existing private room with exactly these two users
      let room = await this.prisma.room.findFirst({
        where: {
          type: RoomType.PRIVATE,
          AND: [
            { participants: { some: { userId: senderId } } },
            { participants: { some: { userId: receiverId } } },
          ],
        },
        include: { participants: true },
      });

      // Ensure room has exactly 2 participants
      if (room && room.participants.length !== 2) {
        room = null;
      }

      // Create room if not exists
      if (!room) {
        room = await this.prisma.room.create({
          data: {
            type: RoomType.PRIVATE,
            creatorId: senderId,
            participants: { create: [{ userId: senderId }, { userId: receiverId }] },
          },
          include: { participants: true },
        });
      }

      // Transaction: create chat and optional files
      const chat = await this.prisma.$transaction(async (prisma) => {
        let resolvedChatType: ChatType = ChatType.TEXT;
        if (images?.length) {
          const firstFileExt = images[0].split('.').pop()?.toLowerCase();
          if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(firstFileExt))
            resolvedChatType = ChatType.IMAGE;
          else if (['mp4', 'mov', 'webm'].includes(firstFileExt)) resolvedChatType = ChatType.VIDEO;
          else resolvedChatType = ChatType.DOCUMENT;
        }

        const newChat = await prisma.chat.create({
          data: {
            senderId,
            roomId: room.id,
            message,
            type: resolvedChatType,
            replyToId: payload.replyToId || undefined,
          },
          include: {
            sender: { select: { id: true, username: true, avatar: true } },
            attachments: true,
            replyTo: {
              include: { sender: { select: { id: true, username: true, avatar: true } } },
            },
          },
        });

        if (images?.length) {
          await prisma.chatFile.createMany({
            data: images.map((url) => ({
              chatId: newChat.id,
              url,
              type: getFileTypeFromUrl(url),
            })),
          });
        }

        // Update room last message
        await prisma.room.update({
          where: { id: room.id },
          data: {
            lastMessage:
              message || (resolvedChatType === ChatType.IMAGE ? '[Image]' : '[Attachment]'),
            lastMessageAt: new Date(),
          },
        });

        return prisma.chat.findUnique({
          where: { id: newChat.id },
          include: {
            sender: { select: { id: true, username: true, avatar: true } },
            attachments: true,
            replyTo: {
              include: { sender: { select: { id: true, username: true, avatar: true } } },
            },
          },
        });
      });

      // Emit to all participants
      room.participants.forEach((p) => {
        const participantSocket = this.userSockets.get(p.userId);
        if (participantSocket) {
          participantSocket.emit(SocketEvents.DIRECT_MESSAGE, { roomId: room.id, chat });
        }
      });

      // Real-time notification to receiver
      const receiverSocket = this.userSockets.get(receiverId);
      if (receiverSocket) {
        receiverSocket.emit(SocketEvents.NOTIFICATION_NEW, {
          name: 'New Message',
          body: message,
          type: NotificationType.SYSTEM,
          actionUrl: `/rooms/${room.id}`,
          data: { senderId, roomId: room.id },
        });
      }

      // Live update message list for ALL participants
      for (const p of room.participants) {
        await this.pushMessageListUpdate(p.userId);
      }
    } catch (error) {
      console.error('DM processing failed:', error);
      socket.emit(SocketEvents.ERROR, { message: 'Failed to send message' });
    }
  }

  // -----------------------------
  // Handle typing event
  // -----------------------------
  @SubscribeMessage(SocketEvents.TYPING)
  async handleTyping(
    @MessageBody() payload: { roomId: string; isTyping: boolean },
    @ConnectedSocket() socket: Socket,
  ) {
    const senderId = socket.data.userId as string;
    const { roomId, isTyping } = payload;

    if (!senderId || !roomId) {
      return socket.emit(SocketEvents.ERROR, { message: 'Missing roomId or senderId' });
    }

    try {
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        select: {
          id: true,
          type: true,
          participants: {
            select: { userId: true },
            where: { userId: { not: senderId } },
          },
        },
      });

      if (!room) {
        return socket.emit(SocketEvents.ERROR, { message: 'Room not found' });
      }

      for (const participant of room.participants) {
        const receiverSocket = this.userSockets.get(participant.userId);
        receiverSocket?.emit(SocketEvents.TYPING, {
          senderId,
          isTyping,
          roomId,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('Typing event failed:', error);
      socket.emit(SocketEvents.ERROR, { message: 'Failed to process typing event' });
    }
  }

  // -----------------------------
  // Join/Leave Group Room
  // -----------------------------
  @SubscribeMessage(SocketEvents.JOIN_ROOM)
  async handleJoinRoom(
    @MessageBody() payload: { roomId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId as string;
    const { roomId } = payload;
    if (!userId || !roomId) return;

    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return socket.emit(SocketEvents.ERROR, { message: 'Room not found' });

    const exists = await this.prisma.roomParticipant.findFirst({ where: { userId, roomId } });
    if (!exists) await this.prisma.roomParticipant.create({ data: { userId, roomId } });

    socket.join(roomId);
    socket.emit(SocketEvents.JOINED_ROOM, { roomId, message: 'Successfully joined the room' });
    socket.to(roomId).emit(SocketEvents.USER_JOINED, { roomId, userId });
  }

  @SubscribeMessage(SocketEvents.LEAVE_ROOM)
  async handleLeaveRoom(
    @MessageBody() payload: { roomId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId as string;
    const { roomId } = payload;
    if (!userId || !roomId) return;

    await this.prisma.roomParticipant.deleteMany({ where: { userId, roomId } });
    socket.leave(roomId);
    socket.emit(SocketEvents.LEFT_ROOM, { roomId, message: 'Successfully left the room' });
    socket.to(roomId).emit(SocketEvents.USER_LEFT, { roomId, userId });
  }

  // -----------------------------
  // Group Messaging
  // -----------------------------
  @SubscribeMessage(SocketEvents.MESSAGE)
  async handleMessage(
    @MessageBody() payload: { roomId: string; message: string; replyToId?: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId as string;
    const { roomId, message, replyToId } = payload;
    if (!userId || !roomId || !message) return;

    const chat = await this.prisma.$transaction(async (tx) => {
      const newChat = await tx.chat.create({
        data: { senderId: userId, roomId, message, replyToId: replyToId || undefined },
        include: {
          sender: { select: { id: true, username: true, avatar: true } },
          attachments: true,
          replyTo: { include: { sender: { select: { id: true, username: true, avatar: true } } } },
        },
      });

      await tx.room.update({
        where: { id: roomId },
        data: {
          lastMessage: message,
          lastMessageAt: new Date(),
        },
      });

      return newChat;
    });

    const participants = await this.prisma.roomParticipant.findMany({
      where: { roomId },
      select: { userId: true },
    });

    participants.forEach(({ userId: participantId }) => {
      const participantSocket = this.userSockets.get(participantId);
      if (participantSocket) participantSocket.emit(SocketEvents.MESSAGE, chat);
    });

    // Live update message list for ALL participants
    for (const { userId: participantId } of participants) {
      await this.pushMessageListUpdate(participantId);
    }
  }

  // -----------------------------
  // Edit Message
  // -----------------------------
  @SubscribeMessage(SocketEvents.EDIT_MESSAGE)
  async handleEditMessage(
    @MessageBody() payload: { chatId: string; newMessage: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId as string;
    const { chatId, newMessage } = payload;
    if (!userId || !chatId || !newMessage) return;

    try {
      const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
      if (!chat) return socket.emit(SocketEvents.ERROR, { message: 'Message not found' });
      if (chat.senderId !== userId)
        return socket.emit(SocketEvents.ERROR, { message: 'Unauthorized' });

      const updatedChat = await this.prisma.chat.update({
        where: { id: chatId },
        data: { message: newMessage, isEdited: true },
        include: {
          sender: { select: { id: true, username: true, avatar: true } },
          attachments: true,
          replyTo: { include: { sender: { select: { id: true, username: true, avatar: true } } } },
        },
      });

      const participants = await this.prisma.roomParticipant.findMany({
        where: { roomId: updatedChat.roomId },
        select: { userId: true },
      });

      participants.forEach(({ userId: participantId }) => {
        const participantSocket = this.userSockets.get(participantId);
        if (participantSocket) participantSocket.emit(SocketEvents.EDIT_MESSAGE, updatedChat);
      });
    } catch (error) {
      console.error('Edit message failed:', error);
      socket.emit(SocketEvents.ERROR, { message: 'Failed to edit message' });
    }
  }

  // -----------------------------
  // Delete Message
  // -----------------------------
  @SubscribeMessage(SocketEvents.DELETE_MESSAGE)
  async handleDeleteMessage(
    @MessageBody() payload: { chatId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId as string;
    const { chatId } = payload;
    if (!userId || !chatId) return;

    try {
      const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
      if (!chat) return socket.emit(SocketEvents.ERROR, { message: 'Message not found' });
      if (chat.senderId !== userId)
        return socket.emit(SocketEvents.ERROR, { message: 'Unauthorized' });

      const deletedChat = await this.prisma.chat.update({
        where: { id: chatId },
        data: { isDeleted: true },
        include: {
          sender: { select: { id: true, username: true, avatar: true } },
          attachments: true,
          replyTo: { include: { sender: { select: { id: true, username: true, avatar: true } } } },
        },
      });

      const participants = await this.prisma.roomParticipant.findMany({
        where: { roomId: deletedChat.roomId },
        select: { userId: true },
      });

      participants.forEach(({ userId: participantId }) => {
        const participantSocket = this.userSockets.get(participantId);
        if (participantSocket) participantSocket.emit(SocketEvents.DELETE_MESSAGE, deletedChat);
      });
    } catch (error) {
      console.error('Delete message failed:', error);
      socket.emit(SocketEvents.ERROR, { message: 'Failed to delete message' });
    }
  }

  // -----------------------------
  // Fetch Chats (Paginated + Auto-Mark Read)
  // -----------------------------
  @SubscribeMessage(SocketEvents.FETCH_CHATS)
  async handleFetchChats(
    @MessageBody() payload: { roomId: string; page?: number; limit?: number },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId as string;
    const { roomId, page = 1, limit = 10 } = payload;
    if (!userId || !roomId) return;

    const skip = (page - 1) * limit;
    const total = await this.prisma.chat.count({ where: { roomId } });
    const totalPage = Math.ceil(total / limit);

    const messages = await this.prisma.chat.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        sender: { select: { id: true, username: true, avatar: true } },
        attachments: true,
        replyTo: { include: { sender: { select: { id: true, username: true, avatar: true } } } },
      },
    });

    // Auto-mark as read when user fetches chats (standard chat UX)
    await this.prisma.roomParticipant.updateMany({
      where: { userId, roomId },
      data: { lastReadAt: new Date() },
    });

    // Push updated message list so unread badge clears
    await this.pushMessageListUpdate(userId);

    socket.emit(SocketEvents.FETCH_CHATS, {
      meta: { page, limit, total, totalPage },
      data: messages.reverse(), // Return in chronological order
    });
  }

  // -----------------------------
  // Mark Room as Read
  // -----------------------------
  @SubscribeMessage(SocketEvents.MARK_READ)
  async handleMarkRead(
    @MessageBody() payload: { roomId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId as string;
    const { roomId } = payload;
    if (!userId || !roomId) return;

    // Update lastReadAt for this participant
    await this.prisma.roomParticipant.updateMany({
      where: { userId, roomId },
      data: { lastReadAt: new Date() },
    });

    // Push updated message list so unread badge clears
    await this.pushMessageListUpdate(userId);
  }

  // -----------------------------
  // Message List (Paginated + Unread Counts)
  // -----------------------------
  @SubscribeMessage(SocketEvents.MESSAGE_LIST)
  async handleMessageList(
    @MessageBody() payload: { page?: number; limit?: number },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId as string;
    if (!userId) return;

    const page = payload?.page || 1;
    const limit = payload?.limit || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination meta
    const total = await this.prisma.roomParticipant.count({
      where: { userId },
    });

    // Fetch rooms with pagination, ordered by lastMessageAt
    const roomParticipants = await this.prisma.roomParticipant.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, username: true, avatar: true } },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: { select: { id: true, username: true, avatar: true } },
              },
            },
          },
        },
      },
      orderBy: { room: { lastMessageAt: 'desc' } },
      skip,
      take: limit,
    });

    // Compute unread counts per room using lastReadAt
    const result = await Promise.all(
      roomParticipants.map(async ({ room, lastReadAt }) => {
        const unreadCount = await this.prisma.chat.count({
          where: {
            roomId: room.id,
            senderId: { not: userId },
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
          },
        });

        return {
          roomId: room.id,
          name: room.name,
          avatar: room.avatar,
          type: room.type,
          lastMessage: room.messages[0] || null,
          lastMessageAt: room.lastMessageAt,
          participants: room.participants,
          unreadCount,
        };
      }),
    );

    // Sort by lastMessageAt (newest first)
    result.sort((a, b) => {
      if (!a.lastMessageAt || !b.lastMessageAt) return 0;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    const totalPage = Math.ceil(total / limit);

    socket.emit(SocketEvents.MESSAGE_LIST, {
      meta: { page, limit, total, totalPage },
      data: result,
    });
  }

  // -----------------------------
  // Live Push: Message List Update
  // -----------------------------
  private async pushMessageListUpdate(userId: string) {
    const userSocket = this.userSockets.get(userId);
    if (!userSocket) return;

    // Re-fetch first page (default view) for live push
    const roomParticipants = await this.prisma.roomParticipant.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, username: true, avatar: true } },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: { select: { id: true, username: true, avatar: true } },
              },
            },
          },
        },
      },
      orderBy: { room: { lastMessageAt: 'desc' } },
      take: 10,
    });

    const result = await Promise.all(
      roomParticipants.map(async ({ room, lastReadAt }) => {
        const unreadCount = await this.prisma.chat.count({
          where: {
            roomId: room.id,
            senderId: { not: userId },
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
          },
        });

        return {
          roomId: room.id,
          name: room.name,
          avatar: room.avatar,
          type: room.type,
          lastMessage: room.messages[0] || null,
          lastMessageAt: room.lastMessageAt,
          participants: room.participants,
          unreadCount,
        };
      }),
    );

    result.sort((a, b) => {
      if (!a.lastMessageAt || !b.lastMessageAt) return 0;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    userSocket.emit(SocketEvents.MESSAGE_LIST_UPDATE, { data: result });
  }
}
