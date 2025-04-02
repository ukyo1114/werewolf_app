import Channel from '../models/channelModel';

export const checkChannelAdmin = async (
  channelId: string,
  userId: string,
): Promise<boolean> => {
  const channel = await Channel.findById(channelId)
    .select('channelAdmin')
    .lean();
  if (!channel) throw new Error();

  return channel.channelAdmin.toString() === userId;
};
