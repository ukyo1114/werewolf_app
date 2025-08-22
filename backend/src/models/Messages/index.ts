import mongoose from 'mongoose';
import { MessageSchema } from './MessageSchema';
import { MessageStatics } from './MessageStatics';
import { IMessage, IMessageStatics } from './MessageTypes';

// スキーマにスタティックメソッドを追加
Object.assign(MessageSchema.statics, MessageStatics);

// モデルを作成してエクスポート
const Messages = mongoose.model<IMessage, IMessageStatics>(
  'Messages', // コレクション名を複数形に変更
  MessageSchema,
);

export default Messages;
export type { IMessage, IMessageStatics } from './MessageTypes';
