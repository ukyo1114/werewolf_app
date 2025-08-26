import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';
import { MessageType } from '../../config/types';
import { IMessagesIndex, IMessage, IMessageStatics } from './MessageTypes';

export const MessageStatics = {
  // チャンネルのメッセージ一覧を取得
  async getMessages(
    this: IMessageStatics,
    {
      channelId,
      messageId,
      limit = 50,
      messageType = null,
    }: {
      channelId: string;
      messageId?: string;
      limit?: number;
      messageType: MessageType[] | null;
    },
  ): Promise<IMessage[]> {
    const query: any = { channelId };

    if (messageType) query.messageType = { $in: messageType };

    if (messageId) {
      const message = await this.findById(messageId).select('createdAt').lean();
      if (!message) throw new AppError(404, errors.MESSAGE_NOT_FOUND);
      query._id = { $ne: messageId };
      query.createdAt = { $lt: message.createdAt };
    }

    return this.find(query).sort({ createdAt: -1 }).limit(limit).lean();
  },

  async getIndex(
    this: IMessageStatics,
    channelId: string,
  ): Promise<IMessagesIndex[]> {
    const messages = await this.find({ channelId })
      .limit(5000)
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
