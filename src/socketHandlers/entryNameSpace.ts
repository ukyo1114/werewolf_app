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
    const channelId = socket.channelId as string;

    const gameId = userId && isUserPlayingGame(userId);
    socket.emit('connect_response', gameId || null);

    socket.on('joinChannel', async (callback) => {
      socket.join(channelId);

      // インスタンスが存在しない場合作成する
      if (!entryManagers[channelId]) {
        const channel = await Channel.findById(channelId)
          .select('numberOfPlayers')
          .lean();
        if (!channel) return;

        entryManagers[channelId] = new EntryManager(
          channelId,
          channel.numberOfPlayers,
        );
      }

      callback({
        users: entryManagers[channelId].getUserList(),
      });
    });

    socket.on('registerEntry', async (callback) => {
      const { userId, channelId, id } = socket;
      if (!userId || !channelId) return;

      try {
        await entryManagers[channelId]?.register(userId, id);
        callback({ success: true });
      } catch (error) {
        callback({ success: false });
      }
    });

    socket.on('cancelEntry', (callback) => {
      const { channelId, id } = socket;
      if (!channelId) return;

      try {
        entryManagers[channelId]?.cancel(id);
        callback({ success: true });
      } catch (error) {
        callback({ success: false });
      }
    });

    socket.on('disconnect', () => {
      const { channelId, id } = socket;
      if (!channelId) return;

      try {
        entryManagers[channelId]?.cancel(id);
      } catch (error) {}
    });

    entryEvents.on('entryUpdate', (data) => {
      const { channelId, userList } = data;
      entryNameSpace.to(channelId).emit('entryUpdate', userList);
    });

    entryEvents.on('gameStart', (data) => {
      const { users, gameId } = data;

      users.forEach((socketId: string) => {
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
