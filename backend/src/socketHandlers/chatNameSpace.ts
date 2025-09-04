import { Namespace, Socket } from 'socket.io';
import { appState, Events } from '../config/appState';
import { authSocketUser } from '../middleware/authSocketUser';
import { errors } from '../config/messages';
import { IMessageIndex } from '../config/types';

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

    const channelManager = channelManagers[channelId];
    if (!channelManager) throw new Error(errors.CHANNEL_NOT_FOUND);

    channelManager.userJoined(userId, socketId);
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
    (messageReceivers: string[] | string, index: IMessageIndex[]) => {
      if (typeof messageReceivers === 'string') {
        chatNameSpace.to(messageReceivers).emit('newMessage', index);
      } else {
        messageReceivers.forEach((user) => {
          chatNameSpace.to(user).emit('newMessage', index);
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
        pic?: string;
        isGuest: Boolean;
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
    'registerBlock',
    ({ channelId, userId }: { channelId: string; userId: string }) => {
      chatNameSpace.to(channelId).emit('registerBlock', userId);
    },
  );

  channelEvents.on(
    'cancelBlock',
    ({ channelId, userId }: { channelId: string; userId: string }) => {
      chatNameSpace.to(channelId).emit('cancelBlock', userId);
    },
  );

  channelEvents.on(
    'updateProfile',
    (
      channelIds: string[],
      data: {
        userId: string;
        userName?: string;
        pic?: string;
      },
    ) => {
      channelIds.forEach((channelId) => {
        chatNameSpace.to(channelId).emit('updateProfile', data);
      });
    },
  );

  channelEvents.on('channelDeleted', (channelId: string) => {
    chatNameSpace.to(channelId).emit('channelDeleted');
  });
};
