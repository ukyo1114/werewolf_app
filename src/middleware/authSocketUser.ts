import { Socket } from 'socket.io';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { decodeToken } from '../utils/decodeToken';
import User from '../models/userModel';
import Game from '../models/gameModel';
import GameUser from '../models/gameUserModel';
import { isUserPlayingGame } from '../classes/GameInstanceManager';
import ChannelUser from '../models/channelUserModel';

export const authSocketUser = async (
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> => {
  const { token, channelId } = socket.handshake.auth;
  if (!token || !channelId) return errorHandler(socket);

  try {
    const decoded = decodeToken(token);
    const { userId } = decoded;
    if (!userId) return errorHandler(socket);

    // プレイ中のゲームがあるかどうかチェック
    const gameId = isUserPlayingGame(userId);
    if (gameId && gameId !== channelId) return errorHandler(socket, gameId);

    // ユーザーが存在しないかチャンネルまたはゲームに参加していないとエラー
    const [userExists, channelUserExists, gameUserExists] = await Promise.all([
      User.exists({ _id: userId }),
      ChannelUser.exists({ channelId, userId }),
      GameUser.exists({ gameId: channelId, userId }),
    ]);
    if (!userExists || !(channelUserExists || gameUserExists)) {
      return errorHandler(socket);
    }

    (socket as any).userId = userId;
    (socket as any).channelId = channelId;
    next();
  } catch (error) {
    errorHandler(socket);
  }
};

function errorHandler(socket: Socket, gameId?: string) {
  socket.emit('authError', gameId);
  socket.disconnect();
}
