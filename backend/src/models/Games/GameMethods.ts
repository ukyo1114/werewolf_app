import { IGame } from './GameTypes';

// Gameインスタンスメソッド
export const GameMethods = {
  // ゲームを終了するインスタンスメソッド
  async endGame(
    this: IGame,
    result: Exclude<IGame['result'], 'running'>,
  ): Promise<IGame> {
    this.result = result;
    return await this.save();
  },
};
