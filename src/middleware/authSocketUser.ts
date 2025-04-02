import { Socket } from 'socket.io';
import User from '../models/userModel';
import ChannelUser from '../models/channelUserModel';
import GameUser from '../models/gameUserModel';
import { isUserPlayingGame } from '../utils/gameUtils';
import { decodeToken } from '../utils/decodeToken';

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
    const currentGameId = isUserPlayingGame(userId);
    if (currentGameId && currentGameId !== channelId) {
      return errorHandler(socket, currentGameId);
    }

    // DBチェック（ユーザーと、チャンネルかゲームどちらかに参加してること）
    const isValid = await validateUserInChannelOrGame(userId, channelId);
    if (!isValid) return errorHandler(socket);

    (socket as any).userId = userId;
    (socket as any).channelId = channelId;
    next();
  } catch (error) {
    errorHandler(socket);
  }
};

const validateUserInChannelOrGame = async (
  userId: string,
  channelId: string,
): Promise<boolean> => {
  const [userExists, inChannel, inGame] = await Promise.all([
    User.exists({ _id: userId }),
    ChannelUser.exists({ channelId, userId }),
    GameUser.exists({ gameId: channelId, userId }),
  ]);
  return Boolean(userExists && (inChannel || inGame));
};

const errorHandler = (socket: Socket, gameId?: string): void => {
  socket.emit('authError', gameId);
  socket.disconnect();
};
