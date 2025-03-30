import { Namespace, Socket } from 'socket.io';
import { appState, Events } from '../app';

const { gameManagers } = appState;
const { gameEvents } = Events;

interface CustomSocket extends Socket {
  channelId?: string;
}

export const gameNameSpaceHandler = (gameNameSpace: Namespace) => {
  gameNameSpace.on('connection', async (socket: CustomSocket) => {
    const gameId = socket.channelId;
    if (!gameId) {
      socket.emit('connect_error');
      socket.disconnect();
      return;
    }

    const game = gameManagers[gameId];

    if (!game) {
      socket.emit('connect_error');
      socket.disconnect();
      return;
    }

    const gameState = game.getGameState();
    socket.emit('connect_response', gameState);
    socket.join(gameId);
  });

  gameEvents.on('updateGameState', (gameState) => {
    const { gameId } = gameState;
    gameNameSpace.to(gameId).emit('updateGameState', gameState);
  });
};
