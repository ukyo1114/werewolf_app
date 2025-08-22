import { Types } from 'mongoose';
import { IGameUser, IGameUserStatics } from './GameUserTypes';

// GameUser静的メソッド
export const GameUserStatics = {
  // ゲームに参加
  async joinGame(
    this: IGameUserStatics,
    gameId: string,
    userId: string,
  ): Promise<void> {
    const gameUser = await this.findOne({ gameId, userId });
    if (!gameUser) {
      await this.create({ gameId, userId });
    }
  },

  // ゲームのユーザー一覧を取得
  async getGameUsers(
    this: IGameUserStatics,
    gameId: string,
  ): Promise<
    {
      _id: Types.ObjectId;
      userName: string;
      pic: string | null;
      isGuest: boolean;
    }[]
  > {
    const users = await this.find({ gameId })
      .select('-_id userId')
      .populate('userId', '_id userName pic isGuest')
      .lean();

    return users.map((user: any) => ({
      _id: user.userId._id,
      userName: user.userId.userName,
      pic: user.userId.pic || null,
      isGuest: user.userId.isGuest,
    }));
  },

  // ユーザーがプレイ中かどうかを確認
  async isUserPlaying(
    this: IGameUserStatics,
    userId: string,
  ): Promise<string | null> {
    const gameUser = await this.findOne({ userId, isPlaying: true });
    return gameUser?.gameId.toString() || null;
  },

  // ゲームを終了
  async endGame(this: IGameUserStatics, gameId: string): Promise<void> {
    await this.updateMany({ gameId }, { $set: { isPlaying: false } });
  },
};
