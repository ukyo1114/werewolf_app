import AppError from '@/utils/AppError';
import { errors } from '@/config/messages';
import { IChannelUserStatics, IChannelParticipant } from './ChannelUserTypes';

export const ChannelUserStatics = {
  async getChannelUsers(
    this: IChannelUserStatics,
    channelId: string,
  ): Promise<IChannelParticipant[]> {
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

  async checkUserInChannel(
    this: IChannelUserStatics,
    channelId: string,
    userId: string,
  ): Promise<void> {
    if (!(await this.isUserInChannel(channelId, userId)))
      throw new AppError(403, errors.CHANNEL_ACCESS_FORBIDDEN);
  },

  async getParticipantingChannels(
    this: IChannelUserStatics,
    userId: string,
  ): Promise<string[]> {
    const channels = await this.find({ userId }).select('channelId').lean();
    return channels.map((channel: any) => channel.channelId.toString());
  },
};
