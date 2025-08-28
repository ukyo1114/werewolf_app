import { Socket } from 'socket.io';
import Users from '@/models/Users';
import ChannelUsers from '@/models/ChannelUsers';
import GameUsers from '@/models/GameUsers';
import { decodeToken } from '@/utils/decodeToken';
import { socketError } from '@/config/messages';

export const authSocketUser =
  (nameSpace: string) =>
  async (socket: Socket, next: (err?: Error) => void): Promise<void> => {
    try {
      const { token, channelId } = socket.handshake.auth;
      if (!token || !channelId) throw new Error(socketError.AUTH_ERROR);
      const decoded = decodeToken(token);
      const { userId } = decoded;
      if (!userId) throw new Error(socketError.AUTH_ERROR);

      // プレイ中のゲームがあるかどうかチェック
      const currentGameId = await GameUsers.isUserPlaying(userId);
      if (
        currentGameId &&
        (nameSpace === 'entry' || currentGameId !== channelId)
      ) {
        const error = new Error(socketError.AUTH_ERROR);
        (error as any).data = { gameId: currentGameId };
        throw error;
      }

      // DBチェック（namespaceに応じて必要なチェックのみ実行）
      let [userExists, inChannel, inGame] = [false, false, false];
      if (nameSpace === 'entry') {
        [userExists, inChannel] = await Promise.all([
          !!Users.exists({ _id: userId }),
          !!ChannelUsers.exists({ channelId, userId }),
        ]);
      } else if (nameSpace === 'game') {
        [userExists, inGame] = await Promise.all([
          !!Users.exists({ _id: userId }),
          !!GameUsers.exists({ gameId: channelId, userId }),
        ]);
      } else if (nameSpace === 'chat') {
        [userExists, inChannel, inGame] = await Promise.all([
          !!Users.exists({ _id: userId }),
          !!ChannelUsers.exists({ channelId, userId }),
          !!GameUsers.exists({ gameId: channelId, userId }),
        ]);
      }

      if (!userExists) throw new Error(socketError.AUTH_USER_NOT_FOUND);
      if (!inChannel && !inGame) throw new Error(socketError.AUTH_ERROR);

      (socket as any).userId = userId;
      (socket as any).channelId = channelId;
      next();
    } catch (error: any) {
      next(error);
    }
  };
