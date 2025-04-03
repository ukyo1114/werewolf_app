jest.mock('../../src/app', () => ({
  appState: { gameManagers: {} },
}));
import GameManager from '../../src/classes/GameManager';
import AppError from '../../src/utils/AppError';
import { gameError } from '../../src/config/messages';
import { mockChannelId, mockGameId, mockUsers } from '../../jest.setup';
import { appState } from '../../src/app';

const { gameManagers } = appState;

describe('test GuardManager', () => {
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

  describe('recieveGuardRequest', () => {
    it('リクエストが受け付けられる', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';
      game.playerManager.players = {
        hunter: {
          userId: 'hunter',
          userName: 'hunter',
          status: 'alive',
          role: 'hunter',
        },
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'alive',
          role: 'villager',
        },
      };

      expect(game.phaseManager.currentPhase).toBe('night');
      game.guardManager.receiveGuradRequest('hunter', 'villager');
      expect(game.guardManager.guardRequest).toBe('villager');
    });

    it('nightフェーズでないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'day';

      expect(game.phaseManager.currentPhase).not.toBe('night');
      expect(() =>
        game.attackManager.receiveAttackRequest('hunter', 'villager'),
      ).toThrow();
    });

    it('リクエストを送信したプレイヤーが死亡しているときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.phaseManager.currentPhase = 'night';
      game.playerManager.players = {
        hunter: {
          userId: 'hunter',
          userName: 'hunter',
          status: 'dead',
          role: 'hunter',
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
        game.attackManager.receiveAttackRequest('hunter', 'villager'),
      ).toThrow();
    });

    it('リクエストを送信したプレイヤーが狩人でないときエラーを返す', () => {
      const game = gameManagers[mockGameId];

      expect(game.phaseManager.currentPhase).toBe('night');
      expect(() =>
        game.attackManager.receiveAttackRequest('villager', 'villager'),
      ).toThrow();
    });

    it('ターゲットが死亡しているときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.playerManager.players = {
        hunter: {
          userId: 'hunter',
          userName: 'hunter',
          status: 'alive',
          role: 'hunter',
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
        game.attackManager.receiveAttackRequest('hunter', 'villager'),
      ).toThrow();
    });

    it('ターゲットが狩人のときエラーを返す', () => {
      const game = gameManagers[mockGameId];

      expect(game.phaseManager.currentPhase).toBe('night');
      expect(() =>
        game.attackManager.receiveAttackRequest('hunter', 'hunter'),
      ).toThrow();
    });

    it('リクエストを送信したプレイヤーが存在しないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      game.playerManager.players = {
        hunter: {
          userId: 'hunter',
          userName: 'hunter',
          status: 'alive',
          role: 'hunter',
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
        game.attackManager.receiveAttackRequest('notExist', 'villager'),
      ).toThrow();
    });

    it('ターゲットが存在しないときエラーを返す', () => {
      const game = gameManagers[mockGameId];

      expect(game.phaseManager.currentPhase).toBe('night');
      expect(() =>
        game.attackManager.receiveAttackRequest('hunter', 'notExist'),
      ).toThrow();
    });
  });

  describe('decideGuardTarget', () => {
    it('リクエストが存在するとき', () => {
      const game = gameManagers[mockGameId];
      game.guardManager.guardRequest = 'testRequest';
      const guardTarget = game.guardManager.decideGuardTarget();

      expect(guardTarget).toBe('testRequest');
      expect(game.guardManager.guardRequest).toBeNull;
      expect(game.guardManager.guardHistory[0]).toBe('testRequest');
    });

    it('リクエストが存在しないとき', () => {
      const game = gameManagers[mockGameId];
      game.playerManager.players = {
        hunter: {
          userId: 'hunter',
          userName: 'hunter',
          status: 'alive',
          role: 'hunter',
        },
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'alive',
          role: 'villager',
        },
      };
      game.guardManager.guardRequest = null;

      const devineTarget = game.guardManager.decideGuardTarget();
      expect(devineTarget).toBe('villager');
      expect(game.guardManager.guardRequest).toBeNull;
      expect(game.guardManager.guardHistory[0]).toBe('villager');
    });
  });

  describe('guard', () => {
    it('護衛が行われる', () => {
      const game = gameManagers[mockGameId];
      game.playerManager.players = {
        hunter: {
          userId: 'hunter',
          userName: 'hunter',
          status: 'alive',
          role: 'hunter',
        },
        villager: {
          userId: 'villager',
          userName: 'villager',
          status: 'alive',
          role: 'villager',
        },
      };
      game.guardManager.guardRequest = 'villager';

      expect(game.guardManager.guard('villager')).toBe(true);
      expect(game.guardManager.guardRequest).toBeNull;
      expect(game.guardManager.guardHistory[0]).toBe('villager');
    });
  });

  describe('getGuardHistory', () => {
    it('護衛結果が正しい形式で返されること', () => {
      const game = gameManagers[mockGameId];
      game.guardManager.guardHistory = { 0: 'villager' };

      const guardHistory = game.guardManager.getGuardHistory('hunter');
      expect(guardHistory).toEqual({ 0: 'villager' });
    });

    it('プレイヤーが狩人でないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      expect(game.playerManager.players.villager).toBeDefined();
      expect(() => game.guardManager.getGuardHistory('villager')).toThrow();
    });

    it('プレイヤーが存在しないときエラーを返す', () => {
      const game = gameManagers[mockGameId];
      expect(game.playerManager.players.notExist).toBeUndefined();
      expect(() => game.guardManager.getGuardHistory('notExist')).toThrow();
    });
  });
});
