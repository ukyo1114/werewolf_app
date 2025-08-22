import mongoose, { Document, Types } from 'mongoose';

// ChannelBlockUserドキュメントのインターフェース
export interface IBlockedUser extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ChannelBlockUserモデルの静的メソッドのインターフェース
export interface IBlockedUserStatics extends mongoose.Model<IBlockedUser> {
  getBlockedUsers(channelId: string): Promise<
    {
      _id: Types.ObjectId;
      userName: string;
      pic: string | null;
      isGuest: boolean;
    }[]
  >;
  isUserBlocked(channelId: string, userId: string): Promise<boolean>;
  addBlockUser(channelId: string, userId: string): Promise<void>;
  unblockUser(channelId: string, userId: string): Promise<boolean>;
  getBlockedChannels(userId: string): Promise<string[]>;
}
