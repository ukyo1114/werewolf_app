import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';
import { IBlockedUserList, IBlockedUserStatics } from './BlockedUserTypes';

export const BlockedUserStatics = {
  async getBlockedUserList(
    this: IBlockedUserStatics,
    channelId: string,
  ): Promise<IBlockedUserList[]> {
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

  async cancelBlock(
    this: IBlockedUserStatics,
    channelId: string,
    userId: string,
  ): Promise<void> {
    const result = await this.deleteOne({ channelId, userId });
    if (result.deletedCount === 0)
      throw new AppError(404, errors.USER_NOT_BLOCKED);
  },

  async getBlockedChannels(
    this: IBlockedUserStatics,
    userId: string,
  ): Promise<string[]> {
    const channels = await this.find({ userId }).select('channelId').lean();
    return channels.map((channel: any) => channel.channelId.toString());
  },
};
