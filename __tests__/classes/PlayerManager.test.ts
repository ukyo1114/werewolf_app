jest.mock('../../src/app', () => ({
  appState: {
    channelManagers: {},
  },
}));

import { appState } from '../../src/app';
import ChannelManager from '../../src/classes/ChannelManager';
import ChannelUserManager from '../../src/classes/ChannelUserManager';
import { roleConfig, teammateMapping } from '../../src/config/roles';
import { mockGameId, mockUserId, mockUsers } from '../../__mocks__/mockdata';
import PlayerManager from '../../src/classes/PlayerManager';
import { gamePlayers, mockChannelUser } from '../../__mocks__/mockdata';
import { Role } from '../../src/config/types';

describe('test PlayserManager', () => {
  const { channelManagers } = appState;
  let playerManager: PlayerManager;

  beforeAll(() => {
    channelManagers[mockGameId] = new ChannelManager(mockGameId);
    channelManagers[mockGameId].users = mockChannelUser();

    playerManager = new PlayerManager(mockGameId, mockUsers);
  });

  it('test constructor', () => {
    const setTeammatesSpy = jest.spyOn(PlayerManager.prototype, 'setTeammates');
    const testPlayerManager = new PlayerManager(mockGameId, mockUsers);
    const validRoles = roleConfig[mockUsers.length];
    const { gameId, players } = testPlayerManager;

    expect(gameId).toBe(mockGameId);
    expect(setTeammatesSpy).toHaveBeenCalled();
    Object.values(players).forEach((player) => {
      expect(mockUsers.map((user) => user.userId)).toContain(player.userId);
      expect(mockUsers.map((user) => user.userName)).toContain(player.userName);
      expect(player.status).toBe('alive');
      expect(validRoles).toContain(player.role);
      player.role === 'werewolf' ||
      player.role === 'freemason' ||
      player.role === 'immoralist' ||
      player.role === 'fanatic'
        ? expect(player.teammates).not.toBeNull()
        : expect(player.teammates).toBeNull();
    });
  });

  it('test setTeammates', () => {
    playerManager.players = gamePlayers();
    playerManager.setTeammates();

    Object.values(playerManager.players).forEach((player) => {
      const role = player.role;

      if (role === 'werewolf') {
        expect(player.teammates).toEqual(['werewolf', 'werewolf2']);
      } else if (role === 'freemason') {
        expect(player.teammates).toEqual(['freemason']);
      } else if (role === 'immoralist') {
        expect(player.teammates).toEqual(['fox']);
      } else if (role === 'fanatic') {
        expect(player.teammates).toEqual(['werewolf', 'werewolf2']);
      } else {
        expect(player.teammates).toBeNull();
      }
    });
  });

  it('test kill', () => {
    const killSpy = jest.spyOn(ChannelUserManager.prototype, 'kill');
    killSpy.mockImplementation(() => {});

    playerManager.players = {
      [mockUserId]: {
        userId: mockUserId,
        userName: 'villager',
        status: 'alive',
        role: 'villager',
        teammates: null,
      },
    };

    playerManager.kill(mockUserId);
    expect(playerManager.players[mockUserId]?.status).toBe('dead');
    expect(killSpy).toHaveBeenCalled();

    killSpy.mockRestore();
  });

  describe('test getPlayserState', () => {
    beforeAll(() => {
      playerManager.players = gamePlayers();
      playerManager.setTeammates();
    });

    it('観戦者の場合', () => {
      const userId = 'notRegistered';
      const playerState = playerManager.getPlayerState(userId);

      expect(playerState).toEqual({
        status: 'spectator',
        role: 'spectator',
        teammates: null,
      });
    });

    it('参加プレイヤーの場合', () => {
      Object.values(gamePlayers).forEach((player) => {
        const userId = player.userId;
        const role = player.role;
        const teammates = teammateMapping[role];

        const playerState = playerManager.getPlayerState(userId);

        expect(playerState.status).toBe('alive');
        expect(playerState.role).toBe(role);
        expect(playerState.teammates).toEqual(teammates ? [teammates] : null);
      });
    });
  });

  describe('test getLivingPlayers', () => {
    beforeEach(() => {
      playerManager.players = gamePlayers();
      playerManager.setTeammates();
    });

    it('フィルターを指定しない場合', () => {
      const livingPlayers = playerManager.getLivingPlayers();

      livingPlayers.forEach((player) => {
        expect(player.status).toBe('alive');
      });

      Object.values(playerManager.players).forEach((player) => {
        player.status = 'dead';
      });

      const noLivingPlayers = playerManager.getLivingPlayers();
      expect(noLivingPlayers.length).toBe(0);
    });

    it('フィルターを指定した場合', () => {
      const livingPlayers = playerManager.getLivingPlayers('werewolf');

      expect(livingPlayers.length).toBe(2);
    });

    it('特定の役職の生存プレイヤーを取得できる', () => {
      const roles: Role[] = [
        'villager',
        'seer',
        'medium',
        'werewolf',
        'freemason',
      ];

      roles.forEach((role) => {
        const players = playerManager.getLivingPlayers(role);
        players.forEach((player) => {
          expect(player.status).toBe('alive');
          expect(player.role).toBe(role);
        });
      });
    });

    it('存在しない役職でフィルターした場合は空配列を返す', () => {
      const players = playerManager.getLivingPlayers('madman' as Role);
      expect(players).toEqual([]);
    });

    it('一部のプレイヤーが死亡した場合、正しくフィルターされる', () => {
      const targetUserId = Object.keys(playerManager.players)[0];
      playerManager.players[targetUserId].status = 'dead';

      const livingPlayers = playerManager.getLivingPlayers();
      expect(livingPlayers.length).toBe(
        Object.keys(playerManager.players).length - 1,
      );
      expect(
        livingPlayers.find((p) => p.userId === targetUserId),
      ).toBeUndefined();
    });

    it('特定の役職のプレイヤーが全員死亡した場合、空配列を返す', () => {
      const targetRole = 'werewolf';
      Object.values(playerManager.players).forEach((player) => {
        if (player.role === targetRole) {
          player.status = 'dead';
        }
      });

      const players = playerManager.getLivingPlayers(targetRole);
      expect(players).toEqual([]);
    });

    it('プレイヤーが存在しない場合、空配列を返す', () => {
      playerManager.players = {};
      const players = playerManager.getLivingPlayers();
      expect(players).toEqual([]);
    });

    it('返されるプレイヤーオブジェクトの構造が正しい', () => {
      const livingPlayers = playerManager.getLivingPlayers();

      livingPlayers.forEach((player) => {
        expect(player).toHaveProperty('userId');
        expect(player).toHaveProperty('userName');
        expect(player).toHaveProperty('status');
        expect(player).toHaveProperty('role');
        expect(player).toHaveProperty('teammates');
      });
    });
  });

  describe('test getPlayersInfo', () => {
    beforeEach(() => {
      playerManager.players = gamePlayers();
      playerManager.setTeammates();
    });

    it('ロールを含む場合', () => {
      const playersInfo = playerManager.getPlayersInfo(true);
      Object.values(playersInfo).forEach((player) => {
        expect(player).toHaveProperty('userId');
        expect(player).not.toHaveProperty('userName');
        expect(player).toHaveProperty('status');
        expect(player).not.toHaveProperty('teammates');
        expect(player).toHaveProperty('role');
      });
    });

    it('ロールを含まない場合', () => {
      const playersInfo = playerManager.getPlayersInfo(false);
      Object.values(playersInfo).forEach((player) => {
        expect(player).toHaveProperty('userId');
        expect(player).not.toHaveProperty('userName');
        expect(player).toHaveProperty('status');
        expect(player).not.toHaveProperty('teammates');
        expect(player).not.toHaveProperty('role');
      });
    });

    it('プレイヤーが存在しない場合、空オブジェクトを返す', () => {
      playerManager.players = {};
      const playersInfo = playerManager.getPlayersInfo(true);
      expect(playersInfo).toEqual({});
    });

    it('ロールを含む場合、全てのプレイヤーにロールが設定されている', () => {
      const playersInfo = playerManager.getPlayersInfo(true);
      Object.values(playersInfo).forEach((player) => {
        expect(player.role).toBeDefined();
        expect(typeof player.role).toBe('string');
      });
    });

    it('ロールを含まない場合、プレイヤー数が正しい', () => {
      const playersInfo = playerManager.getPlayersInfo(false);
      expect(Object.keys(playersInfo).length).toBe(
        Object.keys(playerManager.players).length,
      );
    });

    it('ロールを含む場合、プレイヤー数が正しい', () => {
      const playersInfo = playerManager.getPlayersInfo(true);
      expect(Object.keys(playersInfo).length).toBe(
        Object.keys(playerManager.players).length,
      );
    });

    it('返されるオブジェクトのキーが正しい', () => {
      const playersInfo = playerManager.getPlayersInfo(true);
      Object.keys(playersInfo).forEach((userId) => {
        expect(playerManager.players[userId]).toBeDefined();
      });
    });

    it('一部のプレイヤーが死亡した場合でも正しく情報を返す', () => {
      const targetUserId = Object.keys(playerManager.players)[0];
      playerManager.players[targetUserId].status = 'dead';

      const playersInfo = playerManager.getPlayersInfo(true);
      expect(playersInfo[targetUserId].status).toBe('dead');
    });

    it('返されるオブジェクトが元のオブジェクトを変更しない', () => {
      const originalPlayers = { ...playerManager.players };
      const playersInfo = playerManager.getPlayersInfo(true);

      Object.values(playersInfo).forEach((player) => {
        player.status = 'dead';
      });

      expect(playerManager.players).toEqual(originalPlayers);
    });

    it('全てのプレイヤーのステータスが正しく含まれている', () => {
      const playersInfo = playerManager.getPlayersInfo(true);
      Object.entries(playersInfo).forEach(([userId, player]) => {
        expect(player.status).toBe(playerManager.players[userId].status);
      });
    });

    it('ロールを含む場合、全てのプレイヤーのロールが正しく含まれている', () => {
      const playersInfo = playerManager.getPlayersInfo(true);
      Object.entries(playersInfo).forEach(([userId, player]) => {
        expect(player.role).toBe(playerManager.players[userId].role);
      });
    });
  });

  describe('test getRandomTarget', () => {
    beforeEach(() => {
      playerManager.players = gamePlayers();
    });

    it('指定された役職のプレイヤーは選択されない', () => {
      const targetRole = 'seer';
      const iterations = 1000;
      const selectedTargets = new Set();

      for (let i = 0; i < iterations; i++) {
        const randomTarget = playerManager.getRandomTarget(targetRole);
        expect(playerManager.players[randomTarget].role).not.toBe(targetRole);
        selectedTargets.add(randomTarget);
      }

      // ランダム性の確認
      expect(selectedTargets.size).toBeGreaterThan(1);
    });

    it('プレイヤーが存在しない場合、エラーを投げる', () => {
      playerManager.players = {};
      expect(() => playerManager.getRandomTarget('seer')).toThrow();
    });

    it('指定された役職のプレイヤーしかいない場合、エラーを投げる', () => {
      // 全てのプレイヤーを同じ役職に設定
      Object.values(playerManager.players).forEach((player) => {
        player.role = 'seer';
      });

      expect(() => playerManager.getRandomTarget('seer')).toThrow();
    });

    it('返されるターゲットが有効なプレイヤーIDである', () => {
      const randomTarget = playerManager.getRandomTarget('seer');
      expect(playerManager.players[randomTarget]).toBeDefined();
      expect(typeof randomTarget).toBe('string');
    });

    it('生存プレイヤーの中から選択される', () => {
      // 一部のプレイヤーを死亡させる
      const targetUserId = Object.keys(playerManager.players)[0];
      playerManager.players[targetUserId].status = 'dead';

      const iterations = 1000;
      for (let i = 0; i < iterations; i++) {
        const randomTarget = playerManager.getRandomTarget('seer');
        expect(playerManager.players[randomTarget].status).toBe('alive');
      }
    });

    it('選択の分布が偏りすぎていない', () => {
      const targetRole = 'seer';
      const iterations = 1000;
      const selectionCount: { [key: string]: number } = {};

      // 選択回数をカウント
      for (let i = 0; i < iterations; i++) {
        const randomTarget = playerManager.getRandomTarget(targetRole);
        selectionCount[randomTarget] = (selectionCount[randomTarget] || 0) + 1;
      }

      // 選択されたプレイヤーの数
      const selectedPlayers = Object.keys(selectionCount).length;
      // 期待される選択回数（均等に選択された場合）
      const expectedCount = iterations / selectedPlayers;
      // 許容される偏差（20%）
      const allowedDeviation = expectedCount * 0.2;

      // 各プレイヤーの選択回数が期待値から大きく外れていないことを確認
      Object.values(selectionCount).forEach((count) => {
        expect(Math.abs(count - expectedCount)).toBeLessThan(allowedDeviation);
      });
    });
  });

  describe('test validatePlayerByRole', () => {
    beforeEach(() => {
      playerManager.players = gamePlayers();
    });

    it('存在するプレイヤーで正しい役職の場合、エラーを投げない', () => {
      expect(() => {
        playerManager.validatePlayerByRole('villager', 'villager');
      }).not.toThrow();
    });

    it('存在しないプレイヤーの場合、エラーを投げる', () => {
      expect(() => {
        playerManager.validatePlayerByRole('notExist', 'villager');
      }).toThrow();
    });

    it('役職が一致しない場合、エラーを投げる', () => {
      expect(() => {
        playerManager.validatePlayerByRole('villager', 'werewolf');
      }).toThrow();
    });

    it('全ての役職で正しく動作する', () => {
      const roles: Role[] = [
        'villager',
        'seer',
        'medium',
        'hunter',
        'werewolf',
        'freemason',
        'fanatic',
        'fox',
        'immoralist',
      ];

      roles.forEach((role) => {
        const playerId = Object.entries(playerManager.players).find(
          ([_, player]) => player.role === role,
        )?.[0];
        if (playerId) {
          expect(() => {
            playerManager.validatePlayerByRole(playerId, role);
          }).not.toThrow();
        }
      });
    });
  });
});
