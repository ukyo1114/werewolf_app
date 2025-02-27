import GameManager from './GameManager';

export const games: {
  [key: string]: GameManager;
} = {};

export const checkIsUserInGame = (userId: string) => {
  return Object.values(games).some(
    (game) =>
      userId in game.playerManager.players && game.result.value === 'running',
  );
};

export const isUserPlayingGame = (userId: string) => {
  const game = Object.values(games).find(
    (game) =>
      userId in game.playerManager.players &&
      game.result.value === 'running' &&
      game.playerManager.players[userId].status === 'alive',
  );

  return game ? game.gameId : null;
};

export const getGamesByChannelId = (channelId: string) => {
  const filteredGames = Object.values(games).filter(
    (game) => game.channelId === channelId,
  );

  return filteredGames;
};
