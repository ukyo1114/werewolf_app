import mongoose, { Document, Types } from 'mongoose';
import { Role } from '../../config/types';

export interface IGameUser extends Document {
  _id: Types.ObjectId;
  gameId: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  pic?: string;
  role: Role;
  isPlaying: boolean;
  createdAt: Date;
}

export interface IGameUserStatics extends mongoose.Model<IGameUser> {
  joinGame(gameId: string, userId: string): Promise<void>;
  getGameUsers(gameId: string): Promise<IGameUser[]>;
  getGamePlayers(gameId: string): Promise<IGameUser[]>;
  isUserPlaying(userId: string): Promise<string | null>;
  checkUserPlaying(userId: string): Promise<void>;
  endGame(gameId: string): Promise<void>;
  leaveGame(gameId: string, userId: string): Promise<void>;
}

export type { Role };
