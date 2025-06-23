jest.mock('../../src/app', () => ({
  appState: {
    channelManagers: {},
  },
}));

import { appState } from '../../src/app';
import ChannelManager from '../../src/classes/ChannelManager';
import ChannelUserManager from '../../src/classes/ChannelUserManager';
import GameUser from '../../src/models/GameUser';
import { roleConfig, teammateMapping } from '../../src/config/roles';
import { mockGameId, mockUserId, mockUsers } from '../../__mocks__/mockdata';
import PlayerManager from '../../src/classes/PlayerManager';
import { gamePlayers, mockChannelUser } from '../../__mocks__/mockdata';
import { Role } from '../../src/config/types';

describe('test PlayserManager', () => {
  GameUser.updateOne = jest.fn();
  const { channelManagers } = appState;
  let playerManager: PlayerManager;

  beforeAll(() => {
    channelManagers[mockGameId] = new ChannelManager(mockGameId);
    channelManagers[mockGameId].users = mockChannelUser();

    playerManager = new PlayerManager(mockGameId, mockUsers);
  });

  afterAll(() => {
    jest.clearAllMocks();
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
        : expect(player.teammates).toEqual([]);
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
        expect(player.teammates).toEqual([]);
      }
    });
  });

  it('test kill', async () => {
    const killSpy = jest.spyOn(ChannelUserManager.prototype, 'kill');
    killSpy.mockImplementation();

    playerManager.players = {
      [mockUserId]: {
        userId: mockUserId,
        userName: 'villager',
        status: 'alive',
        role: 'villager',
        teammates: [],
      },
    };

    await playerManager.kill(mockUserId);
    expect(playerManager.players[mockUserId]?.status).toBe('dead');
    expect(killSpy).toHaveBeenCalled();
    expect(GameUser.updateOne).toHaveBeenCalledWith(
      { gameId: mockGameId, userId: mockUserId },
      { isPlaying: false },
    );

    killSpy.mockRestore();
  });

  describe('test getPlayserState', () => {
    beforeAll(() => {
      playerManager.players = gamePlayers();
      playerManager.setTeammates();
    });

    it('should return spectator state for non-registered users', () => {
      const userId = 'notRegistered';
      const playerState = playerManager.getPlayerState(userId);

      expect(playerState).toEqual({
        status: 'spectator',
        role: 'spectator',
        teammates: [],
      });
    });

    it('should return correct state for registered players', () => {
      Object.values(gamePlayers).forEach((player) => {
        const userId = player.userId;
        const role = player.role;
        const teammates = teammateMapping[role];

        const playerState = playerManager.getPlayerState(userId);

        expect(playerState.status).toBe('alive');
        expect(playerState.role).toBe(role);
        expect(playerState.teammates).toEqual([teammates]);
      });
    });
  });

  describe('test getLivingPlayers', () => {
    beforeEach(() => {
      playerManager.players = gamePlayers();
      playerManager.setTeammates();
    });

    it('should return all living players when no filter is specified', () => {
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

    it('should filter players by specified role', () => {
      const livingPlayers = playerManager.getLivingPlayers('werewolf');

      expect(livingPlayers.length).toBe(2);
    });

    it('should return living players of specific roles', () => {
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

    it('should return empty array for non-existent role', () => {
      const players = playerManager.getLivingPlayers('madman' as Role);
      expect(players).toEqual([]);
    });

    it('should correctly filter when some players are dead', () => {
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

    it('should return empty array when all players of a role are dead', () => {
      const targetRole = 'werewolf';
      Object.values(playerManager.players).forEach((player) => {
        if (player.role === targetRole) {
          player.status = 'dead';
        }
      });

      const players = playerManager.getLivingPlayers(targetRole);
      expect(players).toEqual([]);
    });

    it('should return empty array when no players exist', () => {
      playerManager.players = {};
      const players = playerManager.getLivingPlayers();
      expect(players).toEqual([]);
    });

    it('should return player objects with correct structure', () => {
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

    it('should include role information when requested', () => {
      const playersInfo = playerManager.getPlayersInfo(true);
      Object.values(playersInfo).forEach((player) => {
        expect(player).toHaveProperty('userId');
        expect(player).not.toHaveProperty('userName');
        expect(player).toHaveProperty('status');
        expect(player).not.toHaveProperty('teammates');
        expect(player).toHaveProperty('role');
      });
    });

    it('should exclude role information when not requested', () => {
      const playersInfo = playerManager.getPlayersInfo(false);
      Object.values(playersInfo).forEach((player) => {
        expect(player).toHaveProperty('userId');
        expect(player).not.toHaveProperty('userName');
        expect(player).toHaveProperty('status');
        expect(player).not.toHaveProperty('teammates');
        expect(player).not.toHaveProperty('role');
      });
    });

    it('should return empty object when no players exist', () => {
      playerManager.players = {};
      const playersInfo = playerManager.getPlayersInfo(true);
      expect(playersInfo).toEqual({});
    });

    it('should set role for all players when including roles', () => {
      const playersInfo = playerManager.getPlayersInfo(true);
      Object.values(playersInfo).forEach((player) => {
        expect(player.role).toBeDefined();
        expect(typeof player.role).toBe('string');
      });
    });

    it('should return correct number of players when excluding roles', () => {
      const playersInfo = playerManager.getPlayersInfo(false);
      expect(Object.keys(playersInfo).length).toBe(
        Object.keys(playerManager.players).length,
      );
    });

    it('should return correct number of players when including roles', () => {
      const playersInfo = playerManager.getPlayersInfo(true);
      expect(Object.keys(playersInfo).length).toBe(
        Object.keys(playerManager.players).length,
      );
    });

    it('should return object with correct player keys', () => {
      const playersInfo = playerManager.getPlayersInfo(true);
      Object.keys(playersInfo).forEach((userId) => {
        expect(playerManager.players[userId]).toBeDefined();
      });
    });

    it('should return correct information when some players are dead', () => {
      const targetUserId = Object.keys(playerManager.players)[0];
      playerManager.players[targetUserId].status = 'dead';

      const playersInfo = playerManager.getPlayersInfo(true);
      expect(playersInfo[targetUserId].status).toBe('dead');
    });

    it('should not modify original player objects', () => {
      const originalPlayers = { ...playerManager.players };
      const playersInfo = playerManager.getPlayersInfo(true);

      Object.values(playersInfo).forEach((player) => {
        player.status = 'dead';
      });

      expect(playerManager.players).toEqual(originalPlayers);
    });

    it('should include correct status for all players', () => {
      const playersInfo = playerManager.getPlayersInfo(true);
      Object.entries(playersInfo).forEach(([userId, player]) => {
        expect(player.status).toBe(playerManager.players[userId].status);
      });
    });

    it('should include correct roles for all players when requested', () => {
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

    it('should not select players of specified role', () => {
      const targetRole = 'seer';
      const iterations = 1000;
      const selectedTargets = new Set();

      for (let i = 0; i < iterations; i++) {
        const randomTarget = playerManager.getRandomTarget(
          targetRole,
        ) as string;
        expect(playerManager.players[randomTarget].role).not.toBe(targetRole);
        selectedTargets.add(randomTarget);
      }

      expect(selectedTargets.size).toBeGreaterThan(1);
    });

    it('should throw error when no players exist', () => {
      playerManager.players = {};
      expect(playerManager.getRandomTarget('seer')).toBeUndefined();
    });

    it('should throw error when all players have specified role', () => {
      Object.values(playerManager.players).forEach((player) => {
        player.role = 'seer';
      });

      expect(playerManager.getRandomTarget('seer')).toBeUndefined();
    });

    it('should return valid player ID', () => {
      const randomTarget = playerManager.getRandomTarget('seer') as string;
      expect(playerManager.players[randomTarget]).toBeDefined();
      expect(typeof randomTarget).toBe('string');
    });

    it('should select only from living players', () => {
      const targetUserId = Object.keys(playerManager.players)[0];
      playerManager.players[targetUserId].status = 'dead';

      const iterations = 1000;
      for (let i = 0; i < iterations; i++) {
        const randomTarget = playerManager.getRandomTarget('seer') as string;
        expect(playerManager.players[randomTarget].status).toBe('alive');
      }
    });

    it('should maintain reasonable distribution in selection', () => {
      const targetRole = 'seer';
      const iterations = 10000;
      const selectionCount: { [key: string]: number } = {};

      for (let i = 0; i < iterations; i++) {
        const randomTarget = playerManager.getRandomTarget(
          targetRole,
        ) as string;
        selectionCount[randomTarget] = (selectionCount[randomTarget] || 0) + 1;
      }

      const selectedPlayers = Object.keys(selectionCount).length;
      const expectedCount = iterations / selectedPlayers;
      const allowedDeviation = expectedCount * 0.2;

      Object.values(selectionCount).forEach((count) => {
        expect(Math.abs(count - expectedCount)).toBeLessThan(allowedDeviation);
      });
    });
  });

  describe('test validatePlayerByRole', () => {
    beforeEach(() => {
      playerManager.players = gamePlayers();
    });

    it('should not throw error for valid player and role', () => {
      expect(() => {
        playerManager.validatePlayerByRole('villager', 'villager');
      }).not.toThrow();
    });

    it('should throw error for non-existent player', () => {
      expect(() => {
        playerManager.validatePlayerByRole('notExist', 'villager');
      }).toThrow();
    });

    it('should throw error for mismatched role', () => {
      expect(() => {
        playerManager.validatePlayerByRole('villager', 'werewolf');
      }).toThrow();
    });

    it('should work correctly for all roles', () => {
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
