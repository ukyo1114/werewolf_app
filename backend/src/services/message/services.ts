import { appState, Events } from '../../config/appState';
import { IMessageService } from './interfaces';
import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';
import {
  IMessageIndex,
  IMessage,
  MessageType,
} from '../../models/Messages/MessageTypes';
import Messages from '../../models/Messages';

const { channelManagers } = appState;
const { channelEvents } = Events;

export class MessageService implements IMessageService {
  async getIndex(channelId: string, userId: string): Promise<IMessageIndex[]> {
    const receiveMessageType = this.getReceiveMessageType(channelId, userId);
    const index = await Messages.getIndex(channelId, 3000, receiveMessageType);
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
    const channel = channelManagers[channelId];
    if (!channel) throw new AppError(403, errors.CHANNEL_ACCESS_FORBIDDEN);

    const receiveMessageType = channel.getReceiveMessageType(userId);
    return receiveMessageType;
  }

  async sendMessage(
    channelId: string,
    userId: string,
    message: string,
    replyTo?: string,
  ): Promise<void> {
    const channel = channelManagers[channelId];
    if (!channel) throw new AppError(403, errors.CHANNEL_ACCESS_FORBIDDEN);

    const messageType = channel.getSendMessageType(userId);
    const messageReceivers =
      messageType === 'normal' || messageType === 'system'
        ? channelId
        : channel.getMessageReceivers(messageType);

    await Messages.create({ channelId, userId, message, messageType, replyTo });
    const index = await Messages.getIndex(channelId, 10, [messageType]);

    channelEvents.emit('newMessage', messageReceivers, index);
  }
}

export const messageService = new MessageService();
