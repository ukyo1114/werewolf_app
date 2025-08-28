import { IMessageIndex, IMessage } from '@/models/Messages/MessageTypes';

export interface IMessageService {
  getIndex(channelId: string, userId: string): Promise<IMessageIndex[]>;
  getMessages(
    channelId: string,
    userId: string,
    index: string[],
  ): Promise<IMessage[]>;
}
