jest.mock('../../src/app', () => ({
  appState: { gameManagers: {} },
}));
import GameUser from '../../src/models/gameUserModel';
import GameManager from '../../src/classes/GameManager';
import { roleConfig } from '../../src/config/roles';
import AppError from '../../src/utils/AppError';
import { gameError } from '../../src/config/messages';
import { mockChannelId, mockGameId, mockUsers } from '../../jest.setup';
import { appState } from '../../src/app';

const { gameManagers } = appState;

beforeEach(() => {
  gameManagers[mockGameId] = new GameManager(
    mockChannelId,
    mockGameId,
    mockUsers,
  );
  // sendMessageをモック
  gameManagers[mockGameId].sendMessage = jest.fn();
});

afterEach(() => {
  const timerId = gameManagers[mockGameId].phaseManager.timerId;

  if (timerId) {
    clearTimeout(timerId);
  }
});

afterAll(() => {
  delete gameManagers[mockGameId];
  jest.restoreAllMocks();
});

describe('test PlayserManager', () => {
  it('playerManagerが正しく初期化されること', () => {
    const validRoles = roleConfig[mockUsers.length];
    const { gameId, players } = gameManagers[mockGameId].playerManager;

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
    const players = gameManagers[mockGameId].playerManager.players;
    await gameManagers[mockGameId].playerManager.registerPlayersInDB();

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
        gameManagers[mockGameId].playerManager.getPlayerState(userId);

      expect(playerState).toEqual({
        status: 'spectator',
        role: 'spectator',
      });
    });

    it('ゲームに参加しているプレイヤーのステータスが返ること', () => {
      mockUsers.forEach((user) => {
        const userId = user.userId;
        const role =
          gameManagers[mockGameId].playerManager.players[userId].role;
        const properties =
          role === 'freemason'
            ? ['freemasons']
            : role === 'werewolf'
              ? ['werewolves']
              : role === 'immoralist'
                ? ['fox', 'immoralists']
                : [];

        const playerState =
          gameManagers[mockGameId].playerManager.getPlayerState(userId);

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
        gameManagers[mockGameId].playerManager.findPlayerByRole('fox'),
      ).toThrow(new AppError(500, gameError.PLAYER_NOT_FOUND));
    });

    it('プレイヤー情報を取得できる', () => {
      const validRoles = roleConfig[mockUsers.length];

      validRoles.forEach((role) => {
        const player =
          gameManagers[mockGameId].playerManager.findPlayerByRole(role);

        expect(player).toHaveProperty('userId');
        expect(player).toHaveProperty('userName');
        expect(player).toHaveProperty('status');
        expect(player).toHaveProperty('role');
      });
    });
  });

  describe('test getImmoralists', () => {
    it('返されたプレイヤーにimmorarilstだけが含まれていること', () => {
      const players = gameManagers[mockGameId].playerManager.getImmoralists();

      players.forEach((player) => {
        expect(player.role).toBe('immoralist');
      });
    });
  });

  describe('test getLivingPlayers', () => {
    it('返されたプレイヤーが全員生存していること', () => {
      const players = gameManagers[mockGameId].playerManager.getLivingPlayers();

      players.forEach((player) => {
        expect(player.status).toBe('alive');
      });
    });
  });

  describe('test getPlayersWithRole', () => {
    it('プレイヤーデータにuserId, status, roleだけが含まれていること', () => {
      const players =
        gameManagers[mockGameId].playerManager.getPlayersWithRole();

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
      const players =
        gameManagers[mockGameId].playerManager.getPlayersWithoutRole();

      Object.values(players).forEach((player) => {
        expect(player).toHaveProperty('userId');
        expect(player).toHaveProperty('status');
        expect(player).not.toHaveProperty('role');
        expect(player).not.toHaveProperty('userName');
      });
    });
  });
});
