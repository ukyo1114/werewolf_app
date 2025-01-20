import GameManager from './GameManager';

export const games: {
  [key: string]: GameManager;
} = {};

export const isUserInGame = (userId: string) => {
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
