import { Document, Types, Model } from 'mongoose';
import { GameResult } from '@/config/types';

// Gameドキュメントのインターフェース
export interface IGame extends Document {
  _id: Types.ObjectId;
  channelId: Types.ObjectId;
  result: GameResult;
  numberOfPlayers: number;
  createdAt: Date;
}

export interface IGameInfo {
  channelId: string;
  channelName: string;
  channelDescription: string;
}

// Gameモデルの静的メソッドのインターフェース
export interface IGameStatics extends Model<IGame> {
  getGameInfo(gameId: string): Promise<IGameInfo>;
  getRunningGame(channelId: string): Promise<IGame[]>;
  endGame(gameId: string, result: IGame['result']): Promise<void>;
}
