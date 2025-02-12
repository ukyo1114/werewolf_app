import { games } from '../../src/classes/GameInstanceManager';
import GameManager from '../../src/classes/GameManager';
import ChannelManager from '../../src/classes/ChannelManager';
import ChannelUser from '../../src/models/channelUserModel';
import GameUser from '../../src/models/gameUserModel';
import {
  mockUserId,
  mockChannelId,
  mockGameId,
  mockUsers,
} from '../../jest.setup';

const mockSocketId = 'mockSocketId';

beforeAll(async () => {
  await ChannelUser.create({ channelId: mockChannelId, userId: mockUserId });
  await GameUser.create({ gameId: mockGameId, userId: mockUserId });
});

beforeEach(() => {
  games[mockGameId] = new GameManager(mockChannelId, mockGameId, mockUsers);
  // sendMessageをモック
  games[mockGameId].sendMessage = jest.fn();
});

afterEach(() => {
  const timerId = games[mockGameId].phaseManager.timerId;

  if (timerId) {
    clearTimeout(timerId);
  }
});

afterAll(() => {
  delete games[mockGameId];
  jest.restoreAllMocks();
});

describe('test ChannelManager', () => {
  describe('constructor', () => {
    it('通常のチャンネルが正しく初期化されること', () => {
      const channel = new ChannelManager(mockChannelId);

      expect(channel.channelId).toBe(mockChannelId);
      expect(channel.users).toEqual({});
      expect(channel.game).toBeUndefined();
    });

    it('ゲーム用チャンネルが正しく初期化されること', () => {
      const game = games[mockGameId];
      const channel = new ChannelManager(mockGameId, game);

      expect(channel.channelId).toBe(mockGameId);
      expect(channel.users).toEqual({});
      expect(channel.game).toBeInstanceOf(GameManager);
    });
  });

  describe('userJoined', () => {
    // ゲーム用のチャンネル
    // 通常のチャンネルでデータベースエラー
    // ゲーム用のチャンネルでデータベースエラー
    // ユーザーが人狼
    // ユーザーが死亡
    // ユーザーがゲーム内にいない
    it('通常のチャンネルでユーザーがチャンネルに参加できる', async () => {
      const channel = new ChannelManager(mockChannelId);
      await channel.userJoind(mockUserId, mockSocketId);

      const user = channel.users[mockUserId];

      expect(user.userId).toBe(mockUserId);
      expect(user.socketId).toBe(mockSocketId);
      expect(user.status).toBe('normal');
    });

    it('ゲーム用のチャンネルでユーザーがチャンネルに参加できる', async () => {
      const game = games[mockGameId];
      const channel = new ChannelManager(mockGameId, game);

      const playerId = game.playerManager.findPlayerByRole('villager').userId;
      await GameUser.create({ gameId: mockGameId, userId: playerId });

      await channel.userJoind(playerId, mockSocketId);

      const user = channel.users[playerId];

      expect(user.userId).toBe(playerId);
      expect(user.socketId).toBe(mockSocketId);
      expect(user.status).toBe('normal');
    });
  });
});
