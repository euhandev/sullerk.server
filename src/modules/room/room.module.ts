import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { FileService } from '@/helper/file.service';

@Module({
  controllers: [RoomController],
  providers: [RoomService, FileService],
})
export class RoomModule {}
