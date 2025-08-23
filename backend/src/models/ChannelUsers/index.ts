import mongoose from 'mongoose';
import { ChannelUserSchema } from './ChannelUserSchema';
import { ChannelUserStatics } from './ChannelUserStatics';
import { IChannelUser, IChannelUserStatics } from './ChannelUserTypes';

// スキーマにスタティックメソッドを追加
Object.assign(ChannelUserSchema.statics, ChannelUserStatics);

const ChannelUsers = mongoose.model<IChannelUser, IChannelUserStatics>(
  'ChannelUsers',
  ChannelUserSchema,
);

export default ChannelUsers;
export { IChannelUser, IChannelUserStatics };
