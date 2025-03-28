import Channel from '../models/channelModel';
import Game from '../models/gameModel';
import ChannelManager from './ChannelManager';
import AppError from '../utils/AppError';
import { errors } from '../config/messages';
import { appState } from '../app';

const { channelManagers, gameManagers } = appState;

export const createChannelInstance = async (channelId: string) => {
  const [isChannel, isGame] = await Promise.all([
    Channel.exists({ _id: channelId }),
    Game.exists({ _id: channelId }),
  ]);

  if (isChannel) {
    channelManagers[channelId] = new ChannelManager(channelId);
    return channelManagers[channelId];
  } else if (isGame) {
    const game = gameManagers[channelId];

    if (game) {
      channelManagers[channelId] = new ChannelManager(channelId, game);
      return channelManagers[channelId];
    } else {
      throw new AppError(404, errors.GAME_NOT_FOUND);
    }
  } else {
    throw new AppError(404, errors.CHANNEL_NOT_FOUND);
  }
};
