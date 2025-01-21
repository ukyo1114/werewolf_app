import { EventEmitter } from 'events';
import { ObjectId } from 'mongodb';
import GameUser from '../../src/models/gameUserModel';
import { games } from '../../src/classes/GameInstanceManager';
import GameManager from '../../src/classes/GameManager';
import PlayerManager, { IUser } from '../../src/classes/PlayerManager';
import { roleConfig } from '../../src/config/roles';

const mockChannelId = 'mockChannelId';
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

describe('test PlayserManager', () => {
  it('playerManagerが正しく初期化されること', () => {
    const validRoles = roleConfig[mockUsers.length];
    const { gameId, players } = games[mockGameId].playerManager;

    expect(gameId).toBe(mockGameId);
    mockUsers.forEach((user) => {
      const userId = user.userId;
      const player = players[userId];

      expect(player.userId).toBe(userId);
      expect(player.userName).toBe(user.userName);
      expect(player.status).toBe('alive');
      expect(validRoles).toContain(player.role);
    });
  });

  it('データベースにプレイヤーを登録できること', async () => {
    const players = games[mockGameId].playerManager.players;
    await games[mockGameId].playerManager.registerPlayerInDB();

    const gameUsers = await GameUser.find({ gameId: mockGameId }).lean();

    gameUsers.forEach((gameUser) => {
      const userId = gameUser.userId.toString();

      expect(gameUser.role).toBe(players[userId].role);
    });
  });
});
