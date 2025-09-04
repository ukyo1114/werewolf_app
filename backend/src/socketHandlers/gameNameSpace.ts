import { Namespace, Socket } from 'socket.io';
import { appState, Events } from '../config/appState';
import { errors } from '../config/messages';
import { authSocketUser } from '../middleware/authSocketUser';
import { IGameState } from '../config/types';

const { gameManagers } = appState;
const { gameEvents } = Events;

interface CustomSocket extends Socket {
  channelId?: string;
}

export const gameNameSpaceHandler = (gameNameSpace: Namespace) => {
  gameNameSpace.use(authSocketUser('game'));
  // 認証ミドルウェア
  gameNameSpace.use((socket: CustomSocket, next) => {
    const gameId = socket.channelId;
    if (!gameId || !gameManagers[gameId]) {
      return next(new Error(errors.GAME_NOT_FOUND));
    }
    next();
  });

  gameNameSpace.on('connection', (socket: CustomSocket) => {
    try {
      const gameId = socket.channelId as string;
      const game = gameManagers[gameId];
      if (!game) throw new Error();

      const gameState = game.getGameState();
      socket.emit('connect_response', { success: true, gameState });
      socket.join(gameId);
    } catch (error) {
      socket.emit('connect_response', { success: false });
      socket.disconnect();
    }
  });

  gameEvents.on('updateGameState', (gameState: IGameState) => {
    const { gameId } = gameState;
    gameNameSpace.to(gameId).emit('updateGameState', gameState);
  });
};
