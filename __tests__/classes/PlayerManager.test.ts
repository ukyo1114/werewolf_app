import { gameManagers } from '../../jest.setup';
import GameUser from '../../src/models/gameUserModel';
import GameManager from '../../src/classes/GameManager';
import { roleConfig } from '../../src/config/roles';
import {
  mockChannelId,
  mockGameId,
  mockUserId,
  mockUsers,
} from '../../jest.setup';
import PlayerManager from '../../src/classes/PlayerManager';
import { gamePlayers } from '../../__mocks__/mockdata';
import { Role } from '../../src/config/types';

let playerManager: PlayerManager;

beforeAll(() => {
  playerManager = new PlayerManager(mockGameId, mockUsers);

  gameManagers[mockGameId] = new GameManager(
    mockChannelId,
    mockGameId,
    mockUsers,
  );
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
  it('test constructor', () => {
    const validRoles = roleConfig[mockUsers.length];
    const { gameId, players } = playerManager;

    expect(gameId).toBe(mockGameId);
    mockUsers.forEach((user) => {
      const userId = user.userId;
      const player = players[userId];

      expect(player.userId).toBe(userId);
      expect(player.userName).toBe(user.userName);
      expect(player.status).toBe('alive');
      expect(player.teammates).toBeDefined;
      expect(validRoles).toContain(player.role);
    });
  });

  it('test setTeammates', () => {
    playerManager.players = gamePlayers;

    playerManager.setTeammates();
    expect(playerManager.players.villager.teammates).toBeNull;
    expect(playerManager.players.seer.teammates).toBeNull;
    expect(playerManager.players.medium.teammates).toBeNull;
    expect(playerManager.players.hunter.teammates).toBeNull;
    expect(playerManager.players.fox.teammates).toBeNull;
    expect(playerManager.players.werewolf.teammates).toEqual(['werewolf']);
    expect(playerManager.players.freemason.teammates).toEqual(['freemason']);
    expect(playerManager.players.immoralist.teammates).toEqual(['fox']);
    expect(playerManager.players.fanatic.teammates).toEqual(['werewolf']);
  });

  it('test registerPlayersInDB', async () => {
    playerManager.players = {
      [mockUserId]: {
        userId: mockUserId,
        userName: 'villager',
        status: 'alive',
        role: 'villager',
        teammates: null,
      },
    };
    await playerManager.registerPlayersInDB();

    const userExists = await GameUser.exists({
      gameId: mockGameId,
      userId: mockUserId,
    });
    expect(userExists).not.toBeNull;
  });

  describe('test getPlayserState', () => {
    beforeAll(() => {
      playerManager.players = gamePlayers;
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
      const teammateMapping: Record<string, string> = {
        werewolf: 'werewolf',
        freemason: 'freemason',
        immoralist: 'fox',
        fanatic: 'werewolf',
      };

      Object.values(gamePlayers).forEach((player) => {
        const userId = player.userId;
        const role = playerManager.players[userId].role;
        const teammates = teammateMapping[role];

        const playerState = playerManager.getPlayerState(userId);

        expect(playerState.status).toBe('alive');
        expect(playerState.role).toBe(role);
        expect(playerState.teammates).toEqual(teammates ? [teammates] : null);
      });
    });
  });

  describe('test findPlayerByRole', () => {
    it('プレイヤーが存在しない場合エラーになる', () => {
      expect(() => playerManager.findPlayerByRole('madman')).toThrow();
    });

    it('プレイヤー情報を取得できる', () => {
      const roles: Role[] = ['villager', 'seer', 'medium', 'werewolf'];

      roles.forEach((role) => {
        const player = playerManager.findPlayerByRole(role);

        expect(player).toHaveProperty('userId');
        expect(player).toHaveProperty('userName');
        expect(player).toHaveProperty('status');
        expect(player).toHaveProperty('role');
        expect(player).toHaveProperty('teammates');
      });
    });
  });

  it('test getImmoralists', () => {
    const players = playerManager.getImmoralists();
    players.forEach((player) => expect(player.role).toBe('immoralist'));
  });

  it('test getLivingPlayers', () => {
    const players = playerManager.getLivingPlayers();
    players.forEach((player) => expect(player.status).toBe('alive'));
  });

  it('test getPlayersWithRole', () => {
    const players = playerManager.getPlayersWithRole();

    Object.values(players).forEach((player) => {
      expect(player).toHaveProperty('userId');
      expect(player).toHaveProperty('status');
      expect(player).toHaveProperty('role');
      expect(player).not.toHaveProperty('userName');
      expect(player).not.toHaveProperty('teammates');
    });
  });

  it('test getPlayersWithoutRole', () => {
    const players = playerManager.getPlayersWithoutRole();

    Object.values(players).forEach((player) => {
      expect(player).toHaveProperty('userId');
      expect(player).toHaveProperty('status');
      expect(player).not.toHaveProperty('role');
      expect(player).not.toHaveProperty('userName');
      expect(player).not.toHaveProperty('teammates');
    });
  });

  it('test getRandomTarget', () => {
    for (let i = 0; i < 1000; i++) {
      const randomTarget = playerManager.getRandomTarget('seer');
      expect(playerManager.players[randomTarget].role).not.toBe('seer');
    }
  });
});
