import { Types } from 'mongoose';
import { IBlockedUserStatics } from './BlockedUserTypes';

export const BlockedUserStatics = {
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
      .select('userId')
      .populate('userId', '_id userName pic isGuest')
      .lean();

    return blockedUsers.map((user: any) => user.userId);
  },

  async isUserBlocked(
    this: IBlockedUserStatics,
    channelId: string,
    userId: string,
  ): Promise<boolean> {
    const blockedUser = await this.findOne({ channelId, userId });
    return !!blockedUser;
  },

  async unblockUser(
    this: IBlockedUserStatics,
    channelId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.deleteOne({ channelId, userId });
    return result.deletedCount > 0;
  },

  async getBlockedChannels(
    this: IBlockedUserStatics,
    userId: string,
  ): Promise<string[]> {
    const channels = await this.find({ userId }).select('channelId').lean();
    return channels.map((channel: any) => channel.channelId.toString());
  },
};
