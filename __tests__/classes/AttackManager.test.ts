import { gameManagers } from '../../jest.setup';
import GameManager from '../../src/classes/GameManager';
import { mockChannelId, mockGameId, mockUsers } from '../../__mocks__/mockdata';
import { gamePlayers } from '../../__mocks__/mockdata';

describe('test AttackManager', () => {
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

  describe('recieveAttackRequest', () => {
    it('リクエストが受け付けられる', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';

      game.attackManager.receiveAttackRequest('werewolf', 'villager');
      expect(game.attackManager.attackRequest).toBe('villager');
    });

    it('nightフェーズでないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'day';

      expect(() =>
        game.attackManager.receiveAttackRequest('werewolf', 'villager'),
      ).toThrow();
    });

    it('リクエストを送信したプレイヤーが死亡しているときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';
      game.playerManager.players.werewolf.status = 'dead';

      expect(() =>
        game.attackManager.receiveAttackRequest('werewolf', 'villager'),
      ).toThrow();
    });

    it('リクエストを送信したプレイヤーが人狼でないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';

      expect(() =>
        game.attackManager.receiveAttackRequest('seer', 'villager'),
      ).toThrow();
    });

    it('ターゲットが死亡しているときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';
      game.playerManager.players.villager.status = 'dead';

      expect(() =>
        game.attackManager.receiveAttackRequest('werewolf', 'villager'),
      ).toThrow();
    });

    it('ターゲットが人狼のときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';

      expect(() =>
        game.attackManager.receiveAttackRequest('werewolf', 'werewolf'),
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

  describe('decideAttackTarget', () => {
    it('リクエストが存在するとき', () => {
      const game = gameManagers[mockGameId];
      game.attackManager.attackRequest = 'testRequest';
      const attackRequest = game.attackManager.decideAttackTarget();

      expect(game.attackManager.attackRequest).toBeNull();
      expect(attackRequest).toBe('testRequest');
    });

    it('リクエストが存在しないとき', () => {
      const game = gameManagers[mockGameId];
      game.attackManager.attackRequest = null;

      const attackTarget = game.attackManager.decideAttackTarget();
      expect(attackTarget).toBeDefined();
    });
  });

  describe('attack', () => {
    it('襲撃が行われる', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';

      game.attackManager.attackRequest = 'villager';
      game.guardManager.guard = jest.fn().mockReturnValue(false);

      const attackTarget = game.attackManager.attack();

      expect(attackTarget).toBe('villager');
      expect(game.playerManager.players.villager.status).toBe('dead');
      expect(game.attackManager.attackRequest).toBeNull();
      expect(game.attackManager.attackHistory).toEqual({ 0: 'villager' });
    });

    it('護衛成功時の処理が正しく行われる', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';

      game.guardManager.guard = jest.fn().mockReturnValue(true);

      game.attackManager.attackRequest = 'villager';
      const attackTarget = game.attackManager.attack();

      expect(attackTarget).toBe(null);
      expect(game.playerManager.players.villager.status).toBe('alive');
      expect(game.attackManager.attackRequest).toBeNull();
      expect(game.attackManager.attackHistory).toEqual({ 0: 'villager' });
    });

    it('襲撃対象が狐だった場合襲撃が失敗する', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';

      game.guardManager.guard = jest.fn().mockReturnValue(false);

      game.attackManager.attackRequest = 'fox';
      const attackTarget = game.attackManager.attack();

      expect(attackTarget).toBe(null);
      expect(game.playerManager.players.fox.status).toBe('alive');
      expect(game.attackManager.attackRequest).toBe(null);
      expect(game.attackManager.attackHistory).toEqual({ 0: 'fox' });
    });

    it('狩人が死亡している場合護衛が実行されない', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';
      game.playerManager.players.hunter.status = 'dead';

      game.guardManager.guard = jest.fn().mockReturnValue(true);

      game.attackManager.attackRequest = 'villager';
      const attackTarget = game.attackManager.attack();

      expect(attackTarget).toBe('villager');
      expect(game.playerManager.players.villager.status).toBe('dead');
      expect(game.attackManager.attackRequest).toBeNull();
      expect(game.attackManager.attackHistory).toEqual({ 0: 'villager' });
    });
  });

  describe('getAttackHistory', () => {
    it('襲撃履歴を取得できる', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'day';

      game.attackManager.attackHistory = { 1: 'villager' };

      const attackHistory = game.attackManager.getAttackHistory('werewolf');
      expect(attackHistory).toEqual({ 1: 'villager' });
    });

    it('プレイヤーが人狼でないときエラーを返す', () => {
      const game = gameManagers[mockGameId];

      expect(game.playerManager.players.villager).toBeDefined();
      expect(() => game.attackManager.getAttackHistory('villager')).toThrow();
    });

    it('プレイヤーが存在しないときエラーを返す', () => {
      const game = gameManagers[mockGameId];

      expect(() => game.attackManager.getAttackHistory('notExist')).toThrow();
    });
  });
});
