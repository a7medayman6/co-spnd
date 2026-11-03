import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import * as webpush from 'web-push';
import { Notification, NotificationDocument } from './notification.schema';
import { PushSubscription, PushSubscriptionDocument } from './push-subscription.schema';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private pushEnabled = false;

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(PushSubscription.name) private pushSubModel: Model<PushSubscriptionDocument>,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    const subject = this.configService.get<string>('VAPID_SUBJECT') ?? 'mailto:admin@co-spnd.app';
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.pushEnabled = true;
    } else {
      this.logger.warn('VAPID keys not configured — push notifications disabled');
    }
  }

  getVapidPublicKey(): string | undefined {
    return this.configService.get<string>('VAPID_PUBLIC_KEY');
  }

  async subscribe(userId: string, endpoint: string, p256dh: string, auth: string): Promise<void> {
    await this.pushSubModel.findOneAndUpdate(
      { endpoint },
      { userId: new Types.ObjectId(userId), endpoint, p256dh, auth },
      { upsert: true, new: true },
    );
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.pushSubModel.findOneAndDelete({
      userId: new Types.ObjectId(userId),
      endpoint,
    });
  }

  async create(params: {
    userId: string;
    type: string;
    title: string;
    body: string;
    workspaceId?: string;
    transactionId?: string;
  }): Promise<void> {
    await this.notificationModel.create({
      userId: new Types.ObjectId(params.userId),
      type: params.type,
      title: params.title,
      body: params.body,
      ...(params.workspaceId && { workspaceId: new Types.ObjectId(params.workspaceId) }),
      ...(params.transactionId && { transactionId: new Types.ObjectId(params.transactionId) }),
    });

    if (this.pushEnabled) {
      this.sendPush(params).catch(() => {});
    }
  }

  private async sendPush(params: {
    userId: string;
    title: string;
    body: string;
    workspaceId?: string;
    transactionId?: string;
  }): Promise<void> {
    const subscriptions = await this.pushSubModel
      .find({ userId: new Types.ObjectId(params.userId) })
      .exec();

    if (!subscriptions.length) return;

    const url = params.workspaceId
      ? `/workspaces/${params.workspaceId}/transactions`
      : '/workspaces';

    const payload = JSON.stringify({ title: params.title, body: params.body, url });

    const staleEndpoints: string[] = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
        } catch (err: any) {
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            staleEndpoints.push(sub.endpoint);
          }
        }
      }),
    );

    if (staleEndpoints.length) {
      await this.pushSubModel.deleteMany({ endpoint: { $in: staleEndpoints } }).exec();
    }
  }

  async findByUser(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) },
      { read: true },
    );
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { read: true },
    );
  }

  async remove(notificationId: string, userId: string): Promise<void> {
    await this.notificationModel.findOneAndDelete({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    });
  }
}
