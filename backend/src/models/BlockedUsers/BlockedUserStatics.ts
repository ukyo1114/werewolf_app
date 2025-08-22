import { Types } from 'mongoose';
import { errors } from '../../config/messages';
import { IBlockedUserStatics } from './BlockedUserTypes';

// ChannelBlockUser静的メソッド
export const BlockedUserStatics = {
  // チャンネルのブロックユーザー一覧を取得
  async getBlockedUsers(
    this: IBlockedUserStatics,
    channelId: string,
  ): Promise<
    {
      _id: Types.ObjectId;
      userName: string;
      pic: string | null;
      isGuest: boolean;
    }[]
  > {
    const blockedUsers = await this.find({ channelId })
      .select('-_id userId')
      .populate('userId', '_id userName pic isGuest')
      .lean();

    return blockedUsers.map((user: any) => ({
      _id: user.userId._id,
      userName: user.userId.userName,
      pic: user.userId.pic || null,
      isGuest: user.userId.isGuest,
    }));
  },

  // ユーザーがブロックされているかどうかを確認
  async isUserBlocked(
    this: IBlockedUserStatics,
    channelId: string,
    userId: string,
  ): Promise<boolean> {
    const blockedUser = await this.findOne({ channelId, userId });
    return !!blockedUser;
  },

  // ユーザーをブロック
  async addBlockUser(
    this: IBlockedUserStatics,
    channelId: string,
    userId: string,
  ): Promise<void> {
    try {
      await this.create({ channelId, userId });
    } catch (error: any) {
      if (error.code === 11000) throw new Error(errors.USER_ALREADY_BLOCKED);
      throw error;
    }
  },

  // ユーザーのブロックを解除
  async unblockUser(
    this: IBlockedUserStatics,
    channelId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.deleteOne({ channelId, userId });
    return result.deletedCount > 0;
  },

  // ユーザーがブロックされているチャンネル一覧を取得
  async getBlockedChannels(
    this: IBlockedUserStatics,
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
