import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString } from 'class-validator';
import { NotificationsService } from './notifications.service';

class PushSubscribeDto {
  @IsString() endpoint: string;
  @IsString() p256dh: string;
  @IsString() auth: string;
}

class PushUnsubscribeDto {
  @IsString() endpoint: string;
}

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('vapid-public-key')
  getVapidPublicKey() {
    return { publicKey: this.notificationsService.getVapidPublicKey() ?? null };
  }

  @Post('subscribe')
  async subscribe(@Request() req: any, @Body() dto: PushSubscribeDto) {
    await this.notificationsService.subscribe(req.user.userId, dto.endpoint, dto.p256dh, dto.auth);
    return { success: true };
  }

  @Delete('subscribe')
  async unsubscribe(@Request() req: any, @Body() dto: PushUnsubscribeDto) {
    await this.notificationsService.unsubscribe(req.user.userId, dto.endpoint);
    return { success: true };
  }

  @Get()
  async findAll(@Request() req: any) {
    const notifications = await this.notificationsService.findByUser(req.user.userId);
    return notifications.map((n) => ({
      id: n._id,
      type: n.type,
      title: n.title,
      body: n.body,
      read: n.read,
      workspaceId: n.workspaceId,
      transactionId: n.transactionId,
      createdAt: (n as any).createdAt,
    }));
  }

  @Patch('read-all')
  async markAllRead(@Request() req: any) {
    await this.notificationsService.markAllRead(req.user.userId);
    return { success: true };
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @Request() req: any) {
    await this.notificationsService.markRead(id, req.user.userId);
    return { success: true };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.notificationsService.remove(id, req.user.userId);
    return { success: true };
  }
}
