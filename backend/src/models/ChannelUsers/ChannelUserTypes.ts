import mongoose, { Document, Types } from 'mongoose';
import { IChannelParticipant } from '@/config/types';

export interface IChannelUser extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
}

export interface IChannelUserStatics extends mongoose.Model<IChannelUser> {
  getChannelUsers(channelId: string): Promise<IChannelParticipant[]>;
  isUserInChannel(channelId: string, userId: string): Promise<boolean>;
  checkUserInChannel(channelId: string, userId: string): Promise<void>;
  getParticipantingChannels(userId: string): Promise<string[]>;
}

export type { IChannelParticipant };
