import { PrismaService } from '@/helper/prisma.service';
import { NotificationService } from '@/modules/notification/notification.service';
import { UserService } from '@/modules/user/user.service';
import { PrismaHelperService } from '@/utils/is_existance';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WebsocketGateway } from './socket.io.service';
import { BcryptService } from '@/utils/bcrypt.service';
import { RoomService } from '@/modules/room/room.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [
    WebsocketGateway,
    PrismaService,
    BcryptService,
    PrismaHelperService,
    UserService,
    NotificationService,
    RoomService,
  ],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
