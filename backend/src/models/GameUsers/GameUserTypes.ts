import mongoose, { Document, Types } from 'mongoose';

type Role =
  | 'villager'
  | 'seer'
  | 'medium'
  | 'hunter'
  | 'freemason'
  | 'werewolf'
  | 'madman'
  | 'fanatic'
  | 'fox'
  | 'immoralist'
  | 'spectator';

export interface IGameUser extends Document {
  _id: Types.ObjectId;
  gameId: Types.ObjectId;
  userId: Types.ObjectId;
  role: Role;
  isPlaying: boolean;
  createdAt: Date;
}

export interface IGameUserStatics extends mongoose.Model<IGameUser> {
  joinGame(gameId: string, userId: string): Promise<void>;
  getGameUsers(gameId: string): Promise<
    {
      _id: Types.ObjectId;
      userName: string;
      pic: string | null;
      isGuest: boolean;
    }[]
  >;
  isUserPlaying(userId: string): Promise<string | null>;
  endGame(gameId: string): Promise<void>;
}
