// import { ConfigService } from '@/config/config.service';
// import { AppEvents } from '@/events/app-events.service';
// import { PrismaService } from '@/helper/prisma.service';
// import { CreateBrokerBidDto } from '@/modules/broker-bid/dto/create-broker-bid.dto';
// import { NotificationService } from '@/modules/notification/notification.service';
// import { getFileTypeFromUrl } from '@/modules/property/property.utils';
// import { UserService } from '@/modules/user/user.service';
// import { ApiError } from '@/utils/api_error';
// import { PrismaHelperService } from '@/utils/is_existance';
// import { HttpStatus } from '@nestjs/common';
// import { OnEvent } from '@nestjs/event-emitter';
// import { JwtService } from '@nestjs/jwt';
// import {
//   ConnectedSocket,
//   MessageBody,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
//   OnGatewayInit,
//   SubscribeMessage,
//   WebSocketGateway,
//   WebSocketServer,
// } from '@nestjs/websockets';
// import {
//   BrokerBidStatus,
//   BrokerBidType,
//   BuyerBid,
//   Notification,
//   NotificationType,
//   Property,
//   Role,
//   RoomType,
// } from '@prisma/client';
// import { Server, Socket } from 'socket.io';

// @WebSocketGateway({
//   cors: {
//     origin: '*',
//     methods: ['GET', 'POST'],
//   },
//   perMessageDeflate: false,
// })
// export class WebsocketGateway
//   implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
// {
//   @WebSocketServer()
//   server: Server;

//   private onlineUsers = new Set<string>();
//   private userSockets = new Map<string, Socket>();

//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly config: ConfigService,
//     private readonly jwtService: JwtService,
//     private readonly helper: PrismaHelperService,
//     private readonly userService: UserService,
//     private readonly notificationService: NotificationService,
//     private readonly events: AppEvents,
//   ) {}

//   @OnEvent('bid-created', { async: true })
//   private handleBidCreated({
//     bid,
//     propertyId,
//   }: {
//     bid: BuyerBid;
//     propertyId: string;
//   }) {
//     this.server.to(`property_${propertyId}`).emit('bid-created', bid);
//   }

//   @OnEvent('bid-updated', { async: true })
//   private handleBidUpdated({
//     bid,
//     propertyId,
//   }: {
//     bid: BuyerBid;
//     propertyId: string;
//   }) {
//     this.server.to(`property_${propertyId}`).emit('bid-created', bid);
//   }

//   @OnEvent('bid-selected', { async: true })
//   private handleBidSelected({ bid }: { bid: BuyerBid }) {
//     this.server.to(`property_${bid.propertyId}`).emit('bid-selected', bid);
//   }

//   @OnEvent('bid-rejected', { async: true })
//   private handleBidRejected({ bid }: { bid: BuyerBid }) {
//     this.server.to(`property_${bid.propertyId}`).emit('bid-rejected', bid);
//   }

//   @SubscribeMessage('joinPropertyRoom')
//   async handleJoinPropertyRoom(
//     @MessageBody() payload: { propertyId: string },
//     @ConnectedSocket() socket: Socket,
//   ) {
//     const roomId = `property_${payload.propertyId}`;
//     socket.join(roomId);
//     console.log(`User ${socket.data.userId} joined ${roomId}`);
//   }

//   afterInit(server: Server) {
//     console.log('\x1b[36m✨ [Socket.IO] \x1b[1mServer initialized 🚀\x1b[0m');

//     server.of('/').on('connect_error', (err: any) => {
//       console.error(
//         'Connection error:',
//         err.message,
//         err.description,
//         err.context,
//       );
//     });
//   }

//   handleConnection(socket: Socket) {
//     console.log('A user connected:', socket.id);
//   }

//   handleDisconnect(socket: Socket) {
//     const userId = socket.data.userId as string;
//     if (userId) {
//       this.onlineUsers.delete(userId);
//       this.userSockets.delete(userId);
//       this.server.emit('status', { userId, isOnline: false });
//     }
//     console.log('User disconnected:', socket.id);
//   }

//   @SubscribeMessage('authenticate')
//   async handleAuthenticate(
//     @MessageBody() payload: { token: string },
//     @ConnectedSocket() socket: Socket,
//   ) {
//     const { token } = payload;

//     if (!token) {
//       socket.disconnect(true);
//       return;
//     }
//     try {
//       const user = await this.jwtService.verifyAsync(token, {
//         secret: this.config.get('JWT_SECRET'),
//       });

//       if (!user) throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid token');

//       const userId = (user as any).id;
//       socket.data.userId = userId;

//       this.onlineUsers.add(userId);
//       this.userSockets.set(userId, socket);

//       this.server.emit('status', { userId, isOnline: true });
//     } catch (err) {
//       console.error('Authentication error:', err);
//       socket.disconnect(true);
//     }
//   }

//   @SubscribeMessage('directMessage')
//   async handleDirectMessage(
//     @MessageBody()
//     payload: { receiverId: string; message: string; images?: string[] },
//     @ConnectedSocket() socket: Socket,
//   ) {
//     const senderId = socket.data.userId as string;
//     const { receiverId, message, images } = payload;

//     if (!senderId || !receiverId) {
//       socket.emit('error', { message: 'Missing user IDs' });
//       return;
//     }

//     if (senderId === receiverId) {
//       socket.emit('error', { message: 'Cannot send message to yourself' });
//       return;
//     }

//     try {
//       const [userA, userB] = [senderId, receiverId].sort();
//       let room = await this.prisma.room.findFirst({
//         where: {
//           type: RoomType.PRIVATE,
//           participants: {
//             every: {
//               userId: { in: [userA, userB] },
//             },
//           },
//         },
//         include: { participants: true },
//       });

//       if (!room) {
//         room = await this.prisma.room.create({
//           data: {
//             type: RoomType.PRIVATE,
//             creatorId: senderId,
//             participants: {
//               createMany: {
//                 data: [{ userId: userA }, { userId: userB }],
//               },
//             },
//           },
//           include: { participants: true },
//         });
//       }

//       const chat = await this.prisma.$transaction(async (prisma) => {
//         const newChat = await prisma.chat.create({
//           data: {
//             senderId,
//             roomId: room!.id,
//             message,
//           },
//           include: {
//             sender: { select: { id: true, username: true, avatar: true } },
//             images: true,
//           },
//         });

//         if (images?.length) {
//           await prisma.file.createMany({
//             data: images.map((url) => ({
//               chatId: newChat.id,
//               url,
//               type: getFileTypeFromUrl(url),
//             })),
//           });
//         }

//         return prisma.chat.findUnique({
//           where: { id: newChat.id },
//           include: {
//             sender: { select: { id: true, username: true, avatar: true } },
//             images: true,
//           },
//         });
//       });

//       const roomParticipantIds = room.participants.map((p) => p.userId);
//       for (const userId of roomParticipantIds) {
//         const participantSocket = this.userSockets.get(userId);
//         if (participantSocket) {
//           participantSocket.emit('directMessage', {
//             roomId: room.id,
//             chat,
//           });
//         }
//       }

//       if (receiverId !== senderId) {
//         try {
//           const receiver = await this.prisma.user.findFirst({
//             where: { id: receiverId },
//           });
//           if (receiver?.fcmToken) {
//             const actionUrls: Record<Role, string> = {
//               [Role.CUSTOMER]: `/broker-chat/${senderId}`,
//               [Role.BROKER]: `/broker-dashboard/messages/${senderId}`,
//               [Role.BROKER_FIRM]: `/firm-dashboard/messages/${senderId}`,
//               [Role.ADMIN]: `/admin-dashboard/messages/${senderId}`,
//               SUPER_ADMIN: '/messages',
//             };

//             const unreadMessageNotificationCount = await this.prisma.chat.count(
//               { where: { isRead: false, senderId, roomId: room?.id } },
//             );

//             const payload: Notification = {
//               title:
//                 unreadMessageNotificationCount > 0
//                   ? `${unreadMessageNotificationCount} new messages`
//                   : 'New Message',
//               body:
//                 message.length > 50
//                   ? `${message.substring(0, 47)}...`
//                   : message,
//               type: NotificationType.MESSAGE,
//               data: JSON.stringify({ chatId: chat.id, roomId: room.id }),
//               actionUrl: actionUrls[receiver?.role ?? Role.ADMIN],
//               userId: receiverId,
//               fcmToken: receiver?.fcmToken,
//               read: false,
//             } as any;

//             if (unreadMessageNotificationCount) {
//               const findFirst = await this.prisma.notification.findFirst({
//                 where: {
//                   userId: receiverId,
//                   type: NotificationType.MESSAGE,
//                   read: false,
//                 },
//               });

//               await this.notificationService.updateNotification(
//                 findFirst?.id,
//                 receiver.fcmToken,
//                 payload,
//                 receiverId,
//               );
//             } else {
//               await this.notificationService.sendNotification(
//                 receiver.fcmToken,
//                 payload,
//                 receiverId,
//               );
//             }
//           }
//         } catch (notifError) {
//           console.error('Notification failed:', notifError);
//         }
//       }
//     } catch (error) {
//       console.error('DM processing failed:', error);
//       socket.emit('error', {
//         message: 'Failed to send message',
//         details:
//           process.env.NODE_ENV === 'development' ? error.message : undefined,
//       });
//     }
//   }

//   @SubscribeMessage('readMessage')
//   async handleReadMessage(
//     @MessageBody()
//     payload: {
//       roomId: string;
//       senderId: string;
//     },
//     @ConnectedSocket() socket: Socket,
//   ) {
//     const { roomId, senderId } = payload;
//     await this.prisma.chat.updateMany({
//       where: { senderId, roomId },
//       data: { isRead: true },
//     });

//     socket.emit('readMessage', { roomId, message: 'all messages read' });
//   }

//   @SubscribeMessage('updateMessage')
//   async handleUpdateMessage(
//     @MessageBody()
//     payload: { messageId: string; newMessage: string; images?: string[] },
//     @ConnectedSocket() socket: Socket,
//   ) {
//     const senderId = socket.data.userId as string;
//     const { messageId, newMessage, images } = payload;

//     if (!senderId || !messageId || !newMessage) {
//       socket.emit('error', { message: 'Invalid payload for update' });
//       return;
//     }

//     try {
//       const chat = await this.prisma.chat.findUnique({
//         where: { id: messageId },
//         include: { room: { include: { participants: true } } },
//       });

//       if (!chat || chat.senderId !== senderId) {
//         socket.emit('error', {
//           message: 'Not authorized to update this message',
//         });
//         return;
//       }

//       const updatedChat = await this.prisma.chat.update({
//         where: { id: messageId },
//         data: { message: newMessage },
//         include: {
//           sender: { select: { id: true, username: true, avatar: true } },
//         },
//       });

//       if (images?.length) {
//         await this.prisma.file.deleteMany({ where: { propertyId: messageId } });
//         const uploadableFiles = images.map((file) => ({
//           propertyId: messageId,
//           url: file,
//           type: getFileTypeFromUrl(file),
//         }));
//         await this.prisma.file.createMany({ data: uploadableFiles });
//       }

//       for (const participant of chat.room.participants) {
//         const participantSocket = this.userSockets.get(participant.userId);
//         if (participantSocket) {
//           participantSocket.emit('updateMessage', {
//             roomId: chat.roomId,
//             chat: updatedChat,
//           });
//         }
//       }
//     } catch (error) {
//       console.error('Update DM error:', error);
//       socket.emit('error', { message: 'Failed to update message' });
//     }
//   }

//   @SubscribeMessage('deleteMessage')
//   async handleDeleteMessage(
//     @MessageBody() payload: { messageId: string },
//     @ConnectedSocket() socket: Socket,
//   ) {
//     const senderId = socket.data.userId as string;
//     const { messageId } = payload;

//     if (!senderId || !messageId) {
//       socket.emit('error', { message: 'Invalid payload for delete' });
//       return;
//     }

//     try {
//       const chat = await this.prisma.chat.findUnique({
//         where: { id: messageId },
//         include: { room: { include: { participants: true } } },
//       });

//       if (!chat || chat.senderId !== senderId) {
//         socket.emit('error', {
//           message: 'Not authorized to delete this message',
//         });
//         return;
//       }

//       await this.prisma.file.deleteMany({ where: { propertyId: messageId } });

//       await this.prisma.chat.delete({ where: { id: messageId } });

//       for (const participant of chat.room.participants) {
//         const participantSocket = this.userSockets.get(participant.userId);
//         if (participantSocket) {
//           participantSocket.emit('deleteMessage', {
//             roomId: chat.roomId,
//             messageId,
//           });
//         }
//       }
//     } catch (error) {
//       console.error('Delete DM error:', error);
//       socket.emit('error', { message: 'Failed to delete message' });
//     }
//   }

//   @SubscribeMessage('bid-creation')
//   async handleBidCreation(
//     @MessageBody() payload: CreateBrokerBidDto,
//     @ConnectedSocket() socket: Socket,
//   ) {
//     try {
//       console.log(payload);
//       const isBrokerExists = await this.prisma.broker.findUnique({
//         where: { userId: socket.data.userId },
//       });

//       if (!isBrokerExists) {
//         throw new ApiError(HttpStatus.NOT_FOUND, 'Broker not found');
//       }

//       const property: Property | null =
//         await this.helper.validateEntityExistence(
//           'property',
//           payload?.propertyId,
//           'Property Not Found',
//         );

//       const existingBid = await this.prisma.brokerBid.findFirst({
//         where: {
//           brokerId: isBrokerExists.id,
//           propertyId: payload?.propertyId,
//         },
//       });

//       if (existingBid) {
//         throw new ApiError(
//           HttpStatus.CONFLICT,
//           'You have already submitted a bid for this property',
//         );
//       }

//       if (isBrokerExists.brokerFirmId) {
//         await this.helper.validateEntityExistence(
//           'brokerFirm',
//           isBrokerExists.brokerFirmId,
//           'Broker Firm Not Found',
//         );
//       }

//       const brokerBid = await this.prisma.brokerBid.create({
//         data: {
//           ...payload,
//           type: payload?.type as BrokerBidType,
//           price: payload?.price,
//           brokerId: isBrokerExists.id,
//           brokerFirmId: isBrokerExists.brokerFirmId,
//           customerId: property.sellerId,
//           propertyId: payload?.propertyId,
//           status: BrokerBidStatus.SUBMITTED,
//         },
//       });

//       const propertyOwner = await this.prisma.customer.findUnique({
//         where: { id: property?.sellerId },
//       });

//       let room = await this.prisma.room.findFirst({
//         where: {
//           type: RoomType.PRIVATE,
//           participants: {
//             every: {
//               userId: {
//                 in: [isBrokerExists?.userId, propertyOwner?.userId],
//               },
//             },
//           },
//         },
//         include: { participants: true },
//       });

//       if (!room) {
//         room = await this.prisma.room.create({
//           data: {
//             type: RoomType.PRIVATE,
//             creatorId: isBrokerExists?.userId,
//             participants: {
//               create: [
//                 { userId: isBrokerExists?.userId },
//                 { userId: propertyOwner.userId },
//               ],
//             },
//           },
//           include: { participants: true },
//         });
//       }

//       const chat = await this.prisma.chat.create({
//         data: {
//           senderId: isBrokerExists?.userId,
//           roomId: room.id,
//           message: 'bid request',
//           brokerBidId: brokerBid?.id,
//         },
//         include: {
//           images: true,
//           brokerBid: {
//             include: {
//               broker: {
//                 select: { fullName: true, address: true },
//               },
//             },
//           },
//         },
//       });

//       socket.emit('bid-creation', {
//         chat,
//         message: 'Successfully Created Broker Bid',
//       });

//       const receiverId = property?.sellerId;
//       const senderId = isBrokerExists?.userId;

//       if (receiverId !== senderId) {
//         try {
//           const receiver = await this.prisma.user.findFirst({
//             where: { id: property?.sellerId },
//           });
//           if (receiver?.fcmToken) {
//             const actionUrls: Record<Role, string> = {
//               [Role.CUSTOMER]: `/broker-chat/${senderId}`,
//               [Role.BROKER]: `/broker-dashboard/messages/${senderId}`,
//               [Role.BROKER_FIRM]: `/firm-dashboard/messages/${senderId}`,
//               [Role.ADMIN]: `/admin-dashboard/messages/${senderId}`,
//               SUPER_ADMIN: '/messages',
//             };

//             const unreadMessageNotificationCount = await this.prisma.chat.count(
//               { where: { isRead: false, senderId, roomId: room?.id } },
//             );

//             const payload: Notification = {
//               title:
//                 unreadMessageNotificationCount > 0
//                   ? `${unreadMessageNotificationCount} new messages`
//                   : 'New Message',
//               type: NotificationType.SYSTEM,
//               data: JSON.stringify({ chatId: chat.id, roomId: room.id }),
//               actionUrl: actionUrls[receiver?.role ?? Role.ADMIN],
//               userId: receiverId,
//               fcmToken: receiver?.fcmToken,
//               read: false,
//             } as any;

//             if (unreadMessageNotificationCount) {
//               const findFirst = await this.prisma.notification.findFirst({
//                 where: {
//                   userId: receiverId,
//                   type: NotificationType.SYSTEM,
//                   read: false,
//                 },
//               });

//               await this.notificationService.updateNotification(
//                 findFirst?.id,
//                 receiver.fcmToken,
//                 payload,
//                 receiverId,
//               );
//             } else {
//               await this.notificationService.sendNotification(
//                 receiver.fcmToken,
//                 payload,
//                 receiverId,
//               );
//             }
//           }
//         } catch (notifError) {
//           console.error('Notification failed:', notifError);
//         }
//       }

//       return brokerBid;
//     } catch (error) {
//       socket.emit('broker-bid-error', {
//         message: error.message || 'Failed to create broker bid',
//         status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
//       });
//     }
//   }

//   @SubscribeMessage('bid-selection')
//   async handleSelectBid(
//     @MessageBody() payload: { id: string },
//     @ConnectedSocket() socket: Socket,
//   ) {
//     try {
//       const updatedBid = await this.prisma.$transaction(async (tx) => {
//         const customer = await tx.customer.findUnique({
//           where: { userId: socket.data.userId },
//         });
//         if (!customer) {
//           throw new ApiError(HttpStatus.NOT_FOUND, 'Customer not found');
//         }

//         const bid = await tx.brokerBid.findUnique({
//           where: { id: payload.id },
//         });

//         if (!bid) {
//           throw new ApiError(HttpStatus.NOT_FOUND, 'Broker bid not found');
//         }

//         if (bid.status === BrokerBidStatus.APPROVED) {
//           throw new ApiError(
//             HttpStatus.BAD_REQUEST,
//             'This bid is already approved',
//           );
//         }
//         if (bid.status === BrokerBidStatus.EXPIRED) {
//           throw new ApiError(HttpStatus.BAD_REQUEST, 'This bid is expired');
//         }
//         if (bid.status === BrokerBidStatus.REJECTED) {
//           throw new ApiError(
//             HttpStatus.BAD_REQUEST,
//             'This bid is already rejected',
//           );
//         }

//         const approvedBid = await tx.brokerBid.update({
//           where: { id: payload.id },
//           data: {
//             broker: { connect: { id: bid.brokerId } },
//             brokerFirm: { connect: { id: bid.brokerFirmId } },
//             status: BrokerBidStatus.APPROVED,
//             property: {
//               update: {
//                 brokerId: bid.brokerId,
//               },
//             },
//           },
//           include: { property: true, customer: true },
//         });

//         await tx.brokerBid.updateMany({
//           where: {
//             propertyId: bid.propertyId,
//             id: { not: payload.id },
//           },
//           data: { status: BrokerBidStatus.REJECTED },
//         });

//         return approvedBid;
//       });

//       socket.emit('bid-selection', {
//         bid: updatedBid,
//         message: 'Broker bid successfully selected',
//       });

//       const receiverId = updatedBid?.brokerId;
//       const senderId = updatedBid?.customer?.userId;
//       if (receiverId !== senderId) {
//         try {
//           const receiver = await this.prisma.user.findFirst({
//             where: { id: receiverId },
//           });
//           if (receiver?.fcmToken) {
//             const actionUrls: Record<Role, string> = {
//               [Role.CUSTOMER]: `/broker-chat/${senderId}`,
//               [Role.BROKER]: `/broker-dashboard/messages/${senderId}`,
//               [Role.BROKER_FIRM]: `/firm-dashboard/messages/${senderId}`,
//               [Role.ADMIN]: `/admin-dashboard/messages/${senderId}`,
//               SUPER_ADMIN: '/messages',
//             };

//             const payload: Notification = {
//               title: `Congratulations! your bid accepted by seller ${updatedBid?.customer?.fullName} for bid id #${updatedBid?.id}, property #${updatedBid?.property?.id}`,
//               type: NotificationType.SYSTEM,
//               data: JSON.stringify({}),
//               actionUrl: actionUrls[receiver?.role ?? Role.ADMIN],
//               userId: receiverId,
//               fcmToken: receiver?.fcmToken,
//               read: false,
//             } as any;

//             await this.notificationService.sendNotification(
//               receiver.fcmToken,
//               payload,
//               receiverId,
//             );
//           }
//         } catch (notifError) {
//           console.error('Notification failed:', notifError);
//         }
//       }
//     } catch (error) {
//       socket.emit('bid-selection-error', {
//         message: error.message || 'Failed to select broker bid',
//         status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
//       });
//     }
//   }

//   @SubscribeMessage('bid-rejection')
//   async handleRejectBid(
//     @MessageBody() payload: { id: string },
//     @ConnectedSocket() socket: Socket,
//   ) {
//     try {
//       const rejectedBid = await this.prisma.$transaction(async (tx) => {
//         const customer = await tx.customer.findUnique({
//           where: { userId: socket.data.userId },
//         });
//         if (!customer) {
//           throw new ApiError(HttpStatus.NOT_FOUND, 'Customer not found');
//         }

//         const bid = await tx.brokerBid.findUnique({
//           where: { id: payload.id },
//         });

//         if (!bid) {
//           throw new ApiError(HttpStatus.NOT_FOUND, 'Broker bid not found');
//         }

//         if (bid.status === BrokerBidStatus.REJECTED) {
//           throw new ApiError(
//             HttpStatus.BAD_REQUEST,
//             'This bid is already rejected',
//           );
//         }
//         if (bid.status === BrokerBidStatus.APPROVED) {
//           throw new ApiError(
//             HttpStatus.BAD_REQUEST,
//             'This bid is already approved',
//           );
//         }
//         if (bid.status === BrokerBidStatus.EXPIRED) {
//           throw new ApiError(HttpStatus.BAD_REQUEST, 'This bid is expired');
//         }

//         const updatedBid = await tx.brokerBid.update({
//           where: { id: payload.id },
//           data: { status: BrokerBidStatus.REJECTED },
//           include: { customer: true, property: true },
//         });

//         return updatedBid;
//       });

//       socket.emit('bid-rejection', {
//         bid: rejectedBid,
//         message: 'Broker bid successfully rejected',
//       });

//       const receiverId = rejectedBid?.brokerId;
//       const senderId = rejectedBid?.customer?.userId;
//       if (receiverId !== senderId) {
//         try {
//           const receiver = await this.prisma.user.findFirst({
//             where: { id: receiverId },
//           });
//           if (receiver?.fcmToken) {
//             const actionUrls: Record<Role, string> = {
//               [Role.CUSTOMER]: `/broker-chat/${senderId}`,
//               [Role.BROKER]: `/broker-dashboard/messages/${senderId}`,
//               [Role.BROKER_FIRM]: `/firm-dashboard/messages/${senderId}`,
//               [Role.ADMIN]: `/admin-dashboard/messages/${senderId}`,
//               SUPER_ADMIN: '/messages',
//             };

//             const payload: Notification = {
//               title: `Your bid rejected by seller ${rejectedBid?.customer?.fullName} for bid id #${rejectedBid?.id}, property #${rejectedBid?.property?.id}`,
//               type: NotificationType.SYSTEM,
//               data: JSON.stringify({}),
//               actionUrl: actionUrls[receiver?.role ?? Role.ADMIN],
//               userId: receiverId,
//               fcmToken: receiver?.fcmToken,
//               read: false,
//             } as any;

//             await this.notificationService.sendNotification(
//               receiver.fcmToken,
//               payload,
//               receiverId,
//             );
//           }
//         } catch (notifError) {
//           console.error('Notification failed:', notifError);
//         }
//       }
//     } catch (error) {
//       socket.emit('bid-rejection-error', {
//         message: error.message || 'Failed to reject broker bid',
//         status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
//       });
//     }
//   }

//   @SubscribeMessage('joinRoom')
//   async handleJoinRoom(
//     @MessageBody() payload: { roomId: string },
//     @ConnectedSocket() socket: Socket,
//   ) {
//     const userId = socket.data.userId as string;
//     const { roomId } = payload;
//     if (!userId || !roomId) return;

//     const room = await this.prisma.room.findUnique({ where: { id: roomId } });

//     if (!room) {
//       socket.emit('error', { message: 'Room not found' });
//       return;
//     }

//     try {
//       const isUserAlreadyExistsInRoom = await this.prisma.roomUser.findFirst({
//         where: { userId, roomId },
//       });

//       socket.join(roomId);

//       if (isUserAlreadyExistsInRoom) {
//         await this.prisma.roomUser.create({
//           data: { userId, roomId },
//         });

//         socket.emit('alreadyInRoom', {
//           roomId,
//           message: 'You are already in this room',
//         });
//       } else {
//         socket.emit('joinedRoom', {
//           roomId,
//           message: 'Successfully joined the room',
//         });
//       }
//     } catch (error: any) {
//       console.error(error);
//       socket.emit('error', { message: 'Failed to join the room' });
//     }
//   }

//   @SubscribeMessage('leaveRoom')
//   async handleLeaveRoom(
//     @MessageBody() payload: { roomId: string },
//     @ConnectedSocket() socket: Socket,
//   ) {
//     const userId = socket.data.userId as string;
//     const { roomId } = payload;
//     if (!userId || !roomId) return;

//     const room = await this.prisma.room.findUnique({ where: { id: roomId } });
//     if (!room) {
//       socket.emit('error', { message: 'Room not found' });
//       return;
//     }

//     await this.prisma.roomUser.deleteMany({ where: { userId, roomId } });
//     socket.leave(roomId);
//     socket.emit('leftRoom', { roomId, message: 'Successfully left the room' });
//     console.log(`User ${userId} left room ${roomId}`);
//   }

//   @SubscribeMessage('message')
//   async handleMessage(
//     @MessageBody()
//     payload: { roomId: string; message: string; images?: string[] },
//     @ConnectedSocket() socket: Socket,
//   ) {
//     const userId = socket.data.userId as string;
//     const { roomId, message } = payload;
//     if (!userId || !roomId || !message) return;

//     const room = await this.prisma.room.findUnique({ where: { id: roomId } });
//     if (!room) return;

//     const chat = await this.prisma.chat.create({
//       data: {
//         senderId: userId,
//         roomId,
//         message,
//       },
//     });

//     const participants = await this.prisma.roomUser.findMany({
//       where: { roomId },
//       select: { userId: true },
//     });

//     participants.forEach(({ userId: participantId }) => {
//       const participantSocket = this.userSockets.get(participantId);
//       if (participantSocket) {
//         participantSocket.emit('message', chat);
//       }
//     });

//     socket.emit('message', chat);
//   }

//   @SubscribeMessage('fetchChats')
//   async handleFetchChats(
//     @MessageBody() payload: { roomId: string },
//     @ConnectedSocket() socket: Socket,
//   ) {
//     const userId = socket.data.userId as string;
//     const { roomId } = payload;
//     if (!userId || !roomId) return;

//     const room = await this.prisma.room.findUnique({ where: { id: roomId } });
//     if (!room) {
//       socket.emit('noRoomFound');
//       return;
//     }

//     const chats = await this.prisma.chat.findMany({
//       where: { roomId },
//       orderBy: { createdAt: 'asc' },
//       include: {
//         sender: { select: { id: true, username: true, avatar: true } },
//       },
//     });

//     await this.prisma.chat.updateMany({
//       where: { roomId },
//       data: { isRead: true },
//     });

//     socket.emit('fetchChats', chats);
//   }

//   @SubscribeMessage('messageList')
//   async handleMessageList(@ConnectedSocket() socket: Socket) {
//     const userId = socket.data.userId as string;
//     if (!userId) return;

//     try {
//       const rooms = await this.prisma.roomUser.findMany({
//         where: { userId },
//         include: {
//           room: {
//             include: { chats: { orderBy: { createdAt: 'desc' }, take: 1 } },
//           },
//         },
//       });

//       const result = rooms
//         .map(({ room }) => ({
//           roomId: room.id,
//           groupImage: room.img,
//           groupName: room.name,
//           groupDescription: room.description,
//           lastMessage: room.chats[0] || null,
//         }))
//         .sort((a, b) => {
//           if (!a.lastMessage || !b.lastMessage) return 0;
//           return (
//             new Date(b.lastMessage.createdAt).getTime() -
//             new Date(a.lastMessage.createdAt).getTime()
//           );
//         });

//       socket.emit('messageList', result);
//     } catch (error) {
//       console.error('Failed to fetch message list', error);
//       socket.emit('error', {
//         message: 'Failed to fetch users with last messages',
//       });
//     }
//   }
// }
