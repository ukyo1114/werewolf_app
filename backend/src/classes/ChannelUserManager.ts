import { IChannelUser, MessageType } from '../config/types';

export default class ChannelUserManager {
  public userId: string;
  public socketId: string;
  public status: MessageType;

  constructor(user: IChannelUser) {
    this.userId = user.userId;
    this.socketId = user.socketId;
    this.status = user.status;
  }

  kill() {
    this.status = 'spectator';
  }
}
