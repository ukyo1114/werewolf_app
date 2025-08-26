import mongoose, { Document, Types } from 'mongoose';
import { MessageType } from '../../config/types';

export interface IMessagesIndex {
  _id: Types.ObjectId;
  createdAt: Date;
  replyTo?: Types.ObjectId;
}

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
  getMessages(params: {
    channelId: string;
    messageId?: string;
    limit?: number;
    messageType?: MessageType[];
  }): Promise<IMessage[]>;
  getIndex(channelId: string): Promise<IMessagesIndex[]>;
}
