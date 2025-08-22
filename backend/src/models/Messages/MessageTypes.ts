import mongoose, { Document, Types } from 'mongoose';
import { MessageType } from '../../config/types';

// Messageドキュメントのインターフェース
export interface IMessage extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  message: string;
  messageType: MessageType;
  createdAt: Date;
}

// Messageモデルの静的メソッドのインターフェース
export interface IMessageStatics extends mongoose.Model<IMessage> {
  getMessages(params: {
    channelId: string;
    messageId?: string;
    limit?: number;
    messageType?: MessageType[] | null;
  }): Promise<IMessage[]>;
}
