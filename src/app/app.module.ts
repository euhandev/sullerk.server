import { AppEvents } from '@/events/app-events.service';
import { CronJobService } from '@/helper/cron_jobs';
import { FileService } from '@/helper/file.service';
// import { FirebaseModule } from '@/helper/firebase.module';
import { PrismaModule } from '@/helper/prisma.module';
import { AdminModule } from '@/modules/admin/admin.module';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { AuthModule } from '@/modules/auth/auth.module';
import { BlogModule } from '@/modules/blog/blog.module';
import { CustomerModule } from '@/modules/customer/customer.module';
import { FileModule } from '@/modules/file/file.module';
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
    BlogModule,
    FileModule,
    ConfigModule,
    AnalyticsModule,
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
