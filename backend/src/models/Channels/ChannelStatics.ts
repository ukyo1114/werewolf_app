import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';
import {
  IChannel,
  IUpdateChannelSetingsData,
  IChannelStatics,
} from './ChannelTypes';
import { ClientSession } from 'mongoose';

export const ChannelStatics = {
  async findActiveChannelById(
    this: IChannelStatics,
    channelId: string,
  ): Promise<IChannel> {
    const channel = await this.findById(channelId);
    if (!channel || channel.deletedAt)
      throw new AppError(404, errors.CHANNEL_NOT_FOUND);
    return channel;
  },

  async getChannelAsAdmin(
    this: IChannelStatics,
    channelId: string,
    userId: string,
  ): Promise<IChannel> {
    const channel = await this.findActiveChannelById(channelId);
    if (channel.channelAdmin.toString() !== userId)
      throw new AppError(403, errors.PERMISSION_DENIED);
    return channel;
  },

  async isChannelAdmin(
    this: IChannelStatics,
    channelId: string,
    userId: string,
  ): Promise<boolean> {
    const channel = await this.findActiveChannelById(channelId);
    return channel.channelAdmin.toString() === userId;
  },

  async checkChannelAdmin(
    this: IChannelStatics,
    channelId: string,
    userId: string,
  ): Promise<void> {
    const isAdmin = await this.isChannelAdmin(channelId, userId);
    if (!isAdmin) throw new AppError(403, errors.PERMISSION_DENIED);
  },

  async getChannelList(this: IChannelStatics): Promise<IChannel[]> {
    return this.find({ deletedAt: { $exists: false } })
      .select('-password')
      .populate('channelAdmin', '_id userName pic')
      .lean();
  },

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
    session?: ClientSession,
  ): Promise<void> {
    const channel = await this.getChannelAsAdmin(channelId, userId);
    channel.deletedAt = new Date();
    await channel.save({ session });
  },
};
