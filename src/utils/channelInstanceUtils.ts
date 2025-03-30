import Channel from '../models/channelModel';
import Game from '../models/gameModel';
import ChannelManager from '../classes/ChannelManager';
import AppError from './AppError';
import { errors } from '../config/messages';
import { appState } from '../app';

const { channelManagers, gameManagers } = appState;

export const createChannelInstance = async (
  channelId: string,
): Promise<ChannelManager> => {
  const [isChannel, isGame] = await Promise.all([
    Channel.exists({ _id: channelId }),
    Game.exists({ _id: channelId }),
  ]);

  if (!(isChannel || isGame)) throw new AppError(404, errors.CHANNEL_NOT_FOUND);

  if (isChannel) {
    channelManagers[channelId] = new ChannelManager(channelId);
    return channelManagers[channelId];
  } else {
    const game = gameManagers[channelId];
    if (!game) throw new AppError(404, errors.GAME_NOT_FOUND);

    channelManagers[channelId] = new ChannelManager(channelId, game);
    return channelManagers[channelId];
  }
};
