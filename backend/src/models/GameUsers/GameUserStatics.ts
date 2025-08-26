import { Types } from 'mongoose';
import { IGameUserStatics } from './GameUserTypes';

export const GameUserStatics = {
  async joinGame(
    this: IGameUserStatics,
    gameId: string,
    userId: string,
  ): Promise<void> {
    const gameUser = await this.findOne({ gameId, userId });
    if (!gameUser) await this.create({ gameId, userId });
  },

  async getGameUsers(
    this: IGameUserStatics,
    gameId: string,
  ): Promise<
    {
      userId: Types.ObjectId;
      userName: string;
      pic?: string;
    }[]
  > {
    const users = await this.find({ gameId })
      .select('-_id userId userName pic')
      .lean();

    return users;
  },

  async isUserPlaying(
    this: IGameUserStatics,
    userId: string,
  ): Promise<string | null> {
    const gameUser = await this.findOne({ userId, isPlaying: true });
    return gameUser?.gameId.toString() || null;
  },

  async endGame(this: IGameUserStatics, gameId: string): Promise<void> {
    await this.updateMany({ gameId }, { $set: { isPlaying: false } });
  },
};
