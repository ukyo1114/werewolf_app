import EventEmitter from 'events';
import { MessageType } from '../models/messageModel';

export interface IChannelUser {
  userId: string;
  socketId: string;
  status: MessageType;
}

export default class ChannelUserManager {
  public userId: string;
  public socketId: string;
  public status: MessageType;
  public eventEmitter: EventEmitter;

  constructor(user: IChannelUser) {
    this.userId = user.userId;
    this.socketId = user.socketId;
    this.status = user.status;
    this.eventEmitter = new EventEmitter();
    this.registerListners();
  }

  registerListners() {
    this.eventEmitter.on('kill', () => {
      this.status = 'spectator';
    });
  }
}
