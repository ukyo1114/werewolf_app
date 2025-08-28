import { appState, Events } from '@/app';
import { IMessageService } from './interfaces';
import AppError from '@/utils/AppError';
import { errors } from '@/config/messages';
import {
  IMessageIndex,
  IMessage,
  MessageType,
} from '@/models/Messages/MessageTypes';
import Messages from '@/models/Messages';

export class MessageService implements IMessageService {
  private readonly channelManagers = appState.channelManagers;

  async getIndex(channelId: string, userId: string): Promise<IMessageIndex[]> {
    const receiveMessageType = this.getReceiveMessageType(channelId, userId);
    const index = await Messages.getIndex(channelId, receiveMessageType);
    return index;
  }

  async getMessages(
    channelId: string,
    userId: string,
    index: string[],
  ): Promise<IMessage[]> {
    const receiveMessageType = this.getReceiveMessageType(channelId, userId);
    const messages = await Messages.getMessages(
      channelId,
      index,
      receiveMessageType,
    );
    return messages;
  }

  private getReceiveMessageType(
    channelId: string,
    userId: string,
  ): MessageType[] | undefined {
    const channel = this.channelManagers[channelId];
    if (!channel) throw new AppError(403, errors.CHANNEL_ACCESS_FORBIDDEN);
    channel.checkCanUserAccessChannel(userId);
    const receiveMessageType = channel.getReceiveMessageType(userId);
    return receiveMessageType;
  }
}
