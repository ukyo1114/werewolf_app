import mongoose, { Document, Types } from 'mongoose';
import { MessageType, IMessageIndex } from '@/config/types';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  message: string;
  messageType: MessageType;
  replyTo?: Types.ObjectId;
  createdAt: Date;
}

export interface IMessageStatics extends mongoose.Model<IMessage> {
  getMessages(
    channelId: string,
    index: string[],
    messageType?: MessageType[],
  ): Promise<IMessage[]>;
  getIndex(
    channelId: string,
    messageType?: MessageType[],
  ): Promise<IMessageIndex[]>;
}

export type { MessageType, IMessageIndex };
