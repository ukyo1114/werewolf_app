import { gameManagers } from '../../jest.setup';
import GameManager from '../../src/classes/GameManager';
import { mockChannelId, mockGameId, mockUsers } from '../../jest.setup';

describe('test DevineManager', () => {
  beforeAll(() => {
    gameManagers[mockGameId] = new GameManager(
      mockChannelId,
      mockGameId,
      mockUsers,
    );
    gameManagers[mockGameId].sendMessage = jest.fn();
  });

  afterAll(() => {
    const timerId = gameManagers[mockGameId]?.phaseManager.timerId;
    if (timerId) clearTimeout(timerId);

    delete gameManagers[mockGameId];
    jest.restoreAllMocks();
  });

  describe('recieveDevineRequest', () => {
    it('リクエストが受け付けられる', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';
      game.playerManager.players = {
        seer: {
          userId: 'seer',
          userName: 'seer',
          status: 'alive',
          role: 'seer',
        },
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'alive',
          role: 'villager',
        },
      };

      expect(game.phaseManager.currentPhase).toBe('night');
      game.devineManager.receiveDevineRequest('seer', 'villager');
      expect(game.devineManager.devineRequest).toBe('villager');
    });

    it('nightフェーズでないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'day';

      expect(game.phaseManager.currentPhase).not.toBe('night');
      expect(() =>
        game.attackManager.receiveAttackRequest('seer', 'villager'),
      ).toThrow();
    });

    it('リクエストを送信したプレイヤーが死亡しているときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';
      game.playerManager.players = {
        seer: {
          userId: 'seer',
          userName: 'seer',
          status: 'dead',
          role: 'seer',
        },
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'alive',
          role: 'villager',
        },
      };

      expect(game.phaseManager.currentPhase).toBe('night');
      expect(() =>
        game.attackManager.receiveAttackRequest('seer', 'villager'),
      ).toThrow();
    });

    it('リクエストを送信したプレイヤーが占い師でないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.playerManager.players = {
        seer: {
          userId: 'seer',
          userName: 'seer',
          status: 'alive',
          role: 'seer',
        },
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'alive',
          role: 'villager',
        },
      };

      expect(game.phaseManager.currentPhase).toBe('night');
      expect(() =>
        game.attackManager.receiveAttackRequest('villager', 'villager'),
      ).toThrow();
    });

    it('ターゲットが死亡しているときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.playerManager.players = {
        seer: {
          userId: 'seer',
          userName: 'seer',
          status: 'alive',
          role: 'seer',
        },
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'dead',
          role: 'villager',
        },
      };

      expect(game.phaseManager.currentPhase).toBe('night');
      expect(game.playerManager.players.villager.status).not.toBe('alive');
      expect(() =>
        game.attackManager.receiveAttackRequest('seer', 'villager'),
      ).toThrow();
    });

    it('ターゲットが占い師のときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.playerManager.players = {
        seer: {
          userId: 'seer',
          userName: 'seer',
          status: 'alive',
          role: 'seer',
        },
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'alive',
          role: 'villager',
        },
      };

      expect(game.phaseManager.currentPhase).toBe('night');
      expect(() =>
        game.attackManager.receiveAttackRequest('seer', 'seer'),
      ).toThrow();
    });

    it('リクエストを送信したプレイヤーが存在しないときエラーを返す', () => {
      const game = gameManagers[mockGameId];

      expect(game.phaseManager.currentPhase).toBe('night');
      expect(() =>
        game.attackManager.receiveAttackRequest('notExist', 'villager'),
      ).toThrow();
    });

    it('ターゲットが存在しないときエラーを返す', () => {
      const game = gameManagers[mockGameId];

      expect(game.phaseManager.currentPhase).toBe('night');
      expect(() =>
        game.attackManager.receiveAttackRequest('werewolf', 'notExist'),
      ).toThrow();
    });
  });

  describe('decideDevineTarget', () => {
    it('リクエストが存在するとき', () => {
      const game = gameManagers[mockGameId];
      game.devineManager.devineRequest = 'testRequest';
      const devineTarget = game.devineManager.decideDevineTarget();
      expect(devineTarget).toBe('testRequest');
    });

    it('リクエストが存在しないとき', () => {
      const game = gameManagers[mockGameId];
      game.playerManager.players = {
        seer: {
          userId: 'seer',
          userName: 'seer',
          status: 'alive',
          role: 'seer',
        },
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'alive',
          role: 'villager',
        },
      };
      game.devineManager.devineRequest = null;

      const devineTarget = game.devineManager.decideDevineTarget();
      expect(devineTarget).toBe('villager');
    });
  });

  describe('devine', () => {
    it('占いが行われる', () => {
      const game = gameManagers[mockGameId];
      game.devineManager.devineRequest = 'villager';

      expect(game.devineManager.devine()).toBe('villager');
      expect(game.devineManager.devineRequest).toBeNull;
      expect(game.devineManager.devineResult[0]).toEqual({
        villager: 'villagers',
      });
    });
  });

  describe('getDevineResult', () => {
    it('占い結果が正しい形式で返されること', () => {
      const game = gameManagers[mockGameId];
      game.devineManager.devineResult = { 0: { villager: 'villagers' } };

      const devineResult = game.devineManager.getDevineResult('seer');
      expect(devineResult).toEqual({
        0: { villager: 'villagers' },
      });
    });

    it('プレイヤーが占いでないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      expect(game.playerManager.players.villager).toBeDefined();
      expect(() => game.devineManager.getDevineResult('villager')).toThrow();
    });

    it('プレイヤーが存在しないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      expect(game.playerManager.players.notExist).toBeUndefined();
      expect(() => game.devineManager.getDevineResult('notExist')).toThrow();
    });
  });
});
