import { EventEmitter } from 'events';
import { ObjectId } from 'mongodb';
import GameUser from '../../src/models/gameUserModel';
import { games } from '../../src/classes/GameInstanceManager';
import GameManager from '../../src/classes/GameManager';
import { IUser } from '../../src/classes/PlayerManager';
import { roleConfig } from '../../src/config/roles';
import AppError from '../../src/utils/AppError';
import { gameError } from '../../src/config/messages';

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
    await games[mockGameId].playerManager.registerPlayersInDB();

    const gameUsers = await GameUser.find({ gameId: mockGameId }).lean();

    gameUsers.forEach((gameUser) => {
      const userId = gameUser.userId.toString();

      expect(gameUser.role).toBe(players[userId].role);
    });
  });

  describe('test getPlayserState', () => {
    it('spectator用ステータスを返すこと', () => {
      const userId = 'notRegistered';
      const playerState =
        games[mockGameId].playerManager.getPlayerState(userId);

      expect(playerState).toEqual({
        status: 'spectator',
        role: 'spectator',
      });
    });

    it('ゲームに参加しているプレイヤーのステータスが返ること', () => {
      mockUsers.forEach((user) => {
        const userId = user.userId;
        const role = games[mockGameId].playerManager.players[userId].role;
        const properties =
          role === 'freemason'
            ? ['freemasons']
            : role === 'werewolf'
              ? ['werewolves']
              : role === 'immoralist'
                ? ['fox', 'immoralists']
                : [];

        const playerState =
          games[mockGameId].playerManager.getPlayerState(userId);

        expect(playerState.status).toBe('alive');
        expect(playerState.role).toBe(role);
        properties.forEach((property) => {
          expect(playerState).toHaveProperty(property);
        });
      });
    });
  });

  describe('test findPayerByRole', () => {
    it('プレイヤーが存在しない場合エラーになる', () => {
      expect(() =>
        games[mockGameId].playerManager.findPlayerByRole('fox'),
      ).toThrow(new AppError(500, gameError.PLAYER_NOT_FOUND));
    });

    it('プレイヤー情報を取得できる', () => {
      const validRoles = roleConfig[mockUsers.length];

      validRoles.forEach((role) => {
        const player = games[mockGameId].playerManager.findPlayerByRole(role);

        expect(player).toHaveProperty('userId');
        expect(player).toHaveProperty('userName');
        expect(player).toHaveProperty('status');
        expect(player).toHaveProperty('role');
      });
    });
  });

  describe('test getImmoralists', () => {
    it('返されたプレイヤーにimmorarilstだけが含まれていること', () => {
      const players = games[mockGameId].playerManager.getImmoralists();

      players.forEach((player) => {
        expect(player.role).toBe('immoralist');
      });
    });
  });

  describe('test getLivingPlayers', () => {
    it('返されたプレイヤーが全員生存していること', () => {
      const players = games[mockGameId].playerManager.getLivingPlayers();

      players.forEach((player) => {
        expect(player.status).toBe('alive');
      });
    });
  });

  describe('test getPlayersWithRole', () => {
    it('プレイヤーデータにuserId, status, roleだけが含まれていること', () => {
      const players = games[mockGameId].playerManager.getPlayersWithRole();

      Object.values(players).forEach((player) => {
        expect(player).toHaveProperty('userId');
        expect(player).toHaveProperty('status');
        expect(player).toHaveProperty('role');
        expect(player).not.toHaveProperty('userName');
      });
    });
  });

  describe('test getPlayersWithoutRole', () => {
    it('プレイヤーデータにuserId, statusだけが含まれていること', () => {
      const players = games[mockGameId].playerManager.getPlayersWithoutRole();

      Object.values(players).forEach((player) => {
        expect(player).toHaveProperty('userId');
        expect(player).toHaveProperty('status');
        expect(player).not.toHaveProperty('role');
        expect(player).not.toHaveProperty('userName');
      });
    });
  });
});
