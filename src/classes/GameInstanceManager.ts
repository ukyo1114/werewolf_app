import { appState } from '../app';

const { gameManagers } = appState;

export const checkIsUserInGame = (userId: string) => {
  return Object.values(gameManagers).some(
    (game) =>
      userId in game.playerManager.players && game.result.value === 'running',
  );
};

export const isUserPlayingGame = (userId: string) => {
  const game = Object.values(gameManagers).find(
    (game) =>
      userId in game.playerManager.players &&
      game.result.value === 'running' &&
      game.playerManager.players[userId].status === 'alive',
  );

  return game ? game.gameId : null;
};

export const getGamesByChannelId = (channelId: string) => {
  const filteredGames = Object.values(gameManagers).filter(
    (game) => game.channelId === channelId,
  );

  return filteredGames;
};
