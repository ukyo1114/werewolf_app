import mongoose, { Schema, Document, Types } from 'mongoose';
import { MessageType } from '../config/types';
import AppError from '../utils/AppError';
import { errors } from '../config/messages';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  message: string;
  messageType: MessageType;
  createdAt: Date;
}

interface IMessageModel extends mongoose.Model<IMessage> {
  getMessages(params: {
    channelId: string;
    messageId?: string;
    limit?: number;
    messageType?: MessageType[] | null;
  }): Promise<IMessage[]>;
}

const MessageSchema = new Schema<IMessage>(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    message: {
      type: String,
      required: true,
      maxlength: 400,
    },
    messageType: {
      type: String,
      required: true,
      enum: ['normal', 'werewolf', 'spectator', 'freemason', 'system'],
      default: 'normal',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

MessageSchema.index({ channelId: 1, createdAt: -1 });

// チャンネルのメッセージ一覧を取得
MessageSchema.statics.getMessages = async function ({
  channelId,
  messageId,
  limit = 50,
  messageType = null,
}: {
  channelId: string;
  messageId?: string;
  limit?: number;
  messageType: MessageType[] | null;
}): Promise<IMessage[]> {
  const query: any = { channelId };
  if (messageType) query.messageType = { $in: messageType };
  if (messageId) {
    const message = await this.findById(messageId).select('createdAt').lean();
    if (!message) throw new AppError(404, errors.MESSAGE_NOT_FOUND);
    query._id = { $ne: messageId };
    query.createdAt = { $lt: message.createdAt };
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-__v')
    .lean();
};

const Message = mongoose.model<IMessage, IMessageModel>(
  'Message',
  MessageSchema,
);

export default Message;
