import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { entryNameSpaceHandler } from './entryNameSpace';
import { chatNameSpaceHandler } from './chatNameSpace';
import { gameNameSpaceHandler } from './gameNameSpace';

export const socketHandler = (server: Server): SocketIOServer => {
  const io = new SocketIOServer(server, {
    pingTimeout: 60 * 1000,
    cors:
      process.env.NODE_ENV === 'development'
        ? { origin: 'http://localhost:5173' }
        : undefined,
  });
  // 名前空間のハンドラーを設定
  entryNameSpaceHandler(io.of('/entry'));
  chatNameSpaceHandler(io.of('/chat'));
  gameNameSpaceHandler(io.of('/game'));

  return io;
};
