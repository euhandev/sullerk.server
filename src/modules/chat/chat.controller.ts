import { ResponseService } from '@/utils/response';
import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Req } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../roles/roles.decorator';
import { ChatService } from './chat.service';
import { UpdateChatDto } from './dto/update-chat.dto';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async findAll(@Req() req: Request) {
    const result = await this.chatService.findAll(req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Chats retrieved successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async findOne(@Param('id') id: string) {
    const result = await this.chatService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Chat retrieved successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async update(@Param('id') id: string, @Body() updateChatDto: UpdateChatDto) {
    const result = await this.chatService.update(id, updateChatDto);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Chat updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async remove(@Param('id') id: string) {
    const result = await this.chatService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Chat deleted successfully`,
      data: result,
    });
  }
}
