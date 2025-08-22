import { IGame, IGameStatics } from './GameTypes';

// Game静的メソッド
export const GameStatics = {
  // 進行中のゲームを取得する静的メソッド
  async getRunningGame(
    this: IGameStatics,
    channelId: string,
  ): Promise<IGame[]> {
    return this.find({ channelId, result: 'running' });
  },

  // ゲームを終了する静的メソッド
  async endGame(
    this: IGameStatics,
    gameId: string,
    result: IGame['result'],
  ): Promise<void> {
    await this.findByIdAndUpdate(gameId, { result });
  },
};
