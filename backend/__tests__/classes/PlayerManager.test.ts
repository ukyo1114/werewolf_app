jest.mock('../../src/models/GameUsers', () => ({
  leaveGame: jest.fn(),
}));

import AppError from '../../src/utils/AppError';
import { appState } from '../../src/config/appState';
import ChannelManager from '../../src/classes/ChannelManager';
import GameUsers from '../../src/models/GameUsers';
import { roleConfig } from '../../src/config/roles';
import PlayerManager from '../../src/classes/PlayerManager';

describe('PlayerManager', () => {
  let playerManager: PlayerManager;
  let mockChannelManager: ChannelManager;
  const mockGameId = 'game123';
  const mockUsers = [
    { userId: 'user1', userName: 'Player1' },
    { userId: 'user2', userName: 'Player2' },
    { userId: 'user3', userName: 'Player3' },
    { userId: 'user4', userName: 'Player4' },
    { userId: 'user5', userName: 'Player5' },
  ];

  beforeEach(() => {
    // ChannelManagerのモック
    mockChannelManager = {
      users: {
        user1: { kill: jest.fn() },
        user2: { kill: jest.fn() },
        user3: { kill: jest.fn() },
        user4: { kill: jest.fn() },
        user5: { kill: jest.fn() },
      },
    } as any;

    // appStateにチャンネルマネージャーを設定
    appState.channelManagers[mockGameId] = mockChannelManager;

    playerManager = new PlayerManager(mockGameId, mockUsers);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete appState.channelManagers[mockGameId];
  });

  describe('コンストラクタ', () => {
    it('正しい初期値でインスタンスを作成する', () => {
      expect(playerManager.gameId).toBe(mockGameId);
      expect(playerManager.players).toBeDefined();
    });

    it('プレイヤーに正しい役職を割り当てる', () => {
      const validRoles = roleConfig[mockUsers.length];

      Object.values(playerManager.players).forEach((player) => {
        expect(mockUsers.map((u) => u.userId)).toContain(player.userId);
        expect(mockUsers.map((u) => u.userName)).toContain(player.userName);
        expect(player.status).toBe('alive');
        expect(validRoles).toContain(player.role);
        expect(player.teammates).toBeDefined();
      });
    });
  });

  describe('setTeammates', () => {
    it('人狼に正しい仲間を設定する', () => {
      playerManager.setTeammates();

      Object.values(playerManager.players).forEach((player) => {
        if (player.role === 'werewolf') {
          const werewolves = Object.values(playerManager.players)
            .filter((p) => p.role === 'werewolf')
            .map((p) => p.userId);
          expect(player.teammates).toEqual(werewolves);
        }
      });
    });

    it('フリーメイソンに正しい仲間を設定する', () => {
      playerManager.setTeammates();

      Object.values(playerManager.players).forEach((player) => {
        if (player.role === 'freemason') {
          const freemasons = Object.values(playerManager.players)
            .filter((p) => p.role === 'freemason')
            .map((p) => p.userId);
          expect(player.teammates).toEqual(freemasons);
        }
      });
    });
  });

  describe('kill', () => {
    it('プレイヤーを死亡状態にする', async () => {
      const targetUserId = 'user1';

      await playerManager.kill(targetUserId);

      expect(playerManager.players[targetUserId].status).toBe('dead');
      expect(mockChannelManager.users[targetUserId].kill).toHaveBeenCalled();
      expect(GameUsers.leaveGame).toHaveBeenCalledWith(
        mockGameId,
        targetUserId,
      );
    });
  });

  describe('getPlayerState', () => {
    it('登録されたプレイヤーの状態を返す', () => {
      const userId = 'user1';
      const playerState = playerManager.getPlayerState(userId);

      expect(playerState.status).toBe('alive');
      expect(playerState.role).toBe(playerManager.players[userId].role);
      expect(playerState.teammates).toEqual(
        playerManager.players[userId].teammates,
      );
    });

    it('登録されていないユーザーの場合、spectator状態を返す', () => {
      const userId = 'nonexistent';
      const playerState = playerManager.getPlayerState(userId);

      expect(playerState).toEqual({
        status: 'spectator',
        role: 'spectator',
        teammates: [],
      });
    });
  });

  describe('getLivingPlayers', () => {
    it('生存しているプレイヤーを返す', () => {
      const livingPlayers = playerManager.getLivingPlayers();

      livingPlayers.forEach((player) => {
        expect(player.status).toBe('alive');
      });
      expect(livingPlayers.length).toBe(mockUsers.length);
    });

    it('特定の役職の生存プレイヤーを返す', () => {
      const werewolves = playerManager.getLivingPlayers('werewolf');

      werewolves.forEach((player) => {
        expect(player.status).toBe('alive');
        expect(player.role).toBe('werewolf');
      });
    });

    it('死亡したプレイヤーは含まれない', () => {
      // プレイヤーを死亡させる
      playerManager.players['user1'].status = 'dead';

      const livingPlayers = playerManager.getLivingPlayers();
      expect(livingPlayers.length).toBe(mockUsers.length - 1);
      expect(livingPlayers.find((p) => p.userId === 'user1')).toBeUndefined();
    });
  });

  describe('getPlayersInfo', () => {
    it('役職情報を含むプレイヤー情報を返す', () => {
      const playersInfo = playerManager.getPlayersInfo(true);

      Object.values(playersInfo).forEach((player) => {
        expect(player).toHaveProperty('userId');
        expect(player).toHaveProperty('status');
        expect(player).toHaveProperty('role');
        expect(player).not.toHaveProperty('userName');
        expect(player).not.toHaveProperty('teammates');
      });
    });

    it('役職情報を除外したプレイヤー情報を返す', () => {
      const playersInfo = playerManager.getPlayersInfo(false);

      Object.values(playersInfo).forEach((player) => {
        expect(player).toHaveProperty('userId');
        expect(player).toHaveProperty('status');
        expect(player).not.toHaveProperty('role');
        expect(player).not.toHaveProperty('userName');
        expect(player).not.toHaveProperty('teammates');
      });
    });
  });

  describe('getRandomTarget', () => {
    it('除外役職以外の生存プレイヤーからランダムに選択する', () => {
      const excludedRole = 'werewolf';
      const randomTarget = playerManager.getRandomTarget(excludedRole);

      expect(randomTarget).toBeDefined();
      expect(playerManager.players[randomTarget].role).not.toBe(excludedRole);
      expect(playerManager.players[randomTarget].status).toBe('alive');
    });

    it('除外役職を指定しない場合、全生存プレイヤーから選択する', () => {
      const randomTarget = playerManager.getRandomTarget();

      expect(randomTarget).toBeDefined();
      expect(playerManager.players[randomTarget].status).toBe('alive');
    });
  });

  describe('validatePlayerByRole', () => {
    it('正しい役職のプレイヤーでエラーをスローしない', () => {
      const userId = Object.entries(playerManager.players).find(
        ([_, player]) => player.role === 'villager',
      )?.[0];

      if (userId) {
        expect(() => {
          playerManager.validatePlayerByRole(userId, 'villager');
        }).not.toThrow();
      }
    });

    it('異なる役職のプレイヤーでエラーをスローする', () => {
      const userId = Object.entries(playerManager.players).find(
        ([_, player]) => player.role === 'villager',
      )?.[0];

      if (userId) {
        expect(() => {
          playerManager.validatePlayerByRole(userId, 'werewolf');
        }).toThrow(AppError);
      }
    });

    it('存在しないプレイヤーでエラーをスローする', () => {
      expect(() => {
        playerManager.validatePlayerByRole('nonexistent', 'villager');
      }).toThrow(AppError);
    });
  });

  describe('getUserRoleMap', () => {
    it('全プレイヤーの役職マップを返す', () => {
      const roleMap = playerManager.getUserRoleMap();

      Object.entries(roleMap).forEach(([userId, role]) => {
        expect(playerManager.players[userId].role).toBe(role);
      });
      expect(Object.keys(roleMap).length).toBe(mockUsers.length);
    });
  });

  describe('統合テスト', () => {
    it('プレイヤー作成から死亡までの一連の流れ', async () => {
      // 初期状態の確認
      expect(playerManager.players['user1'].status).toBe('alive');

      // プレイヤーを死亡させる
      await playerManager.kill('user1');

      // 死亡後の状態確認
      expect(playerManager.players['user1'].status).toBe('dead');

      // 生存プレイヤーの確認
      const livingPlayers = playerManager.getLivingPlayers();
      expect(livingPlayers.length).toBe(mockUsers.length - 1);
      expect(livingPlayers.find((p) => p.userId === 'user1')).toBeUndefined();

      // 役職別生存プレイヤーの確認
      const werewolves = playerManager.getLivingPlayers('werewolf');
      werewolves.forEach((player) => {
        expect(player.status).toBe('alive');
        expect(player.role).toBe('werewolf');
      });
    });
  });
});
