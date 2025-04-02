import {
  checkIsUserInGame,
  isUserPlayingGame,
  getGamesByChannelId,
} from '../../src/utils/gameUtils';
import GameManager from '../../src/classes/GameManager';
import {
  mockChannelId,
  mockGameId,
  mockUserId,
  mockUsers,
} from '../../jest.setup';
import { appState } from '../../src/app';

const { gameManagers } = appState;

beforeAll(() => {
  gameManagers[mockGameId] = new GameManager(
    mockChannelId,
    mockGameId,
    mockUsers,
  );
  gameManagers[mockGameId].playerManager.players = {
    [mockUserId]: {
      userId: mockUserId,
      userName: 'mockUser',
      status: 'alive',
      role: 'villager',
    },
  };
  gameManagers[mockGameId].sendMessage = jest.fn();
});

afterAll(() => {
  const timerId = gameManagers[mockGameId]?.phaseManager.timerId;
  if (timerId) clearTimeout(timerId);

  delete gameManagers[mockGameId];
  jest.restoreAllMocks();
});

describe('test checkIsUserInGame', () => {
  it('ユーザーが進行中のゲームに参加しているとき', () => {
    const game = gameManagers[mockGameId];
    expect(game.result.value).toBe('running');

    const isUserInGame = checkIsUserInGame(mockUserId);
    expect(isUserInGame).toBe(true);
  });

  it('ユーザーが参加中のゲームが終了しているとき', () => {
    const game = gameManagers[mockGameId];
    game.result.value = 'villagersWin';
    expect(game.result.value).not.toBe('running');

    const isUserInGame = checkIsUserInGame(mockUserId);
    expect(isUserInGame).toBe(false);
  });

  it('ユーザーが参加中のゲームが存在しない時', () => {
    const isUserInGame = checkIsUserInGame('nonParticipatingUser');
    expect(isUserInGame).toBe(false);
  });
});

describe('test isUserPlayingGame', () => {
  it('ユーザーがゲームをプレイ中の時', () => {
    const game = gameManagers[mockGameId];
    game.result.value = 'running';
    expect(game.result.value).toBe('running');

    const gameId = isUserPlayingGame(mockUserId);
    expect(gameId).toBe(mockGameId);
  });

  it('ユーザーが参加中のゲームが存在しない時', () => {
    const testUserId = 'nonParticipatingUser';
    const gameId = isUserPlayingGame(testUserId);

    expect(gameId).toBe(null);
  });

  it('ユーザーが参加中のゲームが終了しているとき', () => {
    const game = gameManagers[mockGameId];
    game.result.value = 'villagersWin';

    expect(game.result.value).not.toBe('running');
    expect(game.playerManager.players[mockUserId].status).toBe('alive');

    const gameId = isUserPlayingGame(mockUserId);
    expect(gameId).toBe(null);
  });

  it('ユーザーが参加中のゲーム内で生存状態でないとき', () => {
    const game = gameManagers[mockGameId];
    game.result.value = 'running';
    game.playerManager.kill(mockUserId);

    expect(game.result.value).toBe('running');
    expect(game.playerManager.players[mockUserId].status).not.toBe('alive');

    const gameId = isUserPlayingGame(mockUserId);
    expect(gameId).toBe(null);
  });
});

describe('test getGamesByChanelId', () => {
  it('ゲームのリストを取得する', () => {
    const games = getGamesByChannelId(mockChannelId);

    expect(games.length).not.toBe(0);
    for (const game of games) {
      expect(game).toBeInstanceOf(GameManager);
    }
  });

  it('チャンネル内にゲームが存在しないとき', () => {
    const games = getGamesByChannelId('notExist');
    expect(games).toEqual([]);
  });
});
