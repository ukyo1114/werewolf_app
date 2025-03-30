import { Namespace, Socket } from 'socket.io';
import { errors } from '../config/messages';
import { appState, Events } from '../app';
import EntryManager from '../classes/EntryManager';
import Channel from '../models/channelModel';
import ChannelUser from '../models/channelUserModel';

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
      if (!channel || !channelUserExists) {
        socket.emit('connect_error', errors.CHANNEL_ACCESS_FORBIDDEN);
        socket.disconnect();
        return;
      }

      if (!entryManagers[channelId]) {
        entryManagers[channelId] = new EntryManager(
          channelId,
          channel.numberOfPlayers,
        );
      }
    } catch (error) {
      console.error(error);
      socket.emit('connect_error');
      socket.disconnect();
      return;
    }

    socket.on('registerEntry', async (callback) => {
      try {
        await entryManagers[channelId]?.register(userId, socketId);
        callback({ success: true });
      } catch (error) {
        callback({ success: false });
      }
    });

    socket.on('cancelEntry', (callback) => {
      try {
        entryManagers[channelId]?.cancel(socketId);
        callback({ success: true });
      } catch (error) {
        callback({ success: false });
      }
    });

    socket.on('disconnect', () => {
      try {
        entryManagers[channelId]?.cancel(socketId);
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
