/**
 * test checkIsUserInGame
 * Returns true if the game is in progress and the user is participating
 * Returns false if the game is not in progress
 * Returns false if the user is not participating
 *
 * test isUserPlayingGame
 * Returns the gameId if the game is in progress and the user is alive
 * Returns null if there is no game the user is currently participating in
 * Returns null if the game is not in progress
 * Returns null if the player is not alive
 */
jest.mock('../../src/app', () => ({
  appState: { gameManagers: {} },
}));
import {
  checkIsUserInGame,
  isUserPlayingGame,
} from '../../src/classes/GameInstanceManager';
import GameManager from '../../src/classes/GameManager';
import { mockChannelId, mockGameId, mockUsers } from '../../jest.setup';
import { appState } from '../../src/app';

const { gameManagers } = appState;

beforeEach(() => {
  jest.useFakeTimers();
  gameManagers[mockGameId] = new GameManager(
    mockChannelId,
    mockGameId,
    mockUsers,
  );
  gameManagers[mockGameId].sendMessage = jest.fn();
});

afterAll(() => {
  delete gameManagers[mockGameId];
  jest.restoreAllMocks();
});

describe('test checkIsUserInGame', () => {
  it('Returns true if the game is in progress and the user is participating', () => {
    const game = gameManagers[mockGameId];

    expect(game.result.value).toBe('running');

    const testUserId = mockUsers[0].userId;
    const isUserInGame = checkIsUserInGame(testUserId);

    expect(isUserInGame).toBe(true);
  });

  it('Returns false if the game is not in progress', () => {
    const game = gameManagers[mockGameId];
    game.result.value = 'villagersWin';

    expect(game.result.value).not.toBe('running');

    const testUserId = mockUsers[0].userId;
    const isUserInGame = checkIsUserInGame(testUserId);

    expect(isUserInGame).toBe(false);
  });

  it('Returns false if the user is not participating', () => {
    const game = gameManagers[mockGameId];

    expect(game.result.value).toBe('running');

    const testUserId = 'nonParticipatingUser';
    const isUserInGame = checkIsUserInGame(testUserId);

    expect(isUserInGame).toBe(false);
  });
});

describe('test isUserInGame', () => {
  it('Returns the gameId if the game is in progress and the user is alive', () => {
    const game = gameManagers[mockGameId];
    const testUserId = mockUsers[0].userId;

    expect(game.result.value).toBe('running');
    expect(game.playerManager.players[testUserId].status).toBe('alive');

    const gameId = isUserPlayingGame(testUserId);

    expect(gameId).toBe(mockGameId);
  });

  it('Returns null if there is no game the user is currently participating in', () => {
    const testUserId = 'nonParticipatingUser';
    const gameId = isUserPlayingGame(testUserId);

    expect(gameId).toBe(null);
  });

  it('Returns null if the game is not in progress', () => {
    const game = gameManagers[mockGameId];
    const testUserId = mockUsers[0].userId;

    game.result.value = 'villagersWin';

    expect(game.result.value).not.toBe('running');
    expect(game.playerManager.players[testUserId].status).toBe('alive');

    const gameId = isUserPlayingGame(testUserId);

    expect(gameId).toBe(null);
  });

  it('Returns null if the player is not alive', () => {
    const game = gameManagers[mockGameId];
    const testUserId = mockUsers[0].userId;

    game.playerManager.kill(testUserId);

    expect(game.result.value).toBe('running');
    expect(game.playerManager.players[testUserId].status).not.toBe('alive');

    const gameId = isUserPlayingGame(testUserId);

    expect(gameId).toBe(null);
  });
});
