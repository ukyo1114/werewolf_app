import Channel from '../models/channelModel';
import Game from '../models/gameModel';
import ChannelManager from './ChannelManager';
import { games } from './GameInstanceManager';
import AppError from '../utils/AppError';
import { errors } from '../config/messages';

export const channels: { [key: string]: ChannelManager } = {};

export const createChannelInstance = async (channelId: string) => {
  const [isChannel, isGame] = await Promise.all([
    Channel.exists({ _id: channelId }),
    Game.exists({ _id: channelId }),
  ]);

  if (isChannel) {
    channels[channelId] = new ChannelManager(channelId);
    return channels[channelId];
  } else if (isGame) {
    const game = games[channelId];

    if (game) {
      channels[channelId] = new ChannelManager(channelId, game);
      return channels[channelId];
    } else {
      throw new AppError(404, errors.GAME_NOT_FOUND);
    }
  } else {
    throw new AppError(404, errors.CHANNEL_NOT_FOUND);
  }
};
