import { IGame, IGameStatics } from './GameTypes';

export const GameStatics = {
  async getRunningGame(
    this: IGameStatics,
    channelId: string,
  ): Promise<IGame[]> {
    return this.find({ channelId, result: 'running' });
  },

  async endGame(
    this: IGameStatics,
    gameId: string,
    result: IGame['result'],
  ): Promise<void> {
    await this.findByIdAndUpdate(gameId, { result });
  },
};
