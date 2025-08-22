import { Document, Types, Model } from 'mongoose';

type GameResult =
  | 'running'
  | 'villagersWin'
  | 'werewolvesWin'
  | 'foxesWin'
  | 'villageAbandoned';

// Gameドキュメントのインターフェース
export interface IGame extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  result: GameResult;
  numberOfPlayers: number;
  createdAt: Date;
  updatedAt: Date;
  endGame(result: Exclude<IGame['result'], 'running'>): Promise<IGame>;
}

// Gameモデルの静的メソッドのインターフェース
export interface IGameStatics extends Model<IGame> {
  getRunningGame(channelId: string): Promise<IGame[]>;
  endGame(gameId: string, result: IGame['result']): Promise<void>;
}
