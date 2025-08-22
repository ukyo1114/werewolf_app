import mongoose from 'mongoose';
import { BlockedUserSchema } from './BlockedUserSchema';
import { BlockedUserStatics } from './BlockedUserStatics';
import { IBlockedUser, IBlockedUserStatics } from './BlockedUserTypes';

// スキーマにスタティックメソッドを追加
Object.assign(BlockedUserSchema.statics, BlockedUserStatics);

// モデルを作成してエクスポート
const BlockedUsers = mongoose.model<IBlockedUser, IBlockedUserStatics>(
  'BlockedUsers', // コレクション名を複数形に変更
  BlockedUserSchema,
);

export default BlockedUsers;
export type { IBlockedUser, IBlockedUserStatics } from './BlockedUserTypes';
