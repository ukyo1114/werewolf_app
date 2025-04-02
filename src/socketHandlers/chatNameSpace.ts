import { Namespace, Socket } from 'socket.io';
import { appState, Events } from '../app';
import { createChannelInstance } from '../utils/createChannelInstance';
import { IMessage } from '../models/messageModel';

const { channelManagers } = appState;
const { channelEvents } = Events;

interface CustomSocket extends Socket {
  userId?: string;
  channelId?: string;
}

export const chatNameSpaceHandler = (chatNameSpace: Namespace) => {
  chatNameSpace.on('connection', async (socket: CustomSocket) => {
    const userId = socket.userId as string;
    const channelId = socket.channelId as string;
    const socketId = socket.id;

    try {
      const channelManager =
        channelManagers[channelId] || (await createChannelInstance(channelId));

      await channelManager.userJoined(userId, socketId);
      socket.join(channelId);
    } catch (error) {
      socket.emit('connect_error');
      socket.disconnect();
      return;
    }

    socket.on('disconnect', async () => {
      channelManagers[channelId]?.userLeft(userId);
    });
  });

  channelEvents.on(
    'newMessage',
    (channelId: string, message: IMessage, users: string[] | null) => {
      const { messageType } = message;

      if (messageType == 'normal') {
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
      updatedChannel,
    }: {
      channelId: string;
      updatedChannel: { channelName: string; channelDescription: string };
    }) => {
      chatNameSpace
        .to(channelId)
        .emit('channelSettingsUpdated', updatedChannel);
    },
  );

  channelEvents.on(
    'userJoined',
    ({
      channelId,
      user,
    }: {
      channelId: string;
      user: { _id: string; userName: string; pic: string | null };
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
