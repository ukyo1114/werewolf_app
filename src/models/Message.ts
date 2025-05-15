import mongoose, { Schema, Document, Types } from 'mongoose';
import { MessageType } from '../config/types';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  message: string;
  messageType: MessageType;
  createdAt: Date;
}

interface IMessageModel extends mongoose.Model<IMessage> {
  getChannelMessages(
    channelId: string,
    limit?: number,
    before?: Date | null,
  ): Promise<IMessage[]>;
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
MessageSchema.statics.getChannelMessages = async function (
  channelId: string,
  limit: number = 50,
  before: Date | null = null,
): Promise<IMessage[]> {
  const query: any = { channelId };
  if (before) {
    query.createdAt = { $lt: before };
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'userName pic')
    .select('-__v');
};

const Message = mongoose.model<IMessage, IMessageModel>(
  'Message',
  MessageSchema,
);

export default Message;
