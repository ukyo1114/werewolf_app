import { IGameUser, IGameUserStatics } from './GameUserTypes';
import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';

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
  ): Promise<IGameUser[]> {
    const users = await this.find({ gameId })
      .select('-_id userId userName pic')
      .lean();

    return users;
  },

  async getGamePlayers(
    this: IGameUserStatics,
    gameId: string,
  ): Promise<IGameUser[]> {
    const users = await this.find({ gameId, role: { $nin: ['spectator'] } })
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

  async checkUserPlaying(
    this: IGameUserStatics,
    userId: string,
  ): Promise<void> {
    const gameUser = await this.findOne({ userId, isPlaying: true });
    if (gameUser) throw new AppError(403, errors.DENIED_DELETE_PLAYING_USER);
  },

  async endGame(this: IGameUserStatics, gameId: string): Promise<void> {
    await this.updateMany({ gameId }, { $set: { isPlaying: false } });
  },

  async leaveGame(
    this: IGameUserStatics,
    gameId: string,
    userId: string,
  ): Promise<void> {
    try {
      await this.updateOne({ gameId, userId }, { $set: { isPlaying: false } });
    } catch (error) {
      console.error(
        `Failed to leave game ${gameId} for user ${userId}:`,
        error,
      );
    }
  },
};
