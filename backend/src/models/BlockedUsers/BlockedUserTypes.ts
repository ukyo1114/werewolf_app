import mongoose, { Document, Types } from 'mongoose';
import { IBlockedUserList } from '../../config/types';

export interface IBlockedUser extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
}

export interface IBlockedUserStatics extends mongoose.Model<IBlockedUser> {
  getBlockedUserList(channelId: string): Promise<IBlockedUserList[]>;
  isUserBlocked(channelId: string, userId: string): Promise<boolean>;
  cancelBlock(channelId: string, userId: string): Promise<void>;
  getBlockedChannels(userId: string): Promise<string[]>;
}

export type { IBlockedUserList };
