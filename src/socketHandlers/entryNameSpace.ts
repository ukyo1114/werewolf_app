import { Namespace, Socket } from 'socket.io';
import { errors } from '../config/messages';
import { appState, Events } from '../app';
import EntryManager from '../classes/EntryManager';
import Channel from '../models/Channel';
import ChannelUser from '../models/ChannelUser';

const { entryManagers } = appState;
const { entryEvents } = Events;

interface CustomSocket extends Socket {
  userId?: string;
  channelId?: string;
}

export const entryNameSpaceHandler = (entryNameSpace: Namespace) => {
  entryNameSpace.on('connection', async (socket: CustomSocket) => {
    const userId = socket.userId as string;
    const channelId = socket.channelId as string;
    const socketId = socket.id;

    try {
      const [channel, channelUserExists] = await Promise.all([
        Channel.findById(channelId).select('numberOfPlayers').lean(),
        ChannelUser.exists({ channelId, userId }),
      ]);
      if (!channel || !channelUserExists) throw new Error();

      EntryManager.createEntryManager(channelId, channel.numberOfPlayers);
    } catch (error) {
      console.error(error);
      socket.emit('connect_error', errors.CHANNEL_ACCESS_FORBIDDEN);
      socket.disconnect();
      return;
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
      try {
        entryManagers[channelId]?.cancel(socketId);
      } catch (error) {
        entryNameSpace.to(channelId).emit('userLeave', userId);
      }
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
