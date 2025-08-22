import { errors } from '../../config/messages';
import {
  IChannel,
  IUpdateChannelSetingsData,
  IChannelStatics,
} from './ChannelTypes';

export const ChannelStatics = {
  async getChannelAsAdmin(
    this: IChannelStatics,
    channelId: string,
    userId: string,
  ): Promise<IChannel> {
    const channel = await this.findById(channelId);
    if (!channel || channel.deletedAt)
      throw new Error(errors.CHANNEL_NOT_FOUND);
    if (channel.channelAdmin.toString() !== userId)
      throw new Error(errors.PERMISSION_DENIED);
    return channel;
  },

  async isChannelAdmin(
    this: IChannelStatics,
    channelId: string,
    userId: string,
  ): Promise<boolean> {
    const channel = await this.findById(channelId);
    if (!channel || channel.deletedAt)
      throw new Error(errors.CHANNEL_NOT_FOUND);
    return channel.channelAdmin.toString() === userId;
  },

  // チャンネル一覧を取得
  async getChannelList(this: IChannelStatics): Promise<IChannel[]> {
    return this.find({ deletedAt: { $exists: false } })
      .select('-password')
      .populate('channelAdmin', '_id userName pic')
      .lean();
  },

  // チャンネル設定を更新
  async updateChannelSettings(
    this: IChannelStatics,
    userId: string,
    channelId: string,
    data: IUpdateChannelSetingsData,
  ): Promise<{
    channelName: string;
    channelDescription: string;
    numberOfPlayers: number;
  }> {
    const channel = await this.getChannelAsAdmin(channelId, userId);
    await channel.update(data);

    return {
      channelName: channel.channelName,
      channelDescription: channel.channelDescription,
      numberOfPlayers: channel.numberOfPlayers,
    };
  },

  async deleteChannel(
    this: IChannelStatics,
    channelId: string,
    userId: string,
  ): Promise<void> {
    const channel = await this.getChannelAsAdmin(channelId, userId);
    await channel.softDelete();
  },
};
