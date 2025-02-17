import Channel from '../models/channelModel';
import AppError from '../utils/AppError';
import { errors } from '../config/messages';

export const checkChannelAdmin = async (channelId: string, userId: string) => {
  const channel = await Channel.findById(channelId)
    .select('channelAdmin')
    .lean();

  if (!channel) throw new AppError(400, errors.CHANNEL_NOT_FOUND);

  return channel.channelAdmin.toString() === userId;
};
