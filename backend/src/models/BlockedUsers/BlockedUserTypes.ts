import mongoose, { Document, Types } from 'mongoose';

// ChannelBlockUserドキュメントのインターフェース
export interface IBlockedUser extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
}

export interface IBlockedUserList {
  _id: Types.ObjectId;
  userName: string;
  pic: string | null;
  isGuest: boolean;
}

// ChannelBlockUserモデルの静的メソッドのインターフェース
export interface IBlockedUserStatics extends mongoose.Model<IBlockedUser> {
  getBlockedUserList(channelId: string): Promise<IBlockedUserList[]>;
  isUserBlocked(channelId: string, userId: string): Promise<boolean>;
  cancelBlock(channelId: string, userId: string): Promise<void>;
  getBlockedChannels(userId: string): Promise<string[]>;
}
