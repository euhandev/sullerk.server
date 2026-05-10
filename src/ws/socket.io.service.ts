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
import { RoomType, NotificationType, FileType } from '@prisma/client';
import { Server, Socket } from 'socket.io';

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
      this.server.emit('status', { userId, isOnline: false });
    }
    console.log('User disconnected:', socket.id);
  }

  // -----------------------------
  // Authenticate User
  // -----------------------------
  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @MessageBody() payload: { token: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const { token } = payload;
    if (!token) return socket.disconnect(true);

    try {
      const user = await this.jwtService.verifyAsync(token, {
        secret: this.config.get('JWT_SECRET'),
      });
      if (!user) throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid token');

      const userId = (user as any).id;
      socket.data.userId = userId;

      this.onlineUsers.add(userId);
      this.userSockets.set(userId, socket);

      this.server.emit('authenticate', { userId, isOnline: true });
    } catch (err) {
      console.error('Authentication error:', err);
      socket.disconnect(true);
    }
  }

  // -----------------------------
  // Private Direct Message
  // -----------------------------
  @SubscribeMessage('directMessage')
  async handleDirectMessage(
    @MessageBody()
    payload: { receiverId: string; message: string; images?: string[] },
    @ConnectedSocket() socket: Socket,
  ) {
    const senderId = socket.data.userId as string;
    const { receiverId, message, images } = payload;

    if (!senderId || !receiverId) {
      return socket.emit('error', { message: 'Invalid payload' });
    }
    if (senderId === receiverId) {
      return socket.emit('error', { message: 'Cannot message yourself' });
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
        const newChat = await prisma.chat.create({
          data: {
            senderId,
            roomId: room.id,
            message,
          },
          include: {
            sender: { select: { id: true, username: true, avatar: true } },
            attachments: true,
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

        return prisma.chat.findUnique({
          where: { id: newChat.id },
          include: {
            sender: { select: { id: true, username: true, avatar: true } },
            attachments: true,
          },
        });
      });

      // Emit to all participants
      room.participants.forEach((p) => {
        const participantSocket = this.userSockets.get(p.userId);
        if (participantSocket) {
          participantSocket.emit('directMessage', { roomId: room.id, chat });
        }
      });

      // Real-time notification to receiver
      const receiverSocket = this.userSockets.get(receiverId);
      if (receiverSocket) {
        receiverSocket.emit('notification:new', {
          name: 'New Message',
          body: message,
          type: NotificationType.SYSTEM,
          actionUrl: `/rooms/${room.id}`,
          data: { senderId, roomId: room.id },
        });
      }
    } catch (error) {
      console.error('DM processing failed:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  // -----------------------------
  // Handle typing event
  // -----------------------------
  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() payload: { roomId: string; isTyping: boolean },
    @ConnectedSocket() socket: Socket,
  ) {
    const senderId = socket.data.userId as string;
    const { roomId, isTyping } = payload;

    if (!senderId || !roomId) {
      return socket.emit('error', { message: 'Missing roomId or senderId' });
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
        return socket.emit('error', { message: 'Room not found' });
      }

      for (const participant of room.participants) {
        const receiverSocket = this.userSockets.get(participant.userId);
        receiverSocket?.emit('typing', {
          senderId,
          isTyping,
          roomId,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('Typing event failed:', error);
      socket.emit('error', { message: 'Failed to process typing event' });
    }
  }

  // -----------------------------
  // Join/Leave Group Room
  // -----------------------------
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() payload: { roomId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId as string;
    const { roomId } = payload;
    if (!userId || !roomId) return;

    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return socket.emit('error', { message: 'Room not found' });

    const exists = await this.prisma.roomParticipant.findFirst({ where: { userId, roomId } });
    if (!exists) await this.prisma.roomParticipant.create({ data: { userId, roomId } });

    socket.join(roomId);
    socket.emit('joinedRoom', { roomId, message: 'Successfully joined the room' });
    socket.to(roomId).emit('room:userJoined', { roomId, userId });
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() payload: { roomId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId as string;
    const { roomId } = payload;
    if (!userId || !roomId) return;

    await this.prisma.roomParticipant.deleteMany({ where: { userId, roomId } });
    socket.leave(roomId);
    socket.emit('leftRoom', { roomId, message: 'Successfully left the room' });
    socket.to(roomId).emit('room:userLeft', { roomId, userId });
  }

  // -----------------------------
  // Group Messaging
  // -----------------------------
  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() payload: { roomId: string; message: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId as string;
    const { roomId, message } = payload;
    if (!userId || !roomId || !message) return;

    const chat = await this.prisma.chat.create({
      data: { senderId: userId, roomId, message },
      include: { sender: { select: { id: true, username: true, avatar: true } } },
    });

    const participants = await this.prisma.roomParticipant.findMany({
      where: { roomId },
      select: { userId: true },
    });

    participants.forEach(({ userId: participantId }) => {
      const participantSocket = this.userSockets.get(participantId);
      if (participantSocket) participantSocket.emit('message', chat);
    });
  }

  // -----------------------------
  // Fetch Chats
  // -----------------------------
  @SubscribeMessage('fetchChats')
  async handleFetchChats(
    @MessageBody() payload: { roomId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = socket.data.userId as string;
    const { roomId } = payload;
    if (!userId || !roomId) return;

    const messages = await this.prisma.chat.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, username: true, avatar: true } },
        attachments: true,
      },
    });

    socket.emit('fetchChats', messages);
  }

  // -----------------------------
  // Message List
  // -----------------------------
  @SubscribeMessage('messageList')
  async handleMessageList(@ConnectedSocket() socket: Socket) {
    const userId = socket.data.userId as string;
    if (!userId) return;

    const roomParticipants = await this.prisma.roomParticipant.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    });

    const result = roomParticipants
      .map(({ room }) => ({
        roomId: room.id,
        avatar: room.avatar,
        name: room.name,
        lastMessage: room.messages[0] || null,
      }))
      .sort((a, b) => {
        if (!a.lastMessage || !b.lastMessage) return 0;
        return (
          new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
        );
      });

    socket.emit('messageList', result);
  }
}
