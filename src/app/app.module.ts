import { AppEvents } from '@/events/app-events.service';
import { CronJobService } from '@/helper/cron_jobs';
import { FileService } from '@/helper/file.service';
// import { FirebaseModule } from '@/helper/firebase.module';
import { PrismaModule } from '@/helper/prisma.module';
import { AdminModule } from '@/modules/admin/admin.module';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { AuthModule } from '@/modules/auth/auth.module';
import { CustomerModule } from '@/modules/customer/customer.module';
import { FileModule } from '@/modules/file/file.module';
import { ListingModule } from '@/modules/listing/listing.module';
import { RolesGuard } from '@/modules/roles/roles.guard';
import { UserModule } from '@/modules/user/user.module';
import { UserService } from '@/modules/user/user.service';
import { BcryptService } from '@/utils/bcrypt.service';
import { GlobalExceptionFilter } from '@/utils/global_exception';
import { PrismaHelperService } from '@/utils/is_existance';
// import { WebsocketGateway } from '@/ws/socket.io.service';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { ConfigService } from '@/config/config.service';
import { ConfigModule } from '@/config/config.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { CommunityModule } from '@/modules/community/community.module';
import { CommunityMemberModule } from '@/modules/community-member/community-member.module';
import { CommunityPostModule } from '@/modules/community-post/community-post.module';
import { CommunityCommentModule } from '@/modules/community-comment/community-comment.module';
import { CommunityReactionModule } from '@/modules/community-reaction/community-reaction.module';
import { CommunityRepostModule } from '@/modules/community-repost/community-repost.module';
import { CommunityStarredPostModule } from '@/modules/community-starred-post/community-starred-post.module';
import { PostModule } from '@/modules/post/post.module';
import { OrderModule } from '@/modules/order/order.module';
import { PaymentModule } from '@/modules/payment/payment.module';
import { ExchangeModule } from '@/modules/exchange/exchange.module';
import { DisputeModule } from '@/modules/dispute/dispute.module';
import { PriceEngineModule } from '@/modules/price-engine/price-engine.module';
import { NotificationModule } from '@/modules/notification/notification.module';
import { WebsocketModule } from '@/ws/soket.io.module';
import { RoomModule } from '@/modules/room/room.module';
import { ChatModule } from '@/modules/chat/chat.module';
import { FollowModule } from '@/modules/follow/follow.module';
import { BlockModule } from '@/modules/block/block.module';
import { CollectionModule } from '@/modules/collection/collection.module';
import { TransactionModule } from '@/modules/transaction/transaction.module';
import { WithdrawalModule } from '@/modules/withdrawal/withdrawal.module';

@Module({
  imports: [
    PrismaModule,
    EventEmitterModule.forRoot(),
    ConfigModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: 1000,
          limit: 100,
        },
        {
          name: 'medium',
          ttl: 10000,
          limit: 1000,
        },
        {
          name: 'long',
          ttl: 600000,
          limit: 1000,
        },
      ],
    }),
    AuthModule,
    UserModule,
    AdminModule,
    CustomerModule,
    FileModule,
    ConfigModule,
    AnalyticsModule,
    ListingModule,
    PostModule,
    CommunityModule,
    CommunityMemberModule,
    CommunityPostModule,
    CommunityCommentModule,
    CommunityReactionModule,
    CommunityRepostModule,
    CommunityStarredPostModule,
    OrderModule,
    PaymentModule,
    ExchangeModule,
    DisputeModule,
    PriceEngineModule,
    RoomModule,
    ChatModule,
    NotificationModule,
    WebsocketModule,
    FollowModule,
    BlockModule,
    CollectionModule,
    TransactionModule,
    WithdrawalModule,
  ],

  controllers: [AppController],
  providers: [
    UserService,
    BcryptService,
    FileService,
    PrismaHelperService,
    CronJobService,
    AppEvents,
    ConfigService,

    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
