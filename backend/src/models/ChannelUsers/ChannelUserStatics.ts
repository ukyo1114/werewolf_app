import { Types } from 'mongoose';
import { IChannelUser, IChannelUserStatics } from './ChannelUserTypes';

// ChannelUser静的メソッド
export const ChannelUserStatics = {
  // チャンネルのユーザー一覧を取得
  async getChannelUsers(
    this: IChannelUserStatics,
    channelId: string,
  ): Promise<
    {
      _id: Types.ObjectId;
      userName: string;
      pic: string | null;
      isGuest: boolean;
    }[]
  > {
    const users = await this.find({ channelId })
      .select('-_id userId')
      .populate('userId', '_id userName pic isGuest')
      .lean();

    return users.map((user: any) => ({
      _id: user.userId._id,
      userName: user.userId.userName,
      pic: user.userId.pic || null,
      isGuest: user.userId.isGuest,
    }));
  },

  // ユーザーがチャンネルにいるかどうかを確認
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
    const channels = await this.find({ userId })
      .select('-_id channelId')
      .lean();
    return channels.map((channel: { channelId: Types.ObjectId }) =>
      channel.channelId.toString(),
    );
  },
};
