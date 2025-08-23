import mongoose, { Document, Types } from 'mongoose';

export interface IChannelUser extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
}

export interface IChannelUserStatics extends mongoose.Model<IChannelUser> {
  getChannelUsers(channelId: string): Promise<
    {
      _id: Types.ObjectId;
      userName: string;
      pic: string | null;
      isGuest: boolean;
    }[]
  >;
  isUserInChannel(channelId: string, userId: string): Promise<boolean>;
  leaveChannel(channelId: string, userId: string): Promise<boolean>;
  getParticipantingChannels(userId: string): Promise<string[]>;
}
