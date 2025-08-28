import { IChannelUser, MessageType } from '@/config/types';

export default class ChannelUserManager {
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
}
