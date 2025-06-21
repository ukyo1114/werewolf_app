import { Namespace, Socket } from 'socket.io';
import { appState, Events } from '../app';
import ChannelManager from '../classes/ChannelManager';
import { IMessage } from '../models/Message';
import { authSocketUser } from '../middleware/authSocketUser';

const { channelManagers } = appState;
const { channelEvents } = Events;

interface CustomSocket extends Socket {
  userId?: string;
  channelId?: string;
}

export const chatNameSpaceHandler = (chatNameSpace: Namespace) => {
  chatNameSpace.use(authSocketUser('chat'));

  chatNameSpace.use(async (socket: CustomSocket, next) => {
    const userId = socket.userId as string;
    const channelId = socket.channelId as string;
    const socketId = socket.id;

    const channelManager =
      channelManagers[channelId] ||
      (await ChannelManager.createChannelInstance(channelId));

    await channelManager.userJoined(userId, socketId);
    socket.join(channelId);
    next();
  });

  chatNameSpace.on('connection', async (socket: CustomSocket) => {
    const userId = socket.userId as string;
    const channelId = socket.channelId as string;

    socket.on('disconnect', async () => {
      channelManagers[channelId]?.userLeft(userId);
    });
  });

  channelEvents.on(
    'newMessage',
    (channelId: string, message: IMessage, users: string[] | null = null) => {
      const { messageType } = message;

      if (messageType == 'normal' || messageType == 'system') {
        chatNameSpace.to(channelId).emit('newMessage', message);
      } else {
        users?.forEach((user) => {
          chatNameSpace.to(user).emit('newMessage', message);
        });
      }
    },
  );

  channelEvents.on(
    'channelSettingsUpdated',
    ({
      channelId,
      channelName,
      channelDescription,
      numberOfPlayers,
    }: {
      channelId: string;
      channelName: string;
      channelDescription: string;
      numberOfPlayers: number;
    }) => {
      chatNameSpace.to(channelId).emit('channelSettingsUpdated', {
        channelName,
        channelDescription,
        numberOfPlayers,
      });
    },
  );

  channelEvents.on(
    'userJoined',
    ({
      channelId,
      user,
    }: {
      channelId: string;
      user: {
        _id: string;
        userName: string;
        pic: string;
        isGuest: Boolean | null;
      };
    }) => {
      chatNameSpace.to(channelId).emit('userJoined', user);
    },
  );

  channelEvents.on(
    'userLeft',
    ({ channelId, userId }: { channelId: string; userId: string }) => {
      chatNameSpace.to(channelId).emit('userLeft', userId);
    },
  );

  channelEvents.on(
    'registerBlockUser',
    ({ channelId, userId }: { channelId: string; userId: string }) => {
      chatNameSpace.to(channelId).emit('registerBlockUser', userId);
    },
  );

  channelEvents.on(
    'cancelBlockUser',
    ({ channelId, userId }: { channelId: string; userId: string }) => {
      chatNameSpace.to(channelId).emit('cancelBlockUser', userId);
    },
  );
};
