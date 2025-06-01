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

export const authSocketUser =
  (nameSpace: string) =>
  async (socket: Socket, next: (err?: Error) => void): Promise<void> => {
    try {
      const { token, channelId } = socket.handshake.auth;
      if (!token || !channelId)
        throw new Error('token or channelId is required');

      const decoded = decodeToken(token);
      const { userId } = decoded;
      if (!userId) throw new Error('userId is required');

      // プレイ中のゲームがあるかどうかチェック
      const currentGameId = await GameUser.isUserPlaying(userId);
      if (currentGameId && currentGameId !== channelId)
        throw new CustomError(currentGameId);

      // DBチェック（namespaceに応じて必要なチェックのみ実行）
      let [userExists, inChannel, inGame] = [false, false, false];
      if (nameSpace === 'entry') {
        [userExists, inChannel] = await Promise.all([
          !!User.exists({ _id: userId }),
          !!ChannelUser.exists({ channelId, userId }),
        ]);
      } else if (nameSpace === 'game') {
        [userExists, inGame] = await Promise.all([
          !!User.exists({ _id: userId }),
          !!GameUser.exists({ gameId: channelId, userId }),
        ]);
      } else if (nameSpace === 'channel') {
        [userExists, inChannel, inGame] = await Promise.all([
          !!User.exists({ _id: userId }),
          !!ChannelUser.exists({ channelId, userId }),
          !!GameUser.exists({ gameId: channelId, userId }),
        ]);
      }

      if (!userExists || !(inChannel || inGame))
        throw new Error('user is not in channel or game');

      (socket as any).userId = userId;
      (socket as any).channelId = channelId;
      next();
    } catch (error: any) {
      next(error);
    }
  };
