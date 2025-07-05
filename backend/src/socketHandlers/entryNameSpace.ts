import { Namespace, Socket } from 'socket.io';
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
      const entryManager = await EntryManager.createEntryManager(channelId);
      const users = entryManager.getUserList();
      socket.join(channelId);
      socket.emit('connect_response', { success: true, users });
    } catch (error) {
      socket.emit('connect_response', { success: false });
      socket.disconnect();
    }

    socket.on('registerEntry', async (callback) => {
      if (typeof callback !== 'function') return;
      try {
        const entryManager = entryManagers[channelId];
        if (!entryManager) throw new Error();
        await entryManager.register(userId, socketId);
        callback({ success: true });
      } catch (error: any) {
        if (error.status === 500)
          entryNameSpace.to(channelId).emit('gameCreationFailed');
        callback({ success: false });
      }
    });

    socket.on('cancelEntry', (callback) => {
      if (typeof callback !== 'function') return;
      try {
        const entryManager = entryManagers[channelId];
        if (!entryManager) throw new Error();
        entryManager.cancel(socketId);
        callback({ success: true });
      } catch (error: any) {
        callback({ success: false });
      }
    });

    socket.on('disconnect', () => {
      try {
        entryManagers[channelId]?.cancel(socketId);
      } catch (error) {
        console.log(error);
      }
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
  });
};
