import { Controller, Get, Patch, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

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
