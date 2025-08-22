import mongoose from 'mongoose';
import { ChannelUserSchema } from './ChannelUserSchema';
import { ChannelUserStatics } from './ChannelUserStatics';
import { IChannelUser, IChannelUserStatics } from './ChannelUserTypes';

// スキーマにスタティックメソッドを追加
Object.assign(ChannelUserSchema.statics, ChannelUserStatics);

// モデルを作成してエクスポート
const ChannelUsers = mongoose.model<IChannelUser, IChannelUserStatics>(
  'ChannelUsers', // コレクション名を複数形に変更
  ChannelUserSchema,
);

export default ChannelUsers;
export { IChannelUser, IChannelUserStatics };
