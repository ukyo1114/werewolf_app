import { ObjectId } from 'mongodb';
import { games } from '../../src/classes/GameInstanceManager';
import GameManager from '../../src/classes/GameManager';
import ChannelManager from '../../src/classes/ChannelManager';
import { IUser } from '../../src/classes/PlayerManager';
import Game from '../../src/models/gameModel';
import ChannelUser from '../../src/models/channelUserModel';
import GameUser from '../../src/models/gameUserModel';

const mockUser = new ObjectId().toString();
const mockSocketId = 'mockSocketId';
const mockChannelId = new ObjectId().toString();
const mockGameId = new ObjectId().toString();
const mockUsers: IUser[] = [
  { userId: new ObjectId().toString(), userName: 'Alice' },
  { userId: new ObjectId().toString(), userName: 'Bob' },
  { userId: new ObjectId().toString(), userName: 'Charlie' },
  { userId: new ObjectId().toString(), userName: 'Diana' },
  { userId: new ObjectId().toString(), userName: 'Eve' },
  { userId: new ObjectId().toString(), userName: 'Frank' },
  { userId: new ObjectId().toString(), userName: 'Grace' },
  { userId: new ObjectId().toString(), userName: 'Hank' },
  { userId: new ObjectId().toString(), userName: 'Ivy' },
  { userId: new ObjectId().toString(), userName: 'Jack' },
];

beforeAll(async () => {
  await ChannelUser.create({ channelId: mockChannelId, userId: mockUser });
  await GameUser.create({ gameId: mockGameId, userId: mockUser });
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
      await channel.userJoind(mockUser, mockSocketId);

      const user = channel.users[mockUser];

      expect(user.userId).toBe(mockUser);
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
