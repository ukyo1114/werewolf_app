import { Namespace, Socket } from 'socket.io';
import { authSocketUser } from '../middleware/authSocketUser';
import { isUserPlayingGame } from '../classes/GameInstanceManager';
import { errors } from '../config/messages';
import { appState, Events } from '../app';
import EntryManager from '../classes/EntryManager';
import Channel from '../models/channelModel';
import { handleSocketError } from '../utils/handleSocketError';
import ChannelUser from '../models/channelUserModel';

const { entryManagers } = appState;
const { entryEvents } = Events;

interface CustomSocket extends Socket {
  userId?: string;
  channelId?: string;
}

export const entryNameSpaceHandler = (entryNameSpace: Namespace) => {
  entryNameSpace.use(authSocketUser);

  entryNameSpace.on('connection', (socket: CustomSocket) => {
    const userId = socket.userId;

    const gameId = userId && isUserPlayingGame(userId);
    if (gameId) socket.emit('connect_response', gameId);

    socket.on('joinChannel', async (channelId, callback) => {
      // チャンネルに参加していなければエラーを返す
      if (!(await ChannelUser.exists({ channelId, userId })))
        return handleSocketError(socket, errors.CHANNEL_ACCESS_FORBIDDEN);

      socket.join(channelId);
      socket.channelId = channelId;

      // インスタンスが存在しない場合作成する
      if (!entryManagers[channelId]) {
        const channel = await Channel.findById(channelId)
          .select('numberOfPlayers')
          .lean();
        if (!channel)
          return handleSocketError(socket, errors.CHANNEL_NOT_FOUND);

        entryManagers[channelId] = new EntryManager(
          channelId,
          channel.numberOfPlayers,
        );
      }

      callback({
        users: entryManagers[channelId].getUserList(),
      });
    });

    socket.on('registerEntry', async () => {
      const { userId, channelId, id } = socket;
      if (!userId || !channelId)
        return handleSocketError(socket, errors.CHANNEL_ACCESS_FORBIDDEN);

      await entryManagers[channelId]?.register(userId, id);
    });

    socket.on('cancelEntry', () => {
      const { channelId, id } = socket;
      if (!channelId)
        return handleSocketError(socket, errors.CHANNEL_ACCESS_FORBIDDEN);

      entryManagers[channelId]?.cancel(id);
    });

    socket.on('disconnect', () => {
      const { channelId, id } = socket;
      if (!channelId) return;

      entryManagers[channelId]?.cancel(id);
    });

    entryEvents.on('entryUpdate', (data) => {
      const { channelId, userList } = data;
      entryNameSpace.to(channelId).emit('entryUpdate', userList);
    });

    entryEvents.on('gameStart', (data) => {
      const { socketIds, gameId } = data;

      socketIds.forEach((socketId: string) => {
        entryNameSpace.to(socketId).emit('gameStart', gameId);
      });
    });

    entryEvents.on('gameCreationFailed', (channelId: string) => {
      entryNameSpace.to(channelId).emit('gameCreationFailed', {
        message: errors.GAME_CREATION_FAILED,
      });
    });
  });
};
