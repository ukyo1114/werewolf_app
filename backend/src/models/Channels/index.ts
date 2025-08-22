import mongoose from 'mongoose';
import { ChannelSchema } from './ChannelSchema';
import { ChannelMethods } from './ChannelMethods';
import { ChannelStatics } from './ChannelStatics';
import { ChannelMiddleware } from './ChannelMiddleware';
import { IChannel, IChannelStatics } from './ChannelTypes';

// スキーマにメソッドとスタティックメソッドを追加
Object.assign(ChannelSchema.methods, ChannelMethods);
Object.assign(ChannelSchema.statics, ChannelStatics);

// ミドルウェアを適用
ChannelSchema.pre<IChannel>('save', ChannelMiddleware.hashPassword);

// モデルを作成してエクスポート
const Channels = mongoose.model<IChannel, IChannelStatics>(
  'Channels', // コレクション名を複数形に変更
  ChannelSchema,
);

export default Channels;
export { IChannel, IChannelStatics };
