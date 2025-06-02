import { Namespace, Socket } from 'socket.io';
import { errors } from '../config/messages';
import { appState, Events } from '../app';
import EntryManager from '../classes/EntryManager';
import Channel from '../models/Channel';
import { authSocketUser } from '../middleware/authSocketUser';

const { entryManagers } = appState;
const { entryEvents } = Events;

interface CustomSocket extends Socket {
  userId?: string;
  channelId?: string;
}

export const entryNameSpaceHandler = (entryNameSpace: Namespace) => {
  entryNameSpace.use(authSocketUser('entry'));

  entryNameSpace.on('connection', async (socket: CustomSocket) => {
    const userId = socket.userId as string;
    const channelId = socket.channelId as string;
    const socketId = socket.id;

    try {
      const channel = await Channel.findById(channelId)
        .select('numberOfPlayers')
        .lean();
      if (!channel) throw new Error();

      const entryManager = EntryManager.createEntryManager(
        channelId,
        channel.numberOfPlayers,
      );
      const users = entryManager.getUserList();
      socket.emit('connect_response', users);
    } catch (error) {
      socket.conn.close();
    }

    socket.on('registerEntry', async (callback) => {
      try {
        const entryManager = entryManagers[channelId];
        if (!entryManager) throw new Error();
        await entryManager.register(userId, socketId);
        callback({ success: true });
      } catch (error: any) {
        callback({
          success: false,
          message: error?.message || errors.CHANNEL_ACCESS_FORBIDDEN,
        });
      }
    });

    socket.on('cancelEntry', (callback) => {
      try {
        const entryManager = entryManagers[channelId];
        if (!entryManager) throw new Error();
        entryManager.cancel(socketId);
        callback({ success: true });
      } catch (error: any) {
        callback({
          success: false,
          message: error?.message || errors.CHANNEL_ACCESS_FORBIDDEN,
        });
      }
    });

    socket.on('disconnect', () => {
      entryManagers[channelId]?.cancel(socketId);
    });

    entryEvents.on('entryUpdate', (data) => {
      const { channelId, userList } = data;
      entryNameSpace.to(channelId).emit('entryUpdate', userList);
    });

    entryEvents.on('gameStart', (data) => {
      const { users, gameId } = data;

      users.forEach((socketId: string) => {
        const socket = entryNameSpace.sockets.get(socketId);
        if (socket) {
          socket.emit('gameStart', gameId);
          socket.leave(channelId);
        }
      });
    });

    entryEvents.on('gameCreationFailed', (channelId: string) => {
      entryNameSpace.to(channelId).emit('gameCreationFailed');
    });
  });
};
