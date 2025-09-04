import _ from 'lodash';

import AppError from '../utils/AppError';
import { errors } from '../config/messages';
import { IChannelUser, MessageType } from '../config/types';

export default class ChannelManager {
  protected ChannelUserManager = class {
    userId: string;
    socketId: string;
    status: MessageType;

    constructor({ userId, socketId, status }: IChannelUser) {
      this.userId = userId;
      this.socketId = socketId;
      this.status = status;
    }

    kill(): void {
      this.status = 'spectator';
    }
  };

  channelId: string;
  users: Record<string, InstanceType<typeof this.ChannelUserManager>>;

  constructor(channelId: string) {
    this.channelId = channelId;
    this.users = {};
  }

  userJoined(userId: string, socketId: string): void {
    const user: IChannelUser = { userId, socketId, status: 'normal' };
    this.users[userId] = new this.ChannelUserManager(user);
  }

  userLeft(userId: string): void {
    delete this.users[userId];
  }

  getSendMessageType(userId: string): MessageType {
    this.checkCanUserAccessChannel(userId);
    return 'normal';
  }

  getMessageReceivers(messageType?: MessageType): string[] {
    return [];
  }

  getReceiveMessageType(userId: string): MessageType[] | undefined {
    this.checkCanUserAccessChannel(userId);
    return;
  }

  checkCanUserAccessChannel(userId: string) {
    if (!this.users[userId])
      throw new AppError(403, errors.CHANNEL_ACCESS_FORBIDDEN);
  }
}
