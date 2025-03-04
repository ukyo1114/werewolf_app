import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';

export const socketHandler = (server: Server): void => {
  const io = new SocketIOServer(server, {
    pingTimeout: 60 * 1000,
    cors:
      process.env.NODE_ENV === 'development'
        ? { origin: 'http://localhost:5173' }
        : undefined,
  });
};
