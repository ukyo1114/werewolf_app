import { IGame, IGameInfo, IGameStatics } from './GameTypes';
import { GameResult } from '@/config/types';
import AppError from '@/utils/AppError';
import { errors } from '@/config/messages';

export const GameStatics = {
  async getGameInfo(this: IGameStatics, gameId: string): Promise<IGameInfo> {
    const game = (await this.findById(gameId)
      .select('channelId')
      .populate('channelId', '_id channelName channelDescription')
      .lean()) as any;
    if (!game) throw new AppError(404, errors.GAME_NOT_FOUND);
    return {
      channelId: game.channelId._id.toString(),
      channelName: game.channelId.channelName,
      channelDescription: game.channelId.channelDescription,
    };
  },

  async getRunningGame(
    this: IGameStatics,
    channelId: string,
  ): Promise<IGame[]> {
    return this.find({ channelId, result: 'running' });
  },

  async endGame(
    this: IGameStatics,
    gameId: string,
    result: GameResult,
  ): Promise<void> {
    await this.findByIdAndUpdate(gameId, { result });
  },
};
