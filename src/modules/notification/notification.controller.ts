import { Controller, Post, Body, Get, Query, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationType } from '@prisma/client';
import { ResponseService } from '@/utils/response';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth('JWT-auth')
@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendNotificationToUser(@Body() body: any, @Req() req: any) {
    const { deviceToken, title, body: msgBody, type, data, targetId, slug } = body;

    if (!deviceToken || !title || !msgBody) {
      return {
        success: false,
        message: 'Device token, title, and body are required!',
      };
    }

    const payload = {
      name: title,
      body: msgBody,
      type: type || NotificationType.SYSTEM,
      data: data?.toString() || '',
      targetId,
      slug,
    };

    await this.notificationService.sendNotification(deviceToken, payload, req.user?.id);

    return { success: true, message: 'Notification sent successfully' };
  }

  @Post('save')
  async saveNotification(@Body() body: any, @Req() req: any) {
    const { title, body: msgBody, type, data } = body;

    await this.notificationService.saveNotification(
      {
        name: title,
        body: msgBody,
        type: type || NotificationType.SYSTEM,
        data: data?.toString(),
      },
      req.user?.id,
    );

    return { success: true, message: 'Notification saved successfully' };
  }

  @Get()
  async getAllNotifications(@Query() query: any) {
    const result = await this.notificationService.getAll(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `all notifications found successfully`,
      meta: result.meta,
      data: result.data,
    });
  }
}
