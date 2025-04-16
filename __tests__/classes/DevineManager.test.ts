import { gameManagers } from '../../jest.setup';
import GameManager from '../../src/classes/GameManager';
import { mockChannelId, mockGameId, mockUsers } from '../../__mocks__/mockdata';
import { gamePlayers } from '../../__mocks__/mockdata';

describe('test DevineManager', () => {
  beforeAll(() => {
    gameManagers[mockGameId] = new GameManager(
      mockChannelId,
      mockGameId,
      mockUsers,
    );
    gameManagers[mockGameId].sendMessage = jest.fn();
  });

  beforeEach(() => {
    const game = gameManagers[mockGameId];
    game.playerManager.players = structuredClone(gamePlayers);
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

      game.devineManager.receiveDevineRequest('seer', 'villager');
      expect(game.devineManager.devineRequest).toBe('villager');
    });

    it('nightフェーズでないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'day';

      expect(() =>
        game.attackManager.receiveAttackRequest('seer', 'villager'),
      ).toThrow();
    });

    it('リクエストを送信したプレイヤーが死亡しているときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';
      game.playerManager.players.seer.status = 'dead';

      expect(() =>
        game.attackManager.receiveAttackRequest('seer', 'villager'),
      ).toThrow();
    });

    it('リクエストを送信したプレイヤーが占い師でないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';

      expect(() =>
        game.attackManager.receiveAttackRequest('villager', 'villager'),
      ).toThrow();
    });

    it('ターゲットが死亡しているときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';
      game.playerManager.players.villager.status = 'dead';

      expect(game.playerManager.players.villager.status).not.toBe('alive');
      expect(() =>
        game.attackManager.receiveAttackRequest('seer', 'villager'),
      ).toThrow();
    });

    it('ターゲットが占い師のときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';

      expect(() =>
        game.attackManager.receiveAttackRequest('seer', 'seer'),
      ).toThrow();
    });

    it('リクエストを送信したプレイヤーが存在しないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';

      expect(() =>
        game.attackManager.receiveAttackRequest('notExist', 'villager'),
      ).toThrow();
    });

    it('ターゲットが存在しないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';

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
      game.devineManager.devineRequest = null;

      const devineTarget = game.devineManager.decideDevineTarget();
      expect(devineTarget).toBeDefined();
    });
  });

  describe('devine', () => {
    it('占いが行われる', () => {
      const game = gameManagers[mockGameId];
      game.devineManager.devineRequest = 'villager';

      expect(game.devineManager.devine()).toBe(false);
      expect(game.devineManager.devineRequest).toBe(null);
      expect(game.devineManager.devineResult[0]).toEqual({
        villager: 'villagers',
      });
    });

    it('妖狐を占ったとき', () => {
      const game = gameManagers[mockGameId];
      game.devineManager.devineRequest = 'fox';

      expect(game.devineManager.devine()).toBe(true);
      expect(game.devineManager.devineRequest).toBe(null);
      expect(game.devineManager.devineResult[0]).toEqual({
        fox: 'villagers',
      });
    });

    it('占い師が死亡しているとき', () => {
      const game = gameManagers[mockGameId];
      game.devineManager.devineResult = {};
      game.playerManager.players.seer.status = 'dead';
      game.devineManager.devineRequest = 'villager';

      expect(game.devineManager.devine()).toBe(false);
      expect(game.devineManager.devineRequest).toBe(null);
      expect(game.devineManager.devineResult).not.toHaveProperty('0');
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
      expect(() => game.devineManager.getDevineResult('villager')).toThrow();
    });

    it('プレイヤーが存在しないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      expect(() => game.devineManager.getDevineResult('notExist')).toThrow();
    });
  });
});
