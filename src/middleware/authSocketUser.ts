import { Socket } from 'socket.io';
import User from '../models/User';
import ChannelUser from '../models/ChannelUser';
import GameUser from '../models/GameUser';
import GameManager from '../classes/GameManager';
import { decodeToken } from '../utils/decodeToken';

class CustomError extends Error {
  gameId: string;

  constructor(gameId: string) {
    super();
    this.gameId = gameId;
  }
}

export const authSocketUser = async (
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> => {
  try {
    const { token, channelId } = socket.handshake.auth;
    if (!token || !channelId) throw new Error();

    const decoded = decodeToken(token);
    const { userId } = decoded;
    if (!userId) throw new Error();

    // プレイ中のゲームがあるかどうかチェック
    const currentGameId = GameManager.isUserPlayingGame(userId);
    if (currentGameId && currentGameId !== channelId) {
      throw new CustomError(currentGameId);
    }

    // DBチェック（ユーザーと、チャンネルかゲームどちらかに参加してること）
    const [userExists, inChannel, inGame] = await Promise.all([
      User.exists({ _id: userId }),
      ChannelUser.exists({ channelId, userId }),
      GameUser.exists({ gameId: channelId, userId }),
    ]);
    if (!userExists || !inChannel || !inGame) throw new Error();

    (socket as any).userId = userId;
    (socket as any).channelId = channelId;
    next();
  } catch (error: any) {
    socket.emit('authError', error.gameId || null);
    socket.disconnect();
  }
};
