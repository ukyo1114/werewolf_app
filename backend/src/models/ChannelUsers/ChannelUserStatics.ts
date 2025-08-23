import { Types } from 'mongoose';
import { IChannelUser, IChannelUserStatics } from './ChannelUserTypes';

export const ChannelUserStatics = {
  async getChannelUsers(
    this: IChannelUserStatics,
    channelId: string,
  ): Promise<
    {
      _id: Types.ObjectId;
      userName: string;
      pic?: string;
      isGuest: boolean;
    }[]
  > {
    const users = await this.find({ channelId })
      .select('userId')
      .populate('userId', '_id userName pic isGuest')
      .lean();

    return users.map((user: any) => user.userId);
  },

  async isUserInChannel(
    this: IChannelUserStatics,
    channelId: string,
    userId: string,
  ): Promise<boolean> {
    const channelUser = await this.findOne({ channelId, userId });
    return !!channelUser;
  },

  // ユーザーをチャンネルから削除
  async leaveChannel(
    this: IChannelUserStatics,
    channelId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.deleteOne({ channelId, userId });
    return result.deletedCount > 0;
  },

  // ユーザーが参加しているチャンネル一覧を取得
  async getParticipantingChannels(
    this: IChannelUserStatics,
    userId: string,
  ): Promise<string[]> {
    const channels = await this.find({ userId }).select('channelId').lean();
    return channels.map((channel: any) => channel.channelId.toString());
  },
};
