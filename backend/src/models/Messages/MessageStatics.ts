import {
  IMessageIndex,
  IMessage,
  IMessageStatics,
  MessageType,
} from './MessageTypes';

export const MessageStatics = {
  async getMessages(
    this: IMessageStatics,
    channelId: string,
    index: string[],
    messageType?: MessageType[],
  ): Promise<IMessage[]> {
    const query: any = { channelId };
    query._id = { $in: index };
    if (messageType) query.messageType = { $in: messageType };

    return this.find(query).sort({ createdAt: -1 }).lean();
  },

  async getIndex(
    this: IMessageStatics,
    channelId: string,
    messageType?: MessageType[],
    limit = 3000,
  ): Promise<IMessageIndex[]> {
    const query: any = { channelId };
    if (messageType) query.messageType = { $in: messageType };

    const messages = await this.find(query)
      .limit(limit)
      .select('_id createdAt replyTo')
      .sort({ createdAt: -1 })
      .lean();
    return messages.map((message) => ({
      _id: message._id,
      createdAt: message.createdAt,
      replyTo: message.replyTo || undefined,
    }));
  },
};
